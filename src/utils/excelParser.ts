import * as XLSX from 'xlsx';
import { ParsedRow, ParseResult } from '../types/pricing';
import { PriceRowV3, parseLocaleNumber, computeDisplayPrice, normalizeColor } from '../types/pricing';

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "").trim();

const aliases: Record<string, string[]> = {
  brand: ["brand"],
  area: ["area", "region"],
  color: ["color", "colour", "wine color", "wine colour"],
  product_name: ["product", "product name", "name", "item"],
  packed_case: ["case", "cases", "packed", "pack"],
  size_text: ["size", "bottle size"],
  ex_vat_per_case: ["exv per case", "ex vat per case", "ex vat case", "exv case"],
  ex_vat_per_unit: ["exv per unit", "ex vat per unit", "ex vat unit", "exv unit"],
  inc_vat_per_case: ["inv per case", "incl per case", "including per case", "incl vat per case", "inc per case"],
  inc_vat_per_unit: ["inv per unit", "incl per unit", "including per unit", "incl vat per unit", "inc per unit"]
};

function buildHeaderIndex(headerRow: any[]): Record<string, number> {
  const idx: Record<string, number> = {};
  const H = headerRow.map(h => norm(String(h ?? "")));
  for (const key of Object.keys(aliases)) {
    const options = aliases[key];
    const found = H.findIndex(h => options.includes(h));
    if (found >= 0) idx[key] = found;
  }
  return idx;
}

// Detect if a row is a COLOR SECTION row like "Red Wine" / "White Wine" / "Rosé" / "Dessert Wine"
function detectColorSection(cells: any[]): "RED"|"WHITE"|"ROSE"|"DESSERT"|null {
  const joined = cells.slice(0, 3).map(c => String(c ?? "").toLowerCase()).join(" ").trim();
  if (!joined) return null;
  if (/\b(red|rouge)\b/.test(joined)) return "RED";
  if (/\b(white|wit|blanc)\b/.test(joined)) return "WHITE";
  if (/\b(ros[eé]|blush)\b/.test(joined)) return "ROSE";
  if (/\b(dessert|desert|sweet|noble\s*late|late\s*harvest|jerepik|jeripig|moscat|moscato)\b/.test(joined)) return "DESSERT";
  return null;
}

const isSectionHeader = (row: any[]): boolean => {
  if (!row || row.length === 0) return false;
  
  const firstCell = row[0]?.toString().trim();
  if (!firstCell) return false;
  
  // Check if it's a brand/section name (first cell has text, others are mostly empty)
  const restOfRow = row.slice(1);
  
  const mostlyEmpty = restOfRow.filter(cell => 
    cell === null || cell === undefined || cell?.toString().trim() === ''
  ).length >= restOfRow.length * 0.7;
  
  return mostlyEmpty;
};

