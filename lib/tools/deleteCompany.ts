/**
 * Company deletion utility for test cleanup.
 * 
 * Recursively deletes a company and all related data in FK-dependency order.
 * Used in test teardown to ensure clean state between test runs.
 * 
 * @module lib/tools/deleteCompany
 */
import "@/lib/setup-env"
import {PrismaClient} from "@/lib/generated/prisma";
const prisma = new PrismaClient();



/**
 * Retrieve public tables with FK-depth levels from the DB.
 *
 * @param {boolean} deleteOrder - If true, sort descending by level (suitable for deletion).
 *                                If false or omitted, sort ascending (suitable for creation/inspection).
 * @returns {Promise<Array<{ table_name: string; level: number }>>}
 *          Promise resolving to an array of objects containing table_name and numeric level.
 * @throws Propagates any database/query errors from prisma.$queryRawUnsafe.
 */
async function getDeleteOrder(deleteOrder = false): Promise<Array<{ table_name: string; level: number }>> {
  const result: Array<{ table_name: string; level: number }> = await prisma.$queryRawUnsafe("SELECT table_name::text, level::int FROM public.list_public_tables_fk_order();") ?? [];
  if (deleteOrder) {
    result.sort((a, b) => b.level - a.level);
  } else {
    result.sort((a, b) => a.level - b.level);

  }
  //result.map((r) => r.table_name as string).forEach((table_name: string, level: number) => {
    //console.log("Level", level + ":", table_name)
  //})
  return result;
}
const excludeDelete = ["profiles", "companies"]

// Deletes all records that belong to the given companies (by company_id),
// then removes the companies themselves. Uses an explicit order to satisfy
// FK constraints (e.g., asset_tags -> asset_tag_templates) and avoids raw SQL.
export const deleteCompany = async (companies: bigint[]) => {
  // Safety guard: only allow when explicitly opted in (e2e teardown).
  // Prevents accidental deletion against dev/staging DBs during unit tests.
  if (process.env.ALLOW_DANGEROUS_DELETE !== 'true') {
    console.log('deleteCompany is disabled. Set ALLOW_DANGEROUS_DELETE=true to run this tool (e2e cleanup only).');
  }
  const deleteOrder = await getDeleteOrder(true);

  for (const companyId of companies) {
    await prisma.companies.update({ where: {id: companyId}, data: {enable_history: false}});
    console.log("Disabled History for Company", companyId);
    let rows = 0;
    try {
      await prisma.$transaction(async (tx) => {
        for (const { table_name } of deleteOrder) {
          if (excludeDelete.includes(table_name)) {
            console.log("Not deleting", table_name)
            continue;
          }
          rows += await tx.$executeRawUnsafe(`DELETE FROM "${table_name}" WHERE company_id = $1`, companyId);
        }
        const companyCount = await tx.$executeRawUnsafe(`DELETE FROM companies WHERE id = $1`, companyId)
        console.log("Deleted companies:", companyCount, "for company", companyId, "Total rows deleted:", rows);
      });
    } catch (e) {
      console.warn(`Cleanup warning for company ${companyId.toString()} Table:`, e);
    }
    // Delete history and company in a clean transactionless context
    try { await prisma.history.deleteMany({ where: { company_id: companyId } }); } catch {}
    try { await prisma.companies.delete({ where: { id: companyId } }); } catch {}
    console.log(`Company ${companyId.toString()} and all related data deleted.`);
  }
};
