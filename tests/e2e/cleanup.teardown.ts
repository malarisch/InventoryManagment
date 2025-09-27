import "dotenv/config";
import {test} from "../playwright_setup.types";
import {getCompanyAndUserId} from "@/lib/tools/dbhelpers";
import {PrismaClient} from "@/lib/generated/prisma";
import {deleteCompany} from "@/lib/tools/deleteCompany";

const prisma = new PrismaClient()

const requiredEnv = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
] as const;
const missing = requiredEnv.filter((key) => !process.env[key]);
const shouldSkip = missing.length > 0;

test.describe.configure({ mode: "serial" });



test.describe("Clean DB", () => {
    test.skip(shouldSkip, `Supabase env vars missing: ${missing.join(", ")}`);
    test("cleanup", async ( {
        companyName
    }) => {
        const companduser = await getCompanyAndUserId(companyName);
        const companies = await prisma.companies.findMany({where: {owner_user_id: companduser?.userId}})
        await deleteCompany(companies);


    })

});