export async function parseWorkbookV2(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<any>(ws, { header: 1, defval: "" });
  
  if (!raw.length) {
    return {
      rows: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      sectionHeaders: 0,
      errors: [],
      warnings: []
    };
  }

  // find header row within first 5 lines
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, raw.length); i++) {
    const row = raw[i].map((c: any) => norm(String(c ?? "")));
    const score = ["brand","area","product","case","size"].filter(k => row.includes(k)).length;
    if (score >= 3) { headerRowIndex = i; break; }
  }

  const header = raw[headerRowIndex];
  const col = buildHeaderIndex(header);

  const parsedRows: ParsedRow[] = [];
  let sectionHeaderCount = 0;
  let currentBrand: string | undefined;
  let activeColor: "RED"|"WHITE"|"ROSE"|"DESSERT"|null = null;

  const dataRows = raw.slice(headerRowIndex + 1);
  
  dataRows.forEach((r: any[], i: number) => {
    const actualRowIndex = headerRowIndex + i + 2;
    
    // 1) Handle COLOR SECTION rows (e.g., "Red Wine")
    const sectionColor = detectColorSection(r);
    if (sectionColor) { 
      activeColor = sectionColor; 
      return; // not a product row
    }
    
    // Check if this is a section header
    if (isSectionHeader(r)) {
      currentBrand = r[0]?.toString().trim();
      sectionHeaderCount++;
      
      parsedRows.push({
        brand: currentBrand || '',
        area: '',
        color: null,
        product_name: currentBrand || '',
        packed_case: 0,
        size_text: '',
        ex_vat_per_case: null,
        ex_vat_per_unit: null,
        inc_vat_per_case: null,
        inc_vat_per_unit: null,
        source_file: file.name,
        row_number: actualRowIndex,
        isValid: false,
        isSectionHeader: true,
        errors: [],
        warnings: [],
        originalRowIndex: actualRowIndex,
        display_price: null
      });
      return;
    }

    // Skip completely empty rows
    if (r.every(cell => !cell || cell.toString().trim() === '')) {
      return;
    }

    // 2) Build product row
    const product = String(r[col.product_name] ?? r[col.name] ?? "").trim();
    const brand = currentBrand || String(r[col.brand] ?? "").trim();
    const area = String(r[col.area] ?? "").trim();
    
    // Accept either explicit Color column or use the current activeColor or infer from product name
    const rawColor = col.color !== undefined ? r[col.color] : "";
    const color = normalizeColor(rawColor, product) ?? activeColor;
    
    const rowData = {
      brand,
      area,
      color,
      product_name: product,
      packed_case: parseInt(String(r[col.packed_case] ?? "").replace(/\D+/g, "")) || 0,
      size_text: String(r[col.size_text] ?? "").trim(),
      ex_vat_per_case: parseLocaleNumber(r[col.ex_vat_per_case]),
      ex_vat_per_unit: parseLocaleNumber(r[col.ex_vat_per_unit]),
      inc_vat_per_case: parseLocaleNumber(r[col.inc_vat_per_case]),
      inc_vat_per_unit: parseLocaleNumber(r[col.inc_vat_per_unit]),
      source_file: file.name,
      row_number: actualRowIndex
    };

    const parsedRow = {
      ...rowData,
      isValid: true,
      isSectionHeader: false,
      errors: [],
      warnings: [],
      originalRowIndex: actualRowIndex,
      display_price: computeDisplayPrice(rowData)
    };

    const validation = PriceRowV3.safeParse(rowData);
    if (!validation.success) {
      parsedRow.errors = validation.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      parsedRow.isValid = false;
    }

    // Show warning for missing display price or color
    if (parsedRow.display_price === null || parsedRow.display_price === undefined) {
      parsedRow.warnings.push("No unit price available - check ex/inc VAT fields");
    }
    
    if (!parsedRow.color) {
      parsedRow.warnings.push("Missing color - use Auto-fill Colors or set manually");
    }
    
    parsedRows.push(parsedRow);
  });

  // Check for duplicates
  const duplicateMap = new Map<string, ParsedRow[]>();
  parsedRows.forEach(row => {
    if (!row.isSectionHeader && row.product_name) {
      const key = row.brand 
        ? `${row.brand}|${row.product_name}|${row.size_text}`
        : `${row.product_name}|${row.size_text}`;
      
      if (!duplicateMap.has(key)) {
        duplicateMap.set(key, []);
      }
      duplicateMap.get(key)!.push(row);
      row.duplicateKey = key;
    }
  });

  // Mark duplicates with warnings
  duplicateMap.forEach((rows, key) => {
    if (rows.length > 1) {
      rows.forEach(row => {
        row.warnings.push(`Duplicate found: ${rows.length} rows with same product+size`);
      });
    }
  });

  const validRows = parsedRows.filter(row => row.isValid && !row.isSectionHeader).length;
  const invalidRows = parsedRows.filter(row => !row.isValid && !row.isSectionHeader).length;
  const allErrors = parsedRows.flatMap(row => row.errors);
  const allWarnings = parsedRows.flatMap(row => row.warnings);

  return {
    rows: parsedRows,
    totalRows: dataRows.length,
    validRows,
    invalidRows,
    sectionHeaders: sectionHeaderCount,
    errors: allErrors,
    warnings: allWarnings
  };
}

