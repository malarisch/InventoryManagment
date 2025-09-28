import { PrismaClient } from "@/lib/generated/prisma";

type Created = {
  userId: string;
  companyId: bigint;
  locationIds: bigint[];
  articleIds: bigint[];
  equipmentIds: bigint[];
  caseId: bigint;
  customerIds: bigint[];
  jobId: bigint;
  assetTagTemplateId: bigint;
  assetTagIds: bigint[];
};

const prisma = new PrismaClient();

async function getOrCreateUser(email: string, password: string) {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  // Try to create; if exists, fetch via listUsers and match by email
  const res = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (res.error && !res.data.user) {
    // Fallback: list and find by email
    let page = 1;
    for (;;) {
      const list = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      const found = list.data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (found) return found;
      if (!list.data.users.length) break;
      page += 1;
    }
    throw res.error;
  }
  return res.data.user!;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping seed in production environment");
    return;
  }

  const user = await getOrCreateUser("seed.user@example.com", "test-Password1!");

  // Upsert company owned by the user
  // Find existing by name to keep seeding idempotent
  let company = await prisma.companies.findFirst({ where: { name: "Seed Company" } });
  if (!company) {
    company = await prisma.companies.create({
      data: {
      name: "Seed Company",
      description: "Developer seed data",
      owner_user_id: user.id,
      metadata: {
        notes: "PRISMA_SEEDED",
        seededBy: "lib/tools/seed.ts",
        customTypes: {
          articleTypes: ["Lautsprecher", "Mischpult"],
          caseTypes: ["Flight Case", "Rack Case"],
          locationTypes: ["Regal", "Werkstatt"],
        },
        standardData: {
          power: { powerType: "AC", frequencyHz: "50Hz", voltageRangeV: "230V", powerConnectorType: "IEC C13" },
          taxRate: 19,
          currency: "EUR",
        },
        companyWidePrefix: "SC",
        assetTagCasePrefix: "CA",
        assetTagArticlePrefix: "AR",
        assetTagLocationPrefix: "LO",
        assetTagEquipmentPrefix: "EQ",
      },
      },
    });
  }

  // Ensure membership
  {
    const exists = await prisma.users_companies.findFirst({ where: { company_id: company.id, user_id: user.id } });
    if (!exists) await prisma.users_companies.create({ data: { company_id: company.id, user_id: user.id } });
  }

  // Basic Asset Tag Template
  const tmpl = await prisma.asset_tag_templates.create({
    data: {
      company_id: company.id,
      created_by: user.id,
      template: {
        name: "Default Seed Template",
        prefix: "SC",
        codeType: "QR",
        stringTemplate: "{prefix}-{number}",
        numberLength: 4,
        elements: [
          { type: "qrcode", value: "{printed_code}", x: 10, y: 10, size: 100 },
          { type: "text", value: "{printed_code}", x: 10, y: 115, size: 14 },
        ],
      },
    },
  });

  // Locations
  const locA = await prisma.locations.create({ data: { name: "Regal A", description: "Lager", company_id: company.id, created_by: user.id } });
  const locB = await prisma.locations.create({ data: { name: "Werkstatt", description: "Reparaturen", company_id: company.id, created_by: user.id } });

  // Articles
  const artMixer = await prisma.articles.create({
    data: {
      name: "Mischpult X12",
      company_id: company.id,
      created_by: user.id,
      default_location: locA.id,
      metadata: { type: "Mischpult", manufacturer: "Acme", model: "X12" },
    },
  });
  const artSpeaker = await prisma.articles.create({
    data: {
      name: "Lautsprecher PS15",
      company_id: company.id,
      created_by: user.id,
      default_location: locA.id,
      metadata: { type: "Lautsprecher", manufacturer: "Nexo", model: "PS15" },
    },
  });

  // Asset Tags
  const tag1 = await prisma.asset_tags.create({ data: { printed_template: tmpl.id, printed_code: "EQ-0001", company_id: company.id, created_by: user.id } });
  const tag2 = await prisma.asset_tags.create({ data: { printed_template: tmpl.id, printed_code: "EQ-0002", company_id: company.id, created_by: user.id } });

  // Equipments
  const eq1 = await prisma.equipments.create({
    data: {
      article_id: artMixer.id,
      company_id: company.id,
      created_by: user.id,
      current_location: locA.id,
      asset_tag: tag1.id,
      added_to_inventory_at: new Date().toISOString() as unknown as Date,
      metadata: { serialNumber: "MX12-0001" },
    },
  });
  const eq2 = await prisma.equipments.create({
    data: {
      article_id: artSpeaker.id,
      company_id: company.id,
      created_by: user.id,
      current_location: locB.id,
      asset_tag: tag2.id,
      added_to_inventory_at: new Date().toISOString() as unknown as Date,
      metadata: { serialNumber: "PS15-0001" },
    },
  });

  // Case containing eq2
  const kase = await prisma.cases.create({
    data: {
      name: "FOH Case",
      description: "Front of House",
      company_id: company.id,
      created_by: user.id,
      case_equipment: eq1.id,
    },
  });

  // Customers
  const custPrivate = await prisma.customers.create({
    data: {
      type: "private",
      forename: "Max",
      surname: "Mustermann",
      email: "max@example.com",
      company_id: company.id,
      created_by: user.id,
      metadata: { preferredContactMethod: "email" },
    },
  });
  const custCompany = await prisma.customers.create({
    data: {
      type: "company",
      company_name: "Event GmbH",
      email: "office@event.example",
      company_id: company.id,
      created_by: user.id,
      metadata: {},
    },
  });

  // Job
  const start = new Date();
  const end = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const job = await prisma.jobs.create({
    data: {
      name: "Konzert Stadtfest",
      type: "Konzert",
      job_location: "Marktplatz",
      startdate: start as unknown as Date,
      enddate: end as unknown as Date,
      company_id: company.id,
      created_by: user.id,
      customer_id: custCompany.id,
      meta: { stage: "Main" },
    },
  });

  // Bookings + Assignments
  await prisma.job_booked_assets.create({ data: { company_id: company.id, job_id: job.id, equipment_id: eq2.id, created_by: user.id } });
  await prisma.job_assets_on_job.create({ data: { company_id: company.id, job_id: job.id, equipment_id: eq1.id, created_by: user.id } });

  const snapshot: Created = {
    userId: user.id,
    companyId: company.id,
    locationIds: [locA.id, locB.id],
    articleIds: [artMixer.id, artSpeaker.id],
    equipmentIds: [eq1.id, eq2.id],
    caseId: kase.id,
    customerIds: [custPrivate.id, custCompany.id],
    jobId: job.id,
    assetTagTemplateId: tmpl.id,
    assetTagIds: [tag1.id, tag2.id],
  };

  console.log("Seed complete:", JSON.stringify(snapshot, null, 2));
}

main().finally(async () => {
  await prisma.$disconnect();
});
