import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, Prisma } from '@/lib/generated/prisma';
import { getCompanyData, importCompanyData } from '@/lib/importexport';
import { createCleanupTracker, cleanupTestData, createTestUser, createTestCompany } from './utils/cleanup';

const prisma = new PrismaClient();

// Skip this suite by default; enable with RUN_IMPORTEXPORT_E2E=true
// and ensure Supabase env vars are present.
const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
const shouldRun = process.env.RUN_IMPORTEXPORT_E2E === 'true' && hasSupabaseEnv;
const maybeDescribe = shouldRun ? describe : describe.skip;

maybeDescribe('importexport end-to-end', () => {
  const cleanup = createCleanupTracker();
  let ownerUserId: string;
  let importingUserId: string;
  let companyId: bigint;

  beforeAll(async () => {
    // Create two users: one as original owner (seed data), one for importing
    const u1 = await createTestUser(cleanup);
    const u2 = await createTestUser(cleanup);
    ownerUserId = u1.userId;
    importingUserId = u2.userId;

    // Ensure profiles rows exist for both users (FK target on created_by etc.)
    await prisma.profiles.upsert({
      where: { id: ownerUserId },
      update: {},
      create: { id: ownerUserId, first_name: 'Owner', last_name: 'User', email: 'owner@test.local' },
    });
    await prisma.profiles.upsert({
      where: { id: importingUserId },
      update: {},
      create: { id: importingUserId, first_name: 'Importer', last_name: 'User', email: 'import@test.local' },
    });

    // Create an original company owned by ownerUserId (also creates membership)
    const { companyId: cid } = await createTestCompany(cleanup, ownerUserId, `ImportExport Test Co ${Date.now()}`);
    companyId = BigInt(cid);

    // Seed: asset tag template
    const template = await prisma.asset_tag_templates.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        template: Prisma.JsonNull,
      },
    });

    // Seed: NFC tag
    const nfc = await prisma.nfc_tags.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        tag_id: `TAG-${Date.now()}`,
      },
    });

    // Seed: asset tag referencing template + nfc
    const atag = await prisma.asset_tags.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        printed_code: 'AT-001',
        printed_applied: false,
        printed_template: template.id,
        nfc_tag_id: nfc.id,
      },
    });

    // Seed: location referencing asset tag
    const loc = await prisma.locations.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        name: 'Main Warehouse',
        description: 'Seed location',
        asset_tag: atag.id,
        files: Prisma.JsonNull,
        // is_workshop is present in schema
        is_workshop: true,
      },
    });

    // Seed: article with default location + asset tag
    const art = await prisma.articles.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        name: 'LED PAR',
        metadata: Prisma.JsonNull,
        default_location: loc.id,
        asset_tag: atag.id,
        files: Prisma.JsonNull,
      },
    });

    // Seed: equipment linked to article, location, asset tag
    const eq = await prisma.equipments.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        article_id: art.id,
        current_location: loc.id,
        asset_tag: atag.id,
        added_to_inventory_at: new Date(),
        metadata: Prisma.JsonNull,
        files: Prisma.JsonNull,
      },
    });

    // Seed: contact/customer
    const contact = await prisma.contacts.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        contact_type: 'customer',
        display_name: 'Example Customer',
        email: 'customer@example.com',
        metadata: Prisma.JsonNull,
        files: Prisma.JsonNull,
      },
    });

    // Seed: job linked to contact
    const job = await prisma.jobs.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        contact_id: contact.id,
        startdate: new Date(Date.now() - 86400000),
        enddate: new Date(Date.now() + 86400000),
        name: 'Festival Build',
        type: 'event',
        meta: Prisma.JsonNull,
        files: Prisma.JsonNull,
      },
    });

    // Seed: case containing equipment and at location
    const kase = await prisma.cases.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        name: 'Roadcase 1',
        description: 'Holds lamps',
        asset_tag: atag.id,
        case_equipment: eq.id,
        current_location: loc.id,
        contains_equipments: [eq.id],
        contains_articles: [],
        files: Prisma.JsonNull,
      },
    });

    // Seed: job assets relationships
    await prisma.job_assets_on_job.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        job_id: job.id,
        equipment_id: eq.id,
      },
    });

    await prisma.job_booked_assets.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        job_id: job.id,
        case_id: kase.id,
      },
    });

    // Seed: workshop todo (equipment + case)
    await prisma.workshop_todos.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        equipment_id: eq.id,
        case_id: kase.id,
        title: 'Check cables',
        notes: 'Inspect cable ends',
        status: 'open',
        due_date: new Date(),
        closed_at: null,
        files: Prisma.JsonNull,
      },
    });

    // Seed: maintenance log
    await prisma.maintenance_logs.create({
      data: {
        company_id: companyId,
        created_by: ownerUserId,
        performed_by: ownerUserId,
        performed_at: new Date(),
        equipment_id: eq.id,
        case_id: kase.id,
        title: 'Fan cleaned',
        notes: 'Removed dust',
      },
    });
  });

  afterAll(async () => {
    await cleanupTestData(cleanup);
  });

  it('exports, imports, and preserves entities', async () => {
    // Export original company data
    const exported = await getCompanyData(companyId.toString());
    expect(exported).toBeTruthy();
    if (!exported) throw new Error('Failed to export test company');

    // Import under a different user (always creates a new company)
    const newCompany = await importCompanyData(exported, importingUserId);
    expect(newCompany?.id).toBeTruthy();
    const newCompanyId = newCompany!.id;
    cleanup.companyIds.push(Number(newCompanyId));

    // Helper to count entities by company for both companies
    const countFor = async (table: keyof PrismaClient, cid: bigint) => {
      // @ts-expect-error dynamic access of prisma delegates
      return prisma[table].count({ where: { company_id: cid } });
    };

    // Compare counts for core tables
    const tables: string[] = [
      'asset_tag_templates', 'nfc_tags', 'asset_tags', 'locations', 'articles',
      'equipments', 'contacts', 'jobs', 'cases', 'job_assets_on_job', 'job_booked_assets',
      'workshop_todos', 'maintenance_logs'
    ];

    for (const t of tables) {
  const a = await countFor(t as unknown as keyof PrismaClient, companyId);
  const b = await countFor(t as unknown as keyof PrismaClient, newCompanyId);
      expect(b).toBe(a);
    }

    // History should be at least as many rows (import may add extra from triggers)
    const origHistory = await prisma.history.count({ where: { company_id: companyId } });
    const newHistory = await prisma.history.count({ where: { company_id: newCompanyId } });
    expect(newHistory).toBeGreaterThanOrEqual(origHistory);

    // All imported equipments created_by should be importingUserId
    const equipMismatches = await prisma.equipments.count({ where: { company_id: newCompanyId, NOT: { created_by: importingUserId } } });
    expect(equipMismatches).toBe(0);

    // Imported membership exists for importing user
    const membership = await prisma.users_companies.findFirst({ where: { company_id: newCompanyId, user_id: importingUserId } });
    expect(membership?.id).toBeTruthy();

    // Asset tag relations preserved
    const importedAtag = await prisma.asset_tags.findFirst({ where: { company_id: newCompanyId } });
    expect(importedAtag?.printed_template).toBeTruthy();
  });
});
