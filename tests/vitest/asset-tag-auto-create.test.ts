import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client BEFORE importing module under test (avoids hoist ordering issues)
vi.mock('@/lib/supabase/client', () => {
  const insertMock = vi.fn();
  const updateMock = vi.fn();
  const eqMock = vi.fn();
  const singleOk = () => Promise.resolve({ data: { id: 123 }, error: null });
  const mocks = {
    insertMock,
    updateMock,
    eqMock,
    reset() { insertMock.mockReset(); updateMock.mockReset(); eqMock.mockReset(); }
  };
  const supabase = {
    from: (table: string) => ({
      insert: (row: Record<string, unknown>) => { insertMock(table, row); return { select: () => ({ single: () => singleOk() }) }; },
      update: (row: Record<string, unknown>) => { updateMock(table, row); return { eq: (col?: string, val?: unknown) => { eqMock(col, val); return Promise.resolve({ error: null }); } }; },
      select: () => ({ single: () => singleOk() })
    }),
    _mocks: mocks
  };
  return { createClient: () => supabase };
});

import { createAndAttachAssetTag } from '@/lib/asset-tags/auto-create';
import { createClient } from '@/lib/supabase/client';

interface InsertPayload { [k: string]: unknown }
interface UpdatePayload { [k: string]: unknown }

// Provide required structural fields with minimal plausible values
const companyMeta: import('@/components/metadataTypes.types').adminCompanyMetadata = {
  companyWidePrefix: 'CW',
  assetTagArticlePrefix: 'ART',
  assetTagEquipmentPrefix: 'EQ',
  assetTagCasePrefix: 'CA',
  assetTagLocationPrefix: 'LOC',
  standardData: {
    taxRate: 0,
    currency: 'EUR',
    power: { powerType: 'AC', maxPowerW: 0 },
  },
  customTypes: {
    articleTypes: [],
    caseTypes: [],
    locationTypes: []
  }
};

describe('createAndAttachAssetTag', () => {
  interface SupabaseMockWrapper { _mocks: { insertMock: { mock: { calls: unknown[][] } }; updateMock: { mock: { calls: unknown[][] } }; reset(): void } }
  function getMockWrapper(): SupabaseMockWrapper {
    return createClient() as unknown as SupabaseMockWrapper;
  }

  beforeEach(() => {
    getMockWrapper()._mocks.reset();
  });

  it('creates tag and updates entity with composed code', async () => {
    const id = await createAndAttachAssetTag({
      companyId: 1,
      userId: 'user-1',
      entity: 'equipment',
      entityId: 55,
      table: 'equipments',
      templateId: 9,
      companyMeta
    });
    expect(id).toBe(123);
  const insertArgs = getMockWrapper()._mocks.insertMock.mock.calls[0];
    expect(insertArgs[0]).toBe('asset_tags');
    const insertedRow = insertArgs[1] as InsertPayload;
    expect(insertedRow.printed_code).toContain('EQ');
  const updateArgs = getMockWrapper()._mocks.updateMock.mock.calls[0];
    expect(updateArgs[0]).toBe('equipments');
    const updatedRow = updateArgs[1] as UpdatePayload;
    expect(updatedRow.asset_tag).toBe(123);
  });

  it('falls back to plain id when no companyMeta', async () => {
    const id = await createAndAttachAssetTag({
      companyId: 1,
      userId: 'user-1',
      entity: 'location',
      entityId: 7,
      table: 'locations',
      templateId: 3,
      companyMeta: null
    });
    expect(id).toBe(123);
  });
});