export const parseWorkbookV3 = parseWorkbookV2;
export const parseExcelFile = parseWorkbookV3;

export const generateTemplate = (): void => {
  const workbook = XLSX.utils.book_new();
  
  // Create sample data with V2 structure
  const data = [
    // Single header row
    ['Brand', 'Area', 'Product', 'Case', 'Size', 'Color', 'Exv Per case', 'Exv Per unit', 'Inv Per case', 'Inv Per unit'],
    // Sample section header
    ['KLAWER CELLARS', '', '', '', '', '', '', '', '', ''],
    // Sample products
    ['Klawer Cellars', 'Western Cape', 'Chardonnay', 12, '750ml', 'WHITE', '2 288,23', '190,69', '2 631,47', '219,29'],
    ['Klawer Cellars', 'Western Cape', 'Cabernet Sauvignon', 12, '750ml', 'RED', '2 520,00', '210,00', '2 898,00', '241,50'],
    ['', '', '', '', '', '', '', '', '', ''],
    ['BOSCHENDAL ESTATE', '', '', '', '', '', '', '', '', ''],
    ['Boschendal', 'Stellenbosch', 'Sauvignon Blanc', 6, '750ml', 'WHITE', '1 440,00', '240,00', '1 656,00', '276,00'],
    ['Boschendal', 'Stellenbosch', 'Pinot Noir', 6, '750ml', 'RED', '2 880,00', '480,00', '3 312,00', '552,00']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  worksheet['!cols'] = [
    { width: 20 }, // Brand
    { width: 15 }, // Area
    { width: 30 }, // Product
    { width: 8 },  // Case
    { width: 10 }, // Size
    { width: 10 }, // Color
    { width: 15 }, // Exv Per case
    { width: 15 }, // Exv Per unit
    { width: 15 }, // Inv Per case
    { width: 15 }  // Inv Per unit
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pricing Template V3');
  XLSX.writeFile(workbook, 'pricing-template-v3.xlsx');
};

export const exportToExcel = (rows: ParsedRow[], filename: string = 'pricing-export-v2.xlsx'): void => {
  const workbook = XLSX.utils.book_new();
  
  // Prepare data for export
  const exportData = [
    ['Brand', 'Area', 'Product', 'Case', 'Size', 'Color', 'Exv Per case', 'Exv Per unit', 'Inv Per case', 'Inv Per unit']
  ];

  rows.forEach(row => {
    if (row.isSectionHeader) {
      exportData.push([row.product_name, '', '', '', '', '', '', '', '', '']);
    } else if (row.product_name) {
      exportData.push([
        row.brand || '',
        row.area || '',
        row.product_name,
        row.packed_case || '',
        row.size_text || '',
        row.color || '',
        row.ex_vat_per_case || '',
        row.ex_vat_per_unit || '',
        row.inc_vat_per_case || '',
        row.inc_vat_per_unit || ''
      ]);
    }
  });

  const worksheet = XLSX.utils.aoa_to_sheet(exportData);
  
  // Set column widths
  worksheet['!cols'] = [
    { width: 20 }, // Brand
    { width: 15 }, // Area
    { width: 30 }, // Product
    { width: 8 },  // Case
    { width: 10 }, // Size
    { width: 10 }, // Color
    { width: 15 }, // Exv Per case
    { width: 15 }, // Exv Per unit
    { width: 15 }, // Inv Per case
    { width: 15 }  // Inv Per unit
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pricing Data V3');
  XLSX.writeFile(workbook, filename);
};