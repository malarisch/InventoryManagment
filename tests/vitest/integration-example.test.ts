/**
 * Example integration test demonstrating comprehensive cleanup patterns
 * 
 * This test shows how to create and clean up business entities
 * using the cleanup utility for consistent test data management.
 */

import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCleanupTracker, cleanupTestData, createTestUser, createTestCompany } from "./utils/cleanup";

// Integration example is opt-in. Set RUN_INTEGRATION_TESTS=true to run these tests
const RUN_INTEGRATION = (process.env.RUN_INTEGRATION_TESTS || process.env.RUN_INTEGRATION || "false").toLowerCase();
if (RUN_INTEGRATION !== "true" && RUN_INTEGRATION !== "1") {
  describe.skip("Integration test example (skipped)", () => {
    test.skip("set RUN_INTEGRATION_TESTS=1 to run integration tests", () => {});
  });
} else {
  describe("Integration test example with comprehensive cleanup", () => {
    const admin = createAdminClient();
    const cleanup = createCleanupTracker();

    let testUser: { userId: string; email: string; password: string };
    let testCompany: { companyId: number; membershipId: number };

    beforeAll(async () => {
      // Create test user and company using utilities
      testUser = await createTestUser(cleanup);
      testCompany = await createTestCompany(cleanup, testUser.userId);
    }, 30_000);

    afterAll(async () => {
      // Cleanup all created data automatically
      await cleanupTestData(cleanup);
    });

    test("can create and track business entities for cleanup", async () => {
      // Create test location and track for cleanup
      const { data: locationData, error: locationError } = await admin
        .from("locations")
        .insert({
          name: "Test Location",
          description: "Integration test location",
          company_id: testCompany.companyId,
          created_by: testUser.userId,
        })
        .select("id")
        .single();

      expect(locationError).toBeNull();
      expect(locationData?.id).toBeTruthy();

      // Track for cleanup
      if (locationData?.id) {
        cleanup.locationIds.push(locationData.id);
      }

      // Create test article and track for cleanup  
      const { data: articleData, error: articleError } = await admin
        .from("articles")
        .insert({
          name: "Test Article",
          description: "Integration test article",
          company_id: testCompany.companyId,
          created_by: testUser.userId,
        })
        .select("id")
        .single();

      expect(articleError).toBeNull();
      expect(articleData?.id).toBeTruthy();

      // Track for cleanup
      if (articleData?.id) {
        cleanup.articleIds.push(articleData.id);
      }

      // Create test equipment and track for cleanup
      const { data: equipmentData, error: equipmentError } = await admin
        .from("equipments")
        .insert({
          article_id: articleData!.id,
          company_id: testCompany.companyId,
          created_by: testUser.userId,
          current_location: locationData?.id,
        })
        .select("id")
        .single();

      expect(equipmentError).toBeNull();
      expect(equipmentData?.id).toBeTruthy();

      // Track for cleanup
      if (equipmentData?.id) {
        cleanup.equipmentIds.push(equipmentData.id);
      }

      // Verify all entities were created correctly
      expect(locationData?.id).toBeTruthy();
      expect(articleData?.id).toBeTruthy(); 
      expect(equipmentData?.id).toBeTruthy();
    });

    test("cleanup tracker contains all created entities", () => {
      // Verify cleanup tracker has registered our test data
      expect(cleanup.userIds).toContain(testUser.userId);
      expect(cleanup.companyIds).toContain(testCompany.companyId);
      expect(cleanup.membershipIds).toContain(testCompany.membershipId);
      
      // These will be populated by the previous test
      expect(cleanup.locationIds.length).toBeGreaterThan(0);
      expect(cleanup.articleIds.length).toBeGreaterThan(0);
      expect(cleanup.equipmentIds.length).toBeGreaterThan(0);
    });
  });
}