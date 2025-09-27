import "dotenv/config";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// Deletes all records that belong to the given companies (by company_id),
// then removes the companies themselves. Uses an explicit order to satisfy
// FK constraints (e.g., asset_tags -> asset_tag_templates) and avoids raw SQL.
export const deleteCompany = async (companies: Array<{ id: bigint }>) => {
  for (const company of companies) {
    const companyId = company.id; // bigint

    await prisma.$transaction(async (tx) => {
      // Job assignment tables first (they reference jobs, equipments, cases)
      await tx.job_assets_on_job.deleteMany({ where: { company_id: companyId } });
      await tx.job_booked_assets.deleteMany({ where: { company_id: companyId } });

      // Core entities
      await tx.jobs.deleteMany({ where: { company_id: companyId } });
      await tx.cases.deleteMany({ where: { company_id: companyId } });
      await tx.equipments.deleteMany({ where: { company_id: companyId } });
      await tx.articles.deleteMany({ where: { company_id: companyId } });
      await tx.locations.deleteMany({ where: { company_id: companyId } });
      await tx.customers.deleteMany({ where: { company_id: companyId } });
      await tx.nfc_tags.deleteMany({ where: { company_id: companyId } });

      // Asset tags before templates because of FK from asset_tags.printed_template -> asset_tag_templates.id
      await tx.asset_tags.deleteMany({ where: { company_id: companyId } });
      await tx.asset_tag_templates.deleteMany({ where: { company_id: companyId } });

      // Historical data and memberships
      await tx.history.deleteMany({ where: { company_id: companyId } });
      await tx.users_companies.deleteMany({ where: { company_id: companyId } });

      // Finally the company row
      await tx.companies.delete({ where: { id: companyId } });
    });

    // Optional log for visibility during test teardown
    console.log(`Company ${companyId.toString()} and all related data deleted.`);
  }
};
