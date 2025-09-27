import 'dotenv/config';
import { describe, it, expect, beforeAll } from 'vitest';
import { PrismaClient } from '@/lib/generated/prisma';
import { deleteCompany } from '@/lib/tools/deleteCompany';
import { createAdminClient } from '@/lib/supabase/admin';

const prisma = new PrismaClient();

describe('deleteCompany tool', () => {
  let companyId: bigint;
  let userId: string;

  beforeAll(async () => {
    // Create a real auth user via Supabase so the public.profiles FK is satisfied
    const admin = createAdminClient();
    const email = `deleteco_${Date.now()}@example.com`;
    const password = 'Test1234!';
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user!.id;

    // Wait for profiles row to be created by trigger
    for (let i = 0; i < 20; i++) {
      const p = await prisma.profiles.findUnique({ where: { id: userId } });
      if (p) break;
      await new Promise((r) => setTimeout(r, 100));
    }

    // Create a company for the test via Supabase REST to avoid identity issues
    const { data: companyRow, error: companyError } = await admin
      .from('companies')
      .insert({
        name: `DeleteCo ${Date.now()}`,
        owner_user_id: userId,
        metadata: { seededBy: 'vitest' },
      })
      .select('id')
      .single();
    if (companyError) throw companyError;
    companyId = BigInt(companyRow!.id);

    // Create related rows to exercise cascades and FKs
    const template = await prisma.asset_tag_templates.create({
      data: { company_id: companyId, created_by: userId, template: { name: 't' } as any },
      select: { id: true },
    });

    // Location (created_by required)
    const location = await prisma.locations.create({
      data: { name: 'L', created_by: userId, company_id: companyId },
      select: { id: true },
    });

    // Article with equipment referencing it
    const article = await prisma.articles.create({
      data: {
        name: 'A',
        created_by: userId,
        company_id: companyId,
        default_location: location.id,
      },
      select: { id: true },
    });

    // Asset tag referencing template
    const assetTag = await prisma.asset_tags.create({
      data: {
        company_id: companyId,
        created_by: userId,
        printed_code: 'CODE-1',
        printed_template: template.id,
      },
      select: { id: true },
    });

    // Equipment referencing article and asset tag
    await prisma.equipments.create({
      data: {
        company_id: companyId,
        created_by: userId,
        article_id: article.id,
        asset_tag: assetTag.id,
        current_location: location.id,
      },
    });

    // Customer and Job with booked/on_job assets
    const customer = await prisma.customers.create({
      data: { company_id: companyId, created_by: userId, type: 'personal' },
      select: { id: true },
    });
    const job = await prisma.jobs.create({
      data: { company_id: companyId, customer_id: customer.id, name: 'J' },
      select: { id: true },
    });

    // Use first equipment for reservations/assignments
    const eq = await prisma.equipments.findFirstOrThrow({ where: { company_id: companyId }, select: { id: true } });
    await prisma.job_booked_assets.create({ data: { company_id: companyId, job_id: job.id, equipment_id: eq.id } });
    await prisma.job_assets_on_job.create({ data: { company_id: companyId, job_id: job.id, equipment_id: eq.id } });

    // History entry
    await prisma.history.create({
      data: { company_id: companyId, table_name: 'articles', data_id: article.id, old_data: { a: 1 } as any },
    });

    // Membership
    await prisma.users_companies.create({ data: { company_id: companyId, user_id: userId } });

    // NFC tag
    await prisma.nfc_tags.create({ data: { company_id: companyId, created_by: userId, tag_id: 'T-1' } });
  });

  it('removes the company and all dependent rows', async () => {
    // Sanity: data exists
    const preCounts = await Promise.all([
      prisma.articles.count({ where: { company_id: companyId } }),
      prisma.equipments.count({ where: { company_id: companyId } }),
      prisma.asset_tags.count({ where: { company_id: companyId } }),
      prisma.asset_tag_templates.count({ where: { company_id: companyId } }),
      prisma.jobs.count({ where: { company_id: companyId } }),
      prisma.job_booked_assets.count({ where: { company_id: companyId } }),
      prisma.job_assets_on_job.count({ where: { company_id: companyId } }),
      prisma.locations.count({ where: { company_id: companyId } }),
      prisma.customers.count({ where: { company_id: companyId } }),
      prisma.history.count({ where: { company_id: companyId } }),
      prisma.users_companies.count({ where: { company_id: companyId } }),
      prisma.nfc_tags.count({ where: { company_id: companyId } }),
    ]);
    expect(preCounts.some((c) => c > 0)).toBe(true);

    await deleteCompany([{ id: companyId }]);

    // All gone
    const postCounts = await Promise.all([
      prisma.companies.count({ where: { id: companyId } }),
      prisma.articles.count({ where: { company_id: companyId } }),
      prisma.equipments.count({ where: { company_id: companyId } }),
      prisma.asset_tags.count({ where: { company_id: companyId } }),
      prisma.asset_tag_templates.count({ where: { company_id: companyId } }),
      prisma.jobs.count({ where: { company_id: companyId } }),
      prisma.job_booked_assets.count({ where: { company_id: companyId } }),
      prisma.job_assets_on_job.count({ where: { company_id: companyId } }),
      prisma.locations.count({ where: { company_id: companyId } }),
      prisma.customers.count({ where: { company_id: companyId } }),
      prisma.history.count({ where: { company_id: companyId } }),
      prisma.users_companies.count({ where: { company_id: companyId } }),
      prisma.nfc_tags.count({ where: { company_id: companyId } }),
    ]);
    expect(postCounts.every((c) => c === 0)).toBe(true);
  });
});
