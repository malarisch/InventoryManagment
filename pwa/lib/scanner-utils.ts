import type { SupabaseClient } from '@supabase/supabase-js';
import type { ScannedEntity, ScanLogEntry } from './scanner-types';

export async function lookupAssetByCode(
  supabase: SupabaseClient,
  code: string,
  companyId: string
): Promise<ScannedEntity | null> {
  // Try equipment first
  const { data: equipment } = await supabase
    .from('equipments')
    .select(`
      id,
      name,
      articles(name),
      current_location:locations(name),
      asset_tags!inner(printed_code)
    `)
    .eq('company_id', companyId)
    .eq('asset_tags.printed_code', code)
    .maybeSingle();

  if (equipment) {
    const articleData = equipment.articles as unknown as { name: string } | { name: string }[] | null;
    const locationData = equipment.current_location as unknown as { name: string } | { name: string }[] | null;
    
    return {
      type: 'equipment',
      id: equipment.id,
      name: equipment.name,
      code,
      details: {
        article: Array.isArray(articleData) ? articleData[0]?.name : articleData?.name,
        currentLocation: Array.isArray(locationData) ? locationData[0]?.name : locationData?.name
      }
    };
  }

  // Try location
  const { data: location } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      description,
      asset_tags!inner(printed_code)
    `)
    .eq('company_id', companyId)
    .eq('asset_tags.printed_code', code)
    .maybeSingle();

  if (location) {
    return {
      type: 'location',
      id: location.id,
      name: location.name,
      code,
      details: {
        description: location.description || undefined
      }
    };
  }

  // Try case
  const { data: caseData } = await supabase
    .from('cases')
    .select(`
      id,
      name,
      case_equipment:equipments!cases_case_equipment_fkey(
        id,
        name,
        current_location:locations(name)
      )
    `)
    .eq('company_id', companyId)
    .maybeSingle();

  // For cases, we need to check if the case_equipment has an asset tag matching the code
  if (caseData && caseData.case_equipment) {
    const caseEquipment = Array.isArray(caseData.case_equipment) 
      ? caseData.case_equipment[0] 
      : caseData.case_equipment;
    
    if (caseEquipment) {
      const { data: equipAssetTag } = await supabase
        .from('equipments')
        .select('asset_tags!inner(printed_code)')
        .eq('id', caseEquipment.id)
        .eq('asset_tags.printed_code', code)
        .maybeSingle();

      if (equipAssetTag) {
        const currentLoc = Array.isArray(caseEquipment.current_location)
          ? caseEquipment.current_location[0]
          : caseEquipment.current_location;

        return {
          type: 'case',
          id: caseData.id,
          name: caseData.name || caseEquipment.name,
          code,
          details: {
            caseEquipment: caseEquipment.name,
            currentLocation: currentLoc?.name
          }
        };
      }
    }
  }

  // Try article
  const { data: article } = await supabase
    .from('articles')
    .select(`
      id,
      name,
      asset_tags!inner(printed_code)
    `)
    .eq('company_id', companyId)
    .eq('asset_tags.printed_code', code)
    .maybeSingle();

  if (article) {
    return {
      type: 'article',
      id: article.id,
      name: article.name,
      code
    };
  }

  return null;
}

export function createLogEntry(
  action: string,
  entity: ScannedEntity,
  status: 'success' | 'error' | 'warning',
  message: string
): ScanLogEntry {
  return {
    id: Date.now().toString() + Math.random(),
    timestamp: new Date(),
    action,
    entity,
    status,
    message
  };
}
