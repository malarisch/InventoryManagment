# Vitest Test Data Cleanup Guide

This guide explains how to ensure all test data gets properly cleaned up after Vitest tests run, preventing test pollution and maintaining a clean test environment.

## Overview

The test suite includes a comprehensive cleanup system that automatically removes all created test data after tests complete. This ensures:
- No test data persists between test runs
- No interference between different test files
- Clean database state for reliable testing

## Cleanup Architecture

### 1. Cleanup Utilities (`tests/vitest/utils/cleanup.ts`)

The cleanup system provides:
- **`createCleanupTracker()`**: Creates a tracker for managing test data lifecycle
- **`cleanupTestData()`**: Comprehensive cleanup function that removes all tracked data
- **`createTestUser()`**: Helper to create test users with automatic tracking
- **`createTestCompany()`**: Helper to create test companies with automatic tracking

### 2. Cleanup Order

The cleanup function removes data in the correct order to respect foreign key constraints:

1. Business entities (jobs, equipment, cases, articles, customers, locations)
2. Company memberships (`users_companies`)
3. Companies
4. Auth users

## Usage Patterns

### Pattern 1: Simple Integration Tests

For tests that create business entities:

```typescript
import { createCleanupTracker, cleanupTestData } from "./utils/cleanup";

describe("My Integration Test", () => {
  const admin = createAdminClient();
  const cleanup = createCleanupTracker();

  afterAll(async () => {
    await cleanupTestData(cleanup);
  });

  test("creates and cleans up data", async () => {
    // Create test data
    const { data } = await admin.from("articles").insert({
      name: "Test Article",
      company_id: someCompanyId,
    }).select("id").single();

    // Track for cleanup
    if (data?.id) {
      cleanup.articleIds.push(data.id);
    }

    // Your test assertions...
  });
});
```

### Pattern 2: Full User/Company Setup

For tests that need complete user and company setup:

```typescript
import { createCleanupTracker, cleanupTestData, createTestUser, createTestCompany } from "./utils/cleanup";

describe("Full Setup Test", () => {
  const cleanup = createCleanupTracker();
  let testUser: { userId: string; email: string; password: string };
  let testCompany: { companyId: number; membershipId: number };

  beforeAll(async () => {
    testUser = await createTestUser(cleanup);
    testCompany = await createTestCompany(cleanup, testUser.userId);
  });

  afterAll(async () => {
    await cleanupTestData(cleanup);
  });

  // Your tests...
});
```

### Pattern 3: Manual Tracking (Existing Tests)

For existing tests that create data manually:

```typescript
describe("Existing Test", () => {
  const cleanup = createCleanupTracker();
  
  beforeAll(async () => {
    // Existing user creation code...
    const userId = "created-user-id";
    
    // Add to cleanup tracker
    cleanup.userIds.push(userId);
  });

  afterAll(async () => {
    await cleanupTestData(cleanup);
  });
});
```

## Entity Types Supported

The cleanup tracker supports all major business entities:

- **`userIds`**: Auth users (requires admin client)
- **`companyIds`**: Company records
- **`membershipIds`**: User-company memberships
- **`articleIds`**: Product definitions
- **`equipmentIds`**: Physical inventory items
- **`locationIds`**: Facility locations
- **`caseIds`**: Equipment cases
- **`customerIds`**: Customer contacts
- **`jobIds`**: Scheduled work

## Best Practices

### 1. Always Use afterAll()

```typescript
afterAll(async () => {
  await cleanupTestData(cleanup);
});
```

### 2. Track IDs Immediately After Creation

```typescript
const { data } = await admin.from("articles").insert(articleData).select("id").single();
if (data?.id) {
  cleanup.articleIds.push(data.id);
}
```

### 3. Use Helper Functions for Common Patterns

```typescript
// Instead of manual user creation
const testUser = await createTestUser(cleanup);

// Instead of manual company creation
const testCompany = await createTestCompany(cleanup, userId);
```

### 4. Test Cleanup in Development

Run individual test files to verify cleanup works:

```bash
npx vitest run tests/vitest/your-test.test.ts
```

Check your local database to ensure no test data remains.

## Error Handling

The cleanup function includes error handling to prevent masking test failures:
- Logs cleanup errors to console
- Does not throw errors that would hide test results
- Continues cleanup even if individual operations fail

## Environment Requirements

Integration tests require these environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Tests will skip automatically if these are missing.

## Examples

See these files for complete examples:
- `tests/vitest/supabase-seed.test.ts` - Updated existing test
- `tests/vitest/integration-example.test.ts` - Full example with business entities
- `tests/vitest/utils/cleanup.ts` - Core cleanup utilities