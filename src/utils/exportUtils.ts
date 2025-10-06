import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Wine, CompanyInfo } from '../types/wine';
import { normalizeColor } from '../types/pricing';

// Map stored color to display category name
function getWineCategory(wine: Wine): string {
  // First check if we have an uploaded category
  if (wine.category) {
    return wine.category;
  }
  
  // If no category, try to infer from color/name
  const color = (wine as any).color ?? normalizeColor(null, wine.name) ?? "RED";
  switch (color) {
    case "WHITE": return "White Wine";
    case "ROSE": return "Rosé Wine";
    case "DESSERT": return "Dessert Wine";
    case "RED":
    default: return "Red Wine";
  }
}

const addCenteredMultilineText = (
  pdf: jsPDF,
  text: string,
  yPosition: number,
  options: { maxWidth?: number; lineHeight?: number } = {}
): number => {
  const { maxWidth = 170, lineHeight = 5 } = options;
  const lines = pdf.splitTextToSize(text, maxWidth);

  lines.forEach((line) => {
    pdf.text(line, 105, yPosition, { align: 'center' });
    yPosition += lineHeight;
  });

  return yPosition;
};

export const generatePDF = (wines: Wine[], companyInfo: CompanyInfo): void => {
  const pdf = new jsPDF();

  // Set font
  pdf.setFont('helvetica');

  let yPosition = 20;
  
  // Company logo
  if (companyInfo.logo) {
    try {
      // Add logo at the top center
      const logoHeight = 25;
      const logoWidth = 50;
      pdf.addImage(companyInfo.logo, 'JPEG', 105 - (logoWidth/2), yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 10;
    } catch (error) {
      console.warn('Could not add logo to PDF:', error);
    }
  }
  
  // Company header
  pdf.setFontSize(22);
  pdf.setTextColor(114, 47, 55); // Wine burgundy color
  pdf.text(companyInfo.name || 'Wine Selection', 105, yPosition, { align: 'center' });
  
  yPosition += 15;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  
  if (companyInfo.address) {
    yPosition = addCenteredMultilineText(pdf, companyInfo.address, yPosition);
    yPosition += 3;
  }

  if (companyInfo.phone || companyInfo.email) {
    const contactInfo = [companyInfo.phone, companyInfo.email].filter(Boolean).join('    ');
    yPosition = addCenteredMultilineText(pdf, contactInfo, yPosition);
    yPosition += 3;
  }

  if (companyInfo.website) {
    yPosition = addCenteredMultilineText(pdf, companyInfo.website, yPosition);
    yPosition += 3;
  }
  
  // Add line separator
  yPosition += 10;
  pdf.setDrawColor(114, 47, 55);
  pdf.line(20, yPosition, 190, yPosition);
  yPosition += 15;
  
  // Group wines by category
  const winesByCategory = wines.reduce((acc, wine) => {
    const category = getWineCategory(wine);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(wine);
    return acc;
  }, {} as Record<string, Wine[]>);
  
  // Add wines by category
  Object.entries(winesByCategory).forEach(([category, categoryWines]) => {
    // Category header
    pdf.setFontSize(16);
    pdf.setTextColor(114, 47, 55);
    pdf.text(category, 20, yPosition);
    yPosition += 8;
    
    categoryWines.forEach((wine) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Wine name and vintage
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      const nameText = wine.vintage ? `${wine.name} ${wine.vintage}` : wine.name;
      pdf.text(nameText, 20, yPosition);
      
      // Price (right aligned)
      const price = `R${wine.price.toFixed(2)}`;
      const textWidth = pdf.getTextWidth(price);
      pdf.text(price, 190 - textWidth, yPosition);
      
      yPosition += 4;
      
      // Description
      if (wine.description) {
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        const lines = pdf.splitTextToSize(wine.description, 160);
        lines.forEach((line: string) => {
          pdf.text(line, 20, yPosition);
          yPosition += 3.5;
        });
      }
      
      yPosition += 6;
    });
    
    yPosition += 8;
  });
  
  // Save the PDF
  pdf.save(`${companyInfo.name || 'wine-list'}-menu.pdf`);
};

export const generateExcel = (wines: Wine[], companyInfo: CompanyInfo): void => {
  const workbook = XLSX.utils.book_new();
  
  // Company info sheet
  const companyData = [
    ['Company Information'],
    ['Name', companyInfo.name],
    ['Address', companyInfo.address],
    ['Phone', companyInfo.phone],
    ['Email', companyInfo.email],
    ['Website', companyInfo.website],
    [],
    ['Wine List - Generated on', new Date().toLocaleDateString()]
  ];
  
  const companySheet = XLSX.utils.aoa_to_sheet(companyData);
  XLSX.utils.book_append_sheet(workbook, companySheet, 'Company Info');
  
  // Wine list sheet
  const wineData = [
    ['Wine Name', 'Vintage', 'Category', 'Description', 'Region', 'Varietal', 'Price']
  ];
  
  wines.forEach(wine => {
    wineData.push([
      wine.name,
      wine.vintage || '',
      getWineCategory(wine),
      wine.description,
      wine.region || '',
      wine.varietal || '',
      wine.price
    ]);
  });
  
  const wineSheet = XLSX.utils.aoa_to_sheet(wineData);
  XLSX.utils.book_append_sheet(workbook, wineSheet, 'Wine List');
  
  // Save the file
  XLSX.writeFile(workbook, `${companyInfo.name || 'wine-list'}-export.xlsx`);
};