import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Wine, ParsedWineData } from '../types/wine';
import { parseLocaleNumber } from '../types/pricing';

// Column mapping for different file formats
const COLUMN_MAPPINGS = {
  // Standard wine list columns
  name: ['name', 'wine name', 'product name', 'wine', 'product'],
  description: ['description', 'notes', 'tasting notes', 'details'],
  category: ['category', 'type', 'wine type', 'style'],
  vintage: ['vintage', 'year'],
  price: ['price', 'cost', 'retail price', 'selling price', 'amount'],
  region: ['region', 'appellation', 'location', 'origin'],
  varietal: ['varietal', 'grape', 'grape variety', 'variety'],
  // Additional pricing structure columns
  wholesale: ['wholesale', 'wholesale price', 'cost price', 'buy price'],
  markup: ['markup', 'margin', 'markup percentage'],
  supplier: ['supplier', 'vendor', 'distributor', 'source'],
  sku: ['sku', 'product code', 'item code', 'code'],
  stock: ['stock', 'inventory', 'quantity', 'qty', 'available'],
  minOrder: ['min order', 'minimum order', 'min qty', 'minimum quantity']
};

const findColumnValue = (row: any, possibleNames: string[]): string => {
  for (const name of possibleNames) {
    const value = row[name] || row[name.toLowerCase()] || row[name.toUpperCase()];
    if (value !== undefined && value !== null && value !== '') {
      return String(value).trim();
    }
  }
  return '';
};

// Updated validation that doesn't check for legacy name/price fields
const validateWineRow = (row: any, index: number): { wine?: Wine; error?: string } => {
  const name = findColumnValue(row, COLUMN_MAPPINGS.name);
  
  if (!name) {
    return { error: `Row ${index + 1}: Missing product name` };
  }

  // Try to find any price field using locale-aware parsing
  const priceFields = [
    ...COLUMN_MAPPINGS.price,
    ...COLUMN_MAPPINGS.wholesale,
    'exv per unit', 'inv per unit', 'ex vat per unit', 'inc vat per unit'
  ];
  
  let price = 0;
  for (const field of priceFields) {
    const priceStr = findColumnValue(row, [field]);
    if (priceStr) {
      const parsedPrice = parseLocaleNumber(priceStr);
      if (parsedPrice && parsedPrice > 0) {
        price = parsedPrice;
        break;
      }
    }
  }

  if (price <= 0) {
    return { error: `Row ${index + 1}: No valid price found` };
  }

  const wine: Wine = {
    id: generateId(),
    name,
    description: findColumnValue(row, COLUMN_MAPPINGS.description),
    category: findColumnValue(row, COLUMN_MAPPINGS.category) || 'Red Wine',
    vintage: findColumnValue(row, COLUMN_MAPPINGS.vintage),
    price,
    region: findColumnValue(row, COLUMN_MAPPINGS.region),
    varietal: findColumnValue(row, COLUMN_MAPPINGS.varietal),
    supplier: findColumnValue(row, COLUMN_MAPPINGS.supplier),
    selected: false
  };

  return { wine };
};

export const parseCSVFile = (file: File): Promise<ParsedWineData> => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase(),
      complete: (results) => {
        const wines: Wine[] = [];
        const errors: string[] = [];

        results.data.forEach((row: any, index: number) => {
          const result = validateWineRow(row, index);
          if (result.error) {
            errors.push(result.error);
          } else if (result.wine) {
            wines.push(result.wine);
          }
        });

        resolve({ wines, errors });
      },
      error: () => {
        resolve({ wines: [], errors: ['Failed to parse CSV file'] });
      }
    });
  });
};

export const parseExcelFile = (file: File): Promise<ParsedWineData> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false
        });

        // Convert array format to object format with proper headers
        if (jsonData.length === 0) {
          resolve({ wines: [], errors: ['File appears to be empty'] });
          return;
        }

        const headers = (jsonData[0] as string[]).map(h => String(h).trim().toLowerCase());
        const dataRows = jsonData.slice(1) as any[][];
        
        const objectData = dataRows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });

        const wines: Wine[] = [];
        const errors: string[] = [];

        objectData.forEach((row: any, index: number) => {
          const result = validateWineRow(row, index + 1); // +1 for header offset
          if (result.error) {
            errors.push(result.error.replace(`Row ${index + 1}:`, `Row ${index + 2}:`));
          } else if (result.wine) {
            wines.push(result.wine);
          }
        });

        resolve({ wines, errors });
      } catch (error) {
        resolve({ wines: [], errors: [`Failed to parse Excel file: ${error}`] });
      }
    };

    reader.onerror = () => {
      resolve({ wines: [], errors: ['Failed to read file'] });
    };

    reader.readAsArrayBuffer(file);
  });
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};