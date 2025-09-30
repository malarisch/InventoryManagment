import {STORAGE_STATE} from "@/playwright.config";
import "dotenv/config";
import {expect} from "@playwright/test";
import {test} from "../playwright_setup.types";
import {getUserIdByEmail} from "@/lib/tools/dbhelpers";
import {createAdminClient} from "@/lib/supabase/admin";

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
const missing = requiredEnv.filter((key) => !process.env[key]);
const shouldSkip = missing.length > 0;

test.describe.configure({ mode: "serial" });

let membershipId: number | string | null = null;
let companyId: number | string | null = null;
let userId: number | string | null = null;

test.describe("Login Setup", () => {
  test.skip(shouldSkip, `Supabase env vars missing: ${missing.join(", ")}`);
  test("creates user and company", async ({
    testEmail,
    testPassword,
    companyName,
  }) => {
    // Don't construct the admin client at module-eval time (it throws if env missing).
    // Create it during the test so we only attempt it when the suite actually runs.

    // Create the admin client now that the test run is starting
    const admin = createAdminClient();

    // Create test user
    try {
    const { data: createUserData, error: createUserError } =
      await admin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });
    if (createUserError) {
      throw createUserError;
    }
    userId = createUserData.user?.id ?? null;
  } catch (e: any) {
    // Reduce noisy stack traces when the user already exists in auth
    const code = e?.code || e?.error?.code;
    if (code === 'email_exists' || String(e?.message || '').includes('already been registered')) {
      console.warn('Test user already exists, continuing with existing account');
    } else {
      console.error("Error creating test user:", e);
    }
    userId = await getUserIdByEmail(testEmail);
    if (!userId) {
      return Promise.reject("Failed to create or find test user");
    }
  }
    

    // Create test company
    const { data: companyRow, error: companyError } = await admin
      .from("companies")
      .insert({
        name: companyName,
        description: "Playwright newlines test company",
        owner_user_id: userId,
        metadata: {
          notes: "PLAYWRIGHT_SEEDED",
          seededBy: "playwright",
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
            currency: "EUR"
          },
          "companyWidePrefix": "PW",
          "assetTagCasePrefix": "CA",
          "assetTagArticlePrefix": "AR",
          "assetTagLocationPrefix": "LO",
          "assetTagEquipmentPrefix": "EQ",

        },
      })
      .select("id")
      .single();
    if (companyError) {
      throw companyError;
    }
    companyId = companyRow?.id ?? null;

    // Create membership
    const { data: membershipRow, error: membershipError } = await admin
      .from("users_companies")
      .insert({ company_id: companyId!, user_id: userId! })
      .select("id")
      .single();
    if (membershipError) {
      throw membershipError;
    }
    membershipId = membershipRow?.id ?? null;
    if (!userId || !companyId || !membershipId) {
      throw new Error("Failed to create test user, company, or membership");
    }
  });

  test("logs in and saves storage state", async ({
    page,
    testEmail,
    testPassword
  }) => {
    // Navigate to the login page
    await page.goto("/auth/login");
    console.log("✅ Step 1: Navigated to /auth/login");

    // Fill in the login form
    await page.fill('input[type="email"]', testEmail || "test@test.test");
    await page.fill('input[type="password"]', testPassword || "password");
    console.log("✅ Step 2: Filled in login form");

    // Submit the login form
    await page.click('button[type="submit"]');
    console.log("✅ Step 3: Submitted login form");

    // Wait for the user to be redirected. Wait a bit longer since this is the first call to this route, rendering may take a bit longer...
    await page.waitForURL("/management", { timeout: 10000 });
    console.log("✅ Step 4: Redirected to /management");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/management");
    expect(await page.locator("#company-name").isVisible());

    console.log("✅ Step 4b: Verified presence of company name on page");
    // Save the storage state
    await page.context().storageState({ path: STORAGE_STATE });
    console.log("✅ Step 5: Saved storage state");
  });
});
