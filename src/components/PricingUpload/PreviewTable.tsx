import React, { useState } from 'react';
import { Edit3, AlertCircle, Palette } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ParsedRow, WineColorEnum, normalizeColor } from '../../types/pricing';

interface PreviewTableProps {
  rows: ParsedRow[];
  onUpdateRow: (index: number, field: string, value: any) => void;
  editMode: boolean;
  onToggleEditMode: () => void;
  selectedBrand?: string;
  selectedColor?: string;
  onAutoFillColors?: () => void;
}

export const PreviewTable: React.FC<PreviewTableProps> = ({
  rows,
  onUpdateRow,
  editMode,
  onToggleEditMode,
  selectedBrand,
  selectedColor,
  onAutoFillColors
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);

  // Filter rows based on selected brand and color
  const filteredRows = rows.filter(row => {
    if (selectedBrand && row.brand !== selectedBrand && !row.isSectionHeader) {
      return false;
    }
    if (selectedColor && selectedColor !== 'All' && row.color !== selectedColor && !row.isSectionHeader) {
      return false;
    }
    return true;
  });

  const handleCellEdit = (rowIndex: number, field: string, value: string) => {
    // Find the actual row index in the original array
    const actualRowIndex = rows.findIndex(r => r === filteredRows[rowIndex]);
    if (actualRowIndex === -1) return;
    
    let parsedValue: any = value;
    
    // Parse numeric fields
    if (['packed_case', 'ex_vat_per_case', 'ex_vat_per_unit', 'inc_vat_per_case', 'inc_vat_per_unit'].includes(field)) {
      if (field === 'packed_case') {
        parsedValue = value ? parseInt(value) : null;
      } else {
        parsedValue = value ? parseFloat(value.replace(/[$,]/g, '')) : null;
      }
    }
    
    onUpdateRow(actualRowIndex, field, parsedValue);
    setEditingCell(null);
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '';
    return `R${value.toLocaleString('en-ZA', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const getColorBadgeClass = (color: string | null) => {
    switch (color) {
      case 'RED': return 'bg-red-100 text-red-800';
      case 'WHITE': return 'bg-yellow-100 text-yellow-800';
      case 'ROSE': return 'bg-pink-100 text-pink-800';
      case 'DESSERT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCellClassName = (row: ParsedRow, field: string): string => {
    const hasError = row.errors.some(error => error.toLowerCase().includes(field.replace(/_/g, ' ')));
    const baseClass = "text-sm";
    
    if (hasError) {
      return `${baseClass} border-2 border-red-300 bg-red-50`;
    }
    
    return baseClass;
  };

  const renderEditableCell = (row: ParsedRow, rowIndex: number, field: string, value: any) => {
    const isEditing = editingCell?.row === rowIndex && editingCell?.field === field;
    const cellClass = getCellClassName(row, field);
    const hasError = row.errors.some(error => error.toLowerCase().includes(field.replace(/_/g, ' ')));
    
    // Special handling for color field
    if (field === 'color') {
      if (editMode && !row.isSectionHeader && !isEditing) {
        return (
          <TableCell 
            className={`${cellClass} cursor-pointer hover:bg-gray-50`}
            onClick={() => setEditingCell({ row: rowIndex, field })}
          >
            <div className="flex items-center gap-1">
              {value ? (
                <Badge className={getColorBadgeClass(value)}>
                  {value}
                </Badge>
              ) : (
                <span className="text-gray-400">—</span>
              )}
              {!value && <AlertCircle className="h-3 w-3 text-yellow-500" />}
            </div>
          </TableCell>
        );
      }
      
      if (isEditing) {
        return (
          <TableCell className={cellClass}>
            <select
              defaultValue={value || ''}
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onBlur={(e) => handleCellEdit(rowIndex, field, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCellEdit(rowIndex, field, e.currentTarget.value);
                } else if (e.key === 'Escape') {
                  setEditingCell(null);
                }
              }}
              autoFocus
            >
              <option value="">Select Color</option>
              <option value="RED">RED</option>
              <option value="WHITE">WHITE</option>
              <option value="ROSE">ROSE</option>
              <option value="DESSERT">DESSERT</option>
            </select>
          </TableCell>
        );
      }
      
      return (
        <TableCell className={cellClass}>
          <div className="flex items-center gap-1">
            {value ? (
              <Badge className={getColorBadgeClass(value)}>
                {value}
              </Badge>
            ) : (
              <span className="text-gray-400">—</span>
            )}
            {!value && <AlertCircle className="h-3 w-3 text-yellow-500" />}
          </div>
        </TableCell>
      );
    }

    if (editMode && !row.isSectionHeader && !isEditing) {
      return (
        <TableCell 
          className={`${cellClass} cursor-pointer hover:bg-gray-50`}
          onClick={() => setEditingCell({ row: rowIndex, field })}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  {field.includes('vat_per_') ? formatCurrency(value) : (value || '')}
                  {hasError && <AlertCircle className="h-3 w-3 text-red-500" />}
                </div>
              </TooltipTrigger>
              {hasError && (
                <TooltipContent>
                  <div className="space-y-1">
                    {row.errors
                      .filter(error => error.toLowerCase().includes(field.replace(/_/g, ' ')))
                      .map((error, i) => (
                        <p key={i} className="text-xs">{error}</p>
                      ))}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      );
    }
    
    if (isEditing) {
      return (
        <TableCell className={cellClass}>
          <input
            type={field === 'packed_case' ? 'number' : field.includes('vat_per_') ? 'number' : 'text'}
            step={field.includes('per_') ? '0.01' : undefined}
            defaultValue={field.includes('vat_per_') ? value || '' : value || ''}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onBlur={(e) => handleCellEdit(rowIndex, field, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellEdit(rowIndex, field, e.currentTarget.value);
              } else if (e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
            autoFocus
          />
        </TableCell>
      );
    }
    
    return (
      <TableCell className={`${cellClass} ${
        field.includes('vat_per_') || field === 'packed_case' ? 'text-right' : ''
      }`}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1">
                {field.includes('vat_per_') ? formatCurrency(value) : (value || '')}
                {hasError && <AlertCircle className="h-3 w-3 text-red-500" />}
                {row.warnings.length > 0 && <Badge variant="secondary" className="text-xs ml-1">!</Badge>}
              </div>
            </TooltipTrigger>
            {(hasError || row.warnings.length > 0) && (
              <TooltipContent>
                <div className="space-y-1">
                  {hasError && row.errors
                    .filter(error => error.toLowerCase().includes(field.replace(/_/g, ' ')))
                    .map((error, i) => (
                      <p key={i} className="text-xs text-red-600">{error}</p>
                    ))}
                  {row.warnings.map((warning, i) => (
                    <p key={i} className="text-xs text-yellow-600">{warning}</p>
                  ))}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    );
  };

  if (filteredRows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{rows.length === 0 ? 'No data to preview. Upload a file to get started.' : 'No rows match the current filters.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Excel-Style Preview</h3>
        <div className="flex items-center gap-2">
          {onAutoFillColors && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAutoFillColors}
              className="flex items-center gap-2"
            >
              <Palette className="h-4 w-4" />
              Auto-fill Colors
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleEditMode}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            {editMode ? 'Exit Edit Mode' : 'Edit Mode'}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-20">
              {/* Row 1: Grouped headers */}
              <TableRow className="bg-gray-100 border-b">
                <TableHead className="text-center border-r font-bold">Brand</TableHead>
                <TableHead className="text-center border-r font-bold">Area</TableHead>
                <TableHead className="text-center border-r font-bold">Product</TableHead>
                <TableHead className="text-center border-r font-bold" colSpan={2}>Packed</TableHead>
                <TableHead className="text-center border-r font-bold">Color</TableHead>
                <TableHead className="text-center border-r font-bold" colSpan={2}>Ex VAT</TableHead>
                <TableHead className="text-center font-bold" colSpan={2}>Inv (Incl VAT)</TableHead>
                <TableHead className="text-center font-bold">Display</TableHead>
              </TableRow>
              {/* Row 2: Individual column headers */}
              <TableRow className="bg-gray-50">
                <TableHead className="text-center border-r">—</TableHead>
                <TableHead className="text-center border-r">—</TableHead>
                <TableHead className="text-center border-r">—</TableHead>
                <TableHead className="text-center border-r">Case</TableHead>
                <TableHead className="text-center border-r">Size</TableHead>
                <TableHead className="text-center border-r">—</TableHead>
                <TableHead className="text-center border-r">Per case</TableHead>
                <TableHead className="text-center border-r">Per unit</TableHead>
                <TableHead className="text-center border-r">Per case</TableHead>
                <TableHead className="text-center">Per unit</TableHead>
                <TableHead className="text-center">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row, index) => {
                if (row.isSectionHeader) {
                  return (
                    <TableRow key={index} className="bg-gray-100 border-t-2">
                      <TableCell colSpan={11} className="font-bold text-gray-800 py-3">
                        <div className="flex items-center gap-2">
                          {row.product_name}
                          <Badge variant="secondary" className="text-xs">Section Header</Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow 
                    key={index} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} ${
                      !row.isValid ? 'bg-red-50' : ''
                    }`}
                  >
                    {renderEditableCell(row, index, 'brand', row.brand)}
                    {renderEditableCell(row, index, 'area', row.area)}
                    {renderEditableCell(row, index, 'product_name', row.product_name)}
                    {renderEditableCell(row, index, 'packed_case', row.packed_case)}
                    {renderEditableCell(row, index, 'size_text', row.size_text)}
                    {renderEditableCell(row, index, 'color', row.color)}
                    {renderEditableCell(row, index, 'ex_vat_per_case', row.ex_vat_per_case)}
                    {renderEditableCell(row, index, 'ex_vat_per_unit', row.ex_vat_per_unit)}
                    {renderEditableCell(row, index, 'inc_vat_per_case', row.inc_vat_per_case)}
                    {renderEditableCell(row, index, 'inc_vat_per_unit', row.inc_vat_per_unit)}
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              {row.display_price ? formatCurrency(row.display_price) : '—'}
                              {row.display_price === null && <AlertCircle className="h-3 w-3 text-yellow-500" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {row.display_price 
                                ? "Computed from available price fields" 
                                : "No unit price available"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};