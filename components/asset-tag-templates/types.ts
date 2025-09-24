
export type AssetTagTemplateElement = {
  type: 'text' | 'qrcode' | 'barcode' | 'image';
  x: number;
  y: number;
  value: string; // text, placeholder, or image URL for type=image
  size?: number; // Font size OR square size / width
  height?: number; // optional height for images (falls back to size if omitted)
  color?: string; // Color override (ignored for image except maybe tint future)
};

export type AssetTagTemplate = {
  // Basic template info
  name: string;
  description?: string;
  
  // Physical dimensions
  tagWidthMm: number;
  tagHeightMm: number;
  marginMm?: number;
  
  // Visual styling
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidthMm?: number;
  textSizePt?: number;
  isMonochrome?: boolean;
  
  // Code generation settings
  prefix?: string;
  numberLength?: number;
  suffix?: string;
  numberingScheme?: 'sequential' | 'random';
  stringTemplate?: string; // e.g., "{prefix}-{number}-{suffix}"
  codeType?: 'QR' | 'Barcode' | 'None';
  codeSizeMm?: number;
  
  // Template elements (visual layout)
  elements: AssetTagTemplateElement[];
  
  // Advanced settings
  svgFileId?: string;
  generatorURL?: string;
  placeholders?: { [key: string]: string };
};
