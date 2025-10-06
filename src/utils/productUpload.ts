import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parseLocaleNumber } from '../types/pricing';

const COLUMN_MAPPINGS = {
  id: ['id', 'product id', 'product_id'],
  name: ['name', 'product name', 'wine name'],
  description: ['description', 'details', 'tasting notes', 'notes'],
  category: ['category', 'type', 'wine type', 'style'],
  vintage: ['vintage', 'year'],
  price: ['price', 'retail price', 'amount', 'selling price', 'unit price'],
  region: ['region', 'appellation', 'location', 'origin'],
  varietal: ['varietal', 'grape', 'grape variety', 'variety'],
  supplier: ['supplier', 'supplier name', 'vendor', 'distributor', 'source'],
  supplierId: ['supplier id', 'supplier_id']
};

const normalizeKey = (key: string): string => key.trim().toLowerCase();

const findColumnValue = (row: Record<string, any>, possibleNames: string[]): string => {
  for (const name of possibleNames) {
    const value = row[name];
    if (value !== undefined && value !== null) {
      const stringValue = String(value).trim();
      if (stringValue !== '') {
        return stringValue;
      }
    }
  }
  return '';
};

const isRowEmpty = (row: Record<string, any>): boolean => {
  return Object.values(row).every(value => String(value ?? '').trim() === '');
};

export interface ProductUploadRow {
  rowNumber: number;
  id?: string;
  name: string;
  description?: string;
  category?: string;
  vintage?: string;
  price: number;
  region?: string;
  varietal?: string;
  supplier?: string;
  supplierId?: string;
}

export interface ProductUploadParseResult {
  products: ProductUploadRow[];
  errors: string[];
}

const processRows = (
  rows: Record<string, any>[],
  headerOffset: number
): ProductUploadParseResult => {
  const products: ProductUploadRow[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowNumber = headerOffset + index;

    if (isRowEmpty(row)) {
      return;
    }

    const name = findColumnValue(row, COLUMN_MAPPINGS.name);
    if (!name) {
      errors.push(`Row ${rowNumber}: Missing product name`);
      return;
    }

    const priceValue = findColumnValue(row, COLUMN_MAPPINGS.price);
    let price = priceValue ? parseLocaleNumber(priceValue) : null;

    if (price === null || Number.isNaN(price)) {
      const numericPrice = Number(priceValue);
      price = Number.isNaN(numericPrice) ? null : numericPrice;
    }

    if (price === null || price <= 0) {
      errors.push(`Row ${rowNumber}: Invalid or missing price`);
      return;
    }

    const productRow: ProductUploadRow = {
      rowNumber,
      id: findColumnValue(row, COLUMN_MAPPINGS.id) || undefined,
      name,
      description: findColumnValue(row, COLUMN_MAPPINGS.description) || undefined,
      category: findColumnValue(row, COLUMN_MAPPINGS.category) || 'Red Wine',
      vintage: findColumnValue(row, COLUMN_MAPPINGS.vintage) || undefined,
      price,
      region: findColumnValue(row, COLUMN_MAPPINGS.region) || undefined,
      varietal: findColumnValue(row, COLUMN_MAPPINGS.varietal) || undefined,
      supplier: findColumnValue(row, COLUMN_MAPPINGS.supplier) || undefined,
      supplierId: findColumnValue(row, COLUMN_MAPPINGS.supplierId) || undefined
    };

    products.push(productRow);
  });

  return { products, errors };
};

const parseCSV = (file: File): Promise<ProductUploadParseResult> => {
  return new Promise((resolve) => {
    Papa.parse<Record<string, any>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header: string) => normalizeKey(header),
      complete: (results) => {
        const normalizedRows = results.data.map((row) => {
          const normalized: Record<string, any> = {};
          Object.entries(row).forEach(([key, value]) => {
            if (typeof key === 'string') {
              normalized[normalizeKey(key)] = value;
            }
          });
          return normalized;
        });

        resolve(processRows(normalizedRows, 2));
      },
      error: () => {
        resolve({ products: [], errors: ['Failed to parse CSV file'] });
      }
    });
  });
};

const parseExcel = (file: File): Promise<ProductUploadParseResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false
        });

        if (!jsonData.length) {
          resolve({ products: [], errors: ['File appears to be empty'] });
          return;
        }

        const headers = (jsonData[0] as string[]).map(header => normalizeKey(String(header ?? '')));
        const records = (jsonData.slice(1) as any[][]).map(row => {
          const record: Record<string, any> = {};
          headers.forEach((header, columnIndex) => {
            record[header] = row[columnIndex];
          });
          return record;
        });

        resolve(processRows(records, 2));
      } catch (error) {
        resolve({
          products: [],
          errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : error}`]
        });
      }
    };

    reader.onerror = () => {
      resolve({ products: [], errors: ['Failed to read file'] });
    };

    reader.readAsArrayBuffer(file);
  });
};

export const parseProductUploadFile = async (file: File): Promise<ProductUploadParseResult> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSV(file);
  }

  if (extension === 'xlsx' || extension === 'xls') {
    return parseExcel(file);
  }

  return {
    products: [],
    errors: ['Unsupported file type. Please upload an .xlsx or .csv file.']
  };
};

export const generateProductUploadTemplate = (): void => {
  const workbook = XLSX.utils.book_new();

  const data = [
    ['ID', 'Name', 'Category', 'Description', 'Vintage', 'Price', 'Region', 'Varietal', 'Supplier', 'Supplier ID'],
    ['', 'Cabernet Sauvignon Reserve', 'Red Wine', 'Full-bodied red wine with notes of blackcurrant and oak', '2020', '250.00', 'Stellenbosch', 'Cabernet Sauvignon', 'Premium Wines Ltd', ''],
    ['', 'Chardonnay Estate', 'White Wine', 'Crisp white wine with citrus and vanilla notes', '2022', '180.00', 'Western Cape', 'Chardonnay', 'Premium Wines Ltd', ''],
    ['', 'Méthode Cap Classique', 'Sparkling Wine', 'Traditional method sparkling wine with fine bubbles', '2019', '320.00', 'Robertson', 'Chardonnay/Pinot Noir', 'Sparkling Specialists', '']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  worksheet['!cols'] = [
    { width: 15 },
    { width: 28 },
    { width: 18 },
    { width: 45 },
    { width: 12 },
    { width: 12 },
    { width: 18 },
    { width: 22 },
    { width: 24 },
    { width: 18 }
  ];

  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:J1');
  for (let column = headerRange.s.c; column <= headerRange.e.c; column++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: column });
    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E2E8F0' } },
        alignment: { horizontal: 'center' }
      };
    }
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Upload Template');
  XLSX.writeFile(workbook, 'product-upload-template.xlsx');
};
