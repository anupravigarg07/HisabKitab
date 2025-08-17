export interface SheetConfig {
  name: string;
  headers: string[];
}

export const GOOGLE_APIS = {
  SHEETS_BASE_URL: 'https://sheets.googleapis.com/v4/spreadsheets',
  DRIVE_BASE_URL: 'https://www.googleapis.com/drive/v3',
} as const;

export const SHEET_CONFIGS: Record<string, SheetConfig> = {
  'purchase details': {
    name: 'purchase details',
    headers: [
      'ID',
      'Date',
      'Product Name',
      'Purchasing Price',
      'Quantity',
      'Unit',
      'Notes',
      'Status',
    ],
  },
  sales: {
    name: 'sales',
    headers: [
      'ID',
      'Date',
      'Product Name',
      'Selling Price',
      'Quantity',
      'Unit',
      'Notes',
      'Status',
    ],
  },
  'inventory log': {
    name: 'inventory log',
    headers: ['Date', 'Item', 'Quantity', 'Action', 'Notes'],
  },
  inventory: {
    name: 'inventory',
    headers: ['Item', 'Quantity', 'Unit Price', 'Quantity'],
  },
};
