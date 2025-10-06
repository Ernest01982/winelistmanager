import React, { useState } from 'react';
import { FileSpreadsheet, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { FileUploadZone } from '../components/PricingUpload/FileUploadZone';
import { ValidationSummary } from '../components/PricingUpload/ValidationSummary';
import { PreviewTable } from '../components/PricingUpload/PreviewTable';
import { ImportActions } from '../components/PricingUpload/ImportActions';
import { parseWorkbookV3 } from '../utils/excelParser';
import { ParseResult, ParsedRow, ImportResult } from '../types/pricing';
import { PriceRowV3, normalizeColor, computeDisplayPrice } from '../types/pricing';

export const PricingUpload: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('All');

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    
    try {
      const result = await parseWorkbookV3(file);
      setParseResult(result);
    } catch (error) {
      console.error('Failed to parse file:', error);
      setParseResult({
        rows: [],
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        sectionHeaders: 0,
        errors: [`Failed to parse file: ${error}`],
        warnings: []
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setParseResult(null);
    setEditMode(false);
    setSelectedBrand('');
    setSelectedColor('All');
  };

  const handleClearPreview = () => {
    setParseResult(null);
    setEditMode(false);
    setSelectedBrand('');
    setSelectedColor('All');
  };

  const handleAutoFillColors = () => {
    if (!parseResult) return;

    const updatedRows = parseResult.rows.map(row => {
      if (!row.isSectionHeader && !row.color && row.product_name) {
        const inferredColor = normalizeColor(null, row.product_name);
        if (inferredColor) {
          return {
            ...row,
            color: inferredColor,
            warnings: row.warnings.filter(w => !w.includes('Missing color'))
          };
        }
      }
      return row;
    });

    const validRows = updatedRows.filter(r => r.isValid && !r.isSectionHeader).length;
    const invalidRows = updatedRows.filter(r => !r.isValid && !r.isSectionHeader).length;

    setParseResult({
      ...parseResult,
      rows: updatedRows,
      validRows,
      invalidRows,
      warnings: updatedRows.flatMap(r => r.warnings)
    });
  };
  const handleUpdateRow = (index: number, field: string, value: any) => {
    if (!parseResult) return;

    const updatedRows = [...parseResult.rows];
    updatedRows[index] = {
      ...updatedRows[index],
      [field]: value
    };

    // Re-validate the updated row
    const row = updatedRows[index];
    
    // Only validate if it's not a section header
    if (!row.isSectionHeader) {
      const validation = PriceRowV3.safeParse(row);
      
      if (validation.success) {
        row.errors = [];
        row.isValid = true;
      } else {
        row.errors = validation.error.errors.map(err => 
          `${err.path.join('.')}: ${err.message}`
        );
        row.isValid = false;
      }
      
      // Update display price
      row.display_price = computeDisplayPrice(row);
      
      // Update warnings
      row.warnings = [];
      if (row.display_price === null || row.display_price === undefined) {
        row.warnings.push("No unit price available - check ex/inc VAT fields");
      }
      if (!row.color) {
        row.warnings.push("Missing color - use Auto-fill Colors or set manually");
      }
    }
    

    // Recalculate totals
    const validRows = updatedRows.filter(r => r.isValid && !r.isSectionHeader).length;
    const invalidRows = updatedRows.filter(r => !r.isValid && !r.isSectionHeader).length;

    setParseResult({
      ...parseResult,
      rows: updatedRows,
      validRows,
      invalidRows,
      errors: updatedRows.flatMap(r => r.errors),
      warnings: updatedRows.flatMap(r => r.warnings)
    });
  };

  const handleImportComplete = (result: ImportResult) => {
    console.log('Import completed:', result);
    // You could show a success dialog or notification here
  };

  // Get unique brands from parsed data
  const uniqueBrands = parseResult ? 
    Array.from(new Set(parseResult.rows
      .filter(row => !row.isSectionHeader && row.brand)
      .map(row => row.brand)
    )).sort() : [];

  const colorOptions = ['All', 'RED', 'WHITE', 'ROSE', 'DESSERT'];
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileSpreadsheet className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pricing Upload</h1>
              <p className="text-gray-600">Upload pricing in Excel format. Preview, validate, and import.</p>
            </div>
          </div>
          
          {parseResult && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearPreview}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Clear Preview
              </button>
            </div>
          )}
        </div>

        {/* File Upload */}
        <FileUploadZone
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onClearFile={handleClearFile}
          isProcessing={isProcessing}
        />

        {/* Filters */}
        {parseResult && parseResult.rows.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                
                {/* Brand Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Brand:</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Brands</option>
                    {uniqueBrands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>

                {/* Color Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Color:</label>
                  <div className="flex gap-1">
                    {colorOptions.map(color => (
                      <Button
                        key={color}
                        variant={selectedColor === color ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedColor(color)}
                        className="text-xs"
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Validation Summary */}
        {parseResult && (
          <Card>
            <CardHeader>
              <CardTitle>Validation Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <ValidationSummary parseResult={parseResult} />
            </CardContent>
          </Card>
        )}

        {/* Preview Table */}
        {parseResult && parseResult.rows.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <PreviewTable
                rows={parseResult.rows}
                onUpdateRow={handleUpdateRow}
                editMode={editMode}
                onToggleEditMode={() => setEditMode(!editMode)}
                selectedBrand={selectedBrand}
                selectedColor={selectedColor}
                onAutoFillColors={handleAutoFillColors}
              />
            </CardContent>
          </Card>
        )}

        {/* Import Actions */}
        {parseResult && parseResult.validRows > 0 && (
          <ImportActions
            rows={parseResult.rows}
            filename={selectedFile?.name || 'pricing-data'}
            onImportComplete={handleImportComplete}
          />
        )}
      </div>
    </div>
  );
};