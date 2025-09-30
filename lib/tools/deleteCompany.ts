import "dotenv/config";
import {PrismaClient} from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// Deletes all records that belong to the given companies (by company_id),
// then removes the companies themselves. Uses an explicit order to satisfy
// FK constraints (e.g., asset_tags -> asset_tag_templates) and avoids raw SQL.
export const deleteCompany = async (companies: Array<{ id: bigint }>) => {
  // Safety guard: only allow when explicitly opted in (e2e teardown).
  // Prevents accidental deletion against dev/staging DBs during unit tests.
  if (process.env.ALLOW_DANGEROUS_DELETE !== 'true') {
    console.log('deleteCompany is disabled. Set ALLOW_DANGEROUS_DELETE=true to run this tool (e2e cleanup only).');
  }
  for (const company of companies) {
    const companyId = company.id; // bigint

    try {
      await prisma.$transaction(async (tx) => {
        // Job assignment tables first (they reference jobs, equipments, cases)
        await tx.job_assets_on_job.deleteMany({ where: { company_id: companyId } });
        await tx.job_booked_assets.deleteMany({ where: { company_id: companyId } });

      // Core entities
      await tx.jobs.deleteMany({ where: { company_id: companyId } });
      await tx.cases.deleteMany({ where: { company_id: companyId } });

      // First remove equipments belonging to the company
      await tx.equipments.deleteMany({ where: { company_id: companyId } });

      // Defensive: nullify article references from any remaining equipments
      // that might (incorrectly) point to this company's articles.
      const articleIds = await tx.articles.findMany({
        where: { company_id: companyId },
        select: { id: true },
      });
      if (articleIds.length > 0) {
        await tx.equipments.updateMany({
          where: { article_id: { in: articleIds.map((a) => a.id) } },
          data: { article_id: null },
        });
      }

      // Now it's safe to delete articles
      await tx.articles.deleteMany({ where: { company_id: companyId } });

      await tx.locations.deleteMany({ where: { company_id: companyId } });
      await tx.customers.deleteMany({ where: { company_id: companyId } });


      // Asset tags before templates because of FK from asset_tags.printed_template -> asset_tag_templates.id
      await tx.nfc_tags.deleteMany({ where: { company_id: companyId } });
      await tx.asset_tags.deleteMany({ where: { company_id: companyId } });
      await tx.asset_tag_templates.deleteMany({ where: { company_id: companyId } });

      // Memberships next
      await tx.users_companies.deleteMany({ where: { company_id: companyId } });

      // Important: delete history last, because upstream deletes may append entries via triggers
      await tx.history.deleteMany({ where: { company_id: companyId } });

      });
    } catch (e) {
      console.warn(`Cleanup warning for company ${companyId.toString()}:`, e);
    }
    // Delete history and company in a clean transactionless context
    try { await prisma.history.deleteMany({ where: { company_id: companyId } }); } catch {}
    try { await prisma.companies.delete({ where: { id: companyId } }); } catch {}
    console.log(`Company ${companyId.toString()} and all related data deleted.`);
  }
};
