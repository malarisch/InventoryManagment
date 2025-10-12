// Scanner types and interfaces

export type ScanMode = 'asset' | 'location';

export type ScannedEntityType = 'equipment' | 'case' | 'location' | 'article' | 'unknown';

export interface ScannedEntity {
  type: ScannedEntityType;
  id: string;
  name: string;
  code: string;
  details?: {
    article?: string;
    currentLocation?: string;
    caseEquipment?: string;
    description?: string;
  };
}

export interface ActiveTarget {
  type: 'location' | 'case';
  id: string;
  name: string;
}

export interface ScanLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  entity: ScannedEntity;
  status: 'success' | 'error' | 'warning';
  message: string;
}
