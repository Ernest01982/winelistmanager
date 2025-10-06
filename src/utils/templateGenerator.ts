import * as XLSX from 'xlsx';

export const generateWineUploadTemplate = (): void => {
  const workbook = XLSX.utils.book_new();
  
  // Create sample data with proper wine list structure
  const data = [
    // Header row
    ['Wine Name', 'Vintage', 'Category', 'Description', 'Region', 'Varietal', 'Price', 'Wholesale Price', 'Markup %', 'Supplier', 'SKU', 'Stock Quantity'],
    // Sample data rows
    ['Cabernet Sauvignon Reserve', '2020', 'Red Wine', 'Full-bodied red wine with notes of blackcurrant and oak', 'Stellenbosch', 'Cabernet Sauvignon', '250.00', '180.00', '38.9', 'Premium Wines Ltd', 'CAB2020-001', '24'],
    ['Chardonnay Estate', '2022', 'White Wine', 'Crisp white wine with citrus and vanilla notes', 'Western Cape', 'Chardonnay', '180.00', '130.00', '38.5', 'Premium Wines Ltd', 'CHAR2022-001', '36'],
    ['Pinotage Classic', '2021', 'Red Wine', 'Medium-bodied red with berry flavors and smoky finish', 'Paarl', 'Pinotage', '160.00', '115.00', '39.1', 'Heritage Cellars', 'PIN2021-001', '18'],
    ['Sauvignon Blanc', '2023', 'White Wine', 'Fresh and zesty with tropical fruit aromas', 'Constantia', 'Sauvignon Blanc', '140.00', '100.00', '40.0', 'Coastal Wines', 'SAV2023-001', '42'],
    ['Méthode Cap Classique', '2019', 'Sparkling Wine', 'Traditional method sparkling wine with fine bubbles', 'Robertson', 'Chardonnay/Pinot Noir', '320.00', '230.00', '39.1', 'Sparkling Specialists', 'MCC2019-001', '12']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths for better readability
  worksheet['!cols'] = [
    { width: 25 }, // Wine Name
    { width: 10 }, // Vintage
    { width: 15 }, // Category
    { width: 40 }, // Description
    { width: 15 }, // Region
    { width: 20 }, // Varietal
    { width: 12 }, // Price
    { width: 15 }, // Wholesale Price
    { width: 12 }, // Markup %
    { width: 20 }, // Supplier
    { width: 15 }, // SKU
    { width: 15 }  // Stock Quantity
  ];

  // Style the header row
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:L1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "E2E8F0" } },
      alignment: { horizontal: "center" }
    };
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Wine Upload Template');
  XLSX.writeFile(workbook, 'wine-upload-template.xlsx');
};

export const generateWineCSVTemplate = (): void => {
  const csvContent = [
    'Wine Name,Vintage,Category,Description,Region,Varietal,Price,Wholesale Price,Markup %,Supplier,SKU,Stock Quantity',
    'Cabernet Sauvignon Reserve,2020,Red Wine,"Full-bodied red wine with notes of blackcurrant and oak",Stellenbosch,Cabernet Sauvignon,250.00,180.00,38.9,Premium Wines Ltd,CAB2020-001,24',
    'Chardonnay Estate,2022,White Wine,"Crisp white wine with citrus and vanilla notes",Western Cape,Chardonnay,180.00,130.00,38.5,Premium Wines Ltd,CHAR2022-001,36',
    'Pinotage Classic,2021,Red Wine,"Medium-bodied red with berry flavors and smoky finish",Paarl,Pinotage,160.00,115.00,39.1,Heritage Cellars,PIN2021-001,18',
    'Sauvignon Blanc,2023,White Wine,"Fresh and zesty with tropical fruit aromas",Constantia,Sauvignon Blanc,140.00,100.00,40.0,Coastal Wines,SAV2023-001,42',
    'Méthode Cap Classique,2019,Sparkling Wine,"Traditional method sparkling wine with fine bubbles",Robertson,Chardonnay/Pinot Noir,320.00,230.00,39.1,Sparkling Specialists,MCC2019-001,12'
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'wine-upload-template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};