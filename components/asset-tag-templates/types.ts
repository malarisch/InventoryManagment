
export type AssetTagTemplateElement = {
  type: 'text' | 'qrcode' | 'barcode';
  x: number;
  y: number;
  value: string;
};

export type AssetTagTemplate = {
  name: string;
  width: number;
  height: number;
  elements: AssetTagTemplateElement[];
};
