/**
 * Test cleanup utilities for Vitest integration tests
 * 
 * This module provides consistent patterns for cleaning up test data
 * to ensure tests don't leave artifacts in the database.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface TestCleanupTracker {
  userIds: string[];
  companyIds: number[];
  membershipIds: number[];
  articleIds: number[];
  equipmentIds: number[];
  locationIds: number[];
  caseIds: number[];
  contactIds: number[];
  jobIds: number[];
}

/**
 * Creates a cleanup tracker for managing test data lifecycle
 */
export function createCleanupTracker(): TestCleanupTracker {
  return {
    userIds: [],
    companyIds: [],
    membershipIds: [],
    articleIds: [],
    equipmentIds: [],
    locationIds: [],
    caseIds: [],
    contactIds: [],
    jobIds: [],
  };
}

/**
 * Comprehensive cleanup function that removes all tracked test data
 * 
 * Order of cleanup is important due to foreign key constraints:
 * 1. Remove business entities (jobs, equipment, etc.)
 * 2. Remove company memberships
 * 3. Remove companies
 * 4. Remove auth users
 */
export async function cleanupTestData(tracker: TestCleanupTracker): Promise<void> {
  const admin = createAdminClient();

  try {
    // Clean up business entities first (in reverse dependency order)
    if (tracker.jobIds.length > 0) {
      await admin.from("jobs").delete().in("id", tracker.jobIds);
    }

    if (tracker.equipmentIds.length > 0) {
      await admin.from("equipments").delete().in("id", tracker.equipmentIds);
    }

    if (tracker.caseIds.length > 0) {
      await admin.from("cases").delete().in("id", tracker.caseIds);
    }

    if (tracker.articleIds.length > 0) {
      await admin.from("articles").delete().in("id", tracker.articleIds);
    }

    if (tracker.contactIds.length > 0) {
      await admin.from("contacts").delete().in("id", tracker.contactIds);
    }

    if (tracker.locationIds.length > 0) {
      await admin.from("locations").delete().in("id", tracker.locationIds);
    }

    // Clean up company memberships
    if (tracker.membershipIds.length > 0) {
      await admin.from("users_companies").delete().in("id", tracker.membershipIds);
    }

    // Clean up companies
    if (tracker.companyIds.length > 0) {
      await admin.from("companies").delete().in("id", tracker.companyIds);
    }

    // Clean up auth users last
    if (tracker.userIds.length > 0) {
      for (const userId of tracker.userIds) {
        await admin.auth.admin.deleteUser(userId);
      }
    }
  } catch (error) {
    console.error("Error during test cleanup:", error);
    // Don't throw to avoid masking test failures
  }
}

/**
 * Helper function to create a test user with automatic cleanup tracking
 */
export async function createTestUser(
  tracker: TestCleanupTracker,
  email?: string,
  password?: string
): Promise<{ userId: string; email: string; password: string }> {
  const admin = createAdminClient();
  const timestamp = Date.now();
  
  const testEmail = email || `vitest+${timestamp}@example.com`;
  const testPassword = password || `SupabaseTest-${timestamp}!`;

  const { data: createUserData, error: createUserError } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      display_name: "Vitest Runner",
      source: "automated-test",
    },
  });

  if (createUserError) {
    throw createUserError;
  }

  if (!createUserData.user?.id) {
    throw new Error("Failed to create test user: no user ID returned");
  }

  tracker.userIds.push(createUserData.user.id);

  return {
    userId: createUserData.user.id,
    email: testEmail,
    password: testPassword,
  };
}

/**
 * Helper function to create a test company with automatic cleanup tracking
 */
export async function createTestCompany(
  tracker: TestCleanupTracker,
  ownerUserId: string,
  name?: string
): Promise<{ companyId: number; membershipId: number }> {
  const admin = createAdminClient();
  const timestamp = Date.now();
  
  const companyName = name || `Vitest Company ${timestamp}`;

  const { data: companyData, error: companyError } = await admin
    .from("companies")
    .insert({
      name: companyName,
      description: "Test company created by Vitest",
      owner_user_id: ownerUserId,
    })
    .select("id")
    .single();

  if (companyError) {
    throw companyError;
  }

  if (!companyData?.id) {
    throw new Error("Failed to create test company: no company ID returned");
  }

  tracker.companyIds.push(companyData.id);

  // Create membership
  const { data: membershipData, error: membershipError } = await admin
    .from("users_companies")
    .insert({
      company_id: companyData.id,
      user_id: ownerUserId,
    })
    .select("id")
    .single();

  if (membershipError) {
    throw membershipError;
  }

  if (!membershipData?.id) {
    throw new Error("Failed to create test membership: no membership ID returned");
  }

  tracker.membershipIds.push(membershipData.id);

  return {
    companyId: companyData.id,
    membershipId: membershipData.id,
  };
}
