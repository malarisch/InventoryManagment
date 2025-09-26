import {PrismaClient} from "@/lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping seed in production environment");
    return;
  }
  const { createAdminClient } = await import("@/lib/supabase/admin");
  // Create the admin client now that the test run is starting
  const admin = createAdminClient();

  // Create User
  const user = await admin.auth.admin.createUser({
    email: "test@test.de",
    password: "test",
    email_confirm: true,
  });
  // Create Company
  const company = await prisma.companies.create({
    data: {
      name: "Test Company",
      owner_user_id: user.data.user?.id || "",
      metadata: {
        notes: "PRISMA_SEEDED",
        seededBy: "PRISMA",
        customTypes: {
          articleTypes: ["InitialArticleType"],
          caseTypes: ["InitialCaseType"],
          locationTypes: ["InitialLocationType"],
        },
        standardData: {
          power: {
            powerType: "AC",
            frequencyHz: "50Hz",
            voltageRangeV: "230V",
            powerConnectorType: "",
          },
          taxRate: 19,
          currency: "EUR",
        },
        companyWidePrefix: "PW",
        assetTagCasePrefix: "CA",
        assetTagArticlePrefix: "AR",
        assetTagLocationPrefix: "LO",
        assetTagEquipmentPrefix: "EQ",
      },
    },
  });
  await prisma.users_companies.create({
    data: {
      company_id: company.id,
      user_id: user.data.user?.id || "",
    },
  });
}

main();
