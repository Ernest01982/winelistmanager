import React, { useState } from 'react';
import { Upload, Download, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ParsedRow, ImportProgress, ImportResult } from '../../types/pricing';
import { exportToExcel } from '../../utils/excelParser';
import { supabase } from '../../lib/supabase';
import { queueImport } from '../../lib/offlineQueue';

interface ImportActionsProps {
  rows: ParsedRow[];
  filename: string;
  onImportComplete: (result: ImportResult) => void;
}

export const ImportActions: React.FC<ImportActionsProps> = ({
  rows,
  filename,
  onImportComplete
}) => {
  const [progress, setProgress] = useState<ImportProgress>({
    current: 0,
    total: 0,
    status: 'idle',
    message: ''
  });
  const [showProgress, setShowProgress] = useState(false);

  const validRows = rows.filter(row => row.isValid && !row.isSectionHeader);

  const handleImport = async () => {
    if (validRows.length === 0) return;

    setShowProgress(true);
    setProgress({
      current: 0,
      total: validRows.length,
      status: 'importing',
      message: 'Starting import...'
    });

    try {
      // Check if online
      const isOnline = navigator.onLine;
      
      if (!isOnline) {
        // Queue for offline import
        const queueId = await queueImport(validRows, filename);
        setProgress({
          current: validRows.length,
          total: validRows.length,
          status: 'complete',
          message: 'Queued for import when online'
        });
        
        onImportComplete({
          imported: 0,
          skipped: 0,
          errors: []
        });
        return;
      }

      // Process in chunks of 250
      const chunkSize = 250;
      const chunks = [];
      for (let i = 0; i < validRows.length; i += chunkSize) {
        chunks.push(validRows.slice(i, i + chunkSize));
      }

      let imported = 0;
      const errors: ImportResult['errors'] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        setProgress({
          current: imported,
          total: validRows.length,
          status: 'importing',
          message: `Importing chunk ${i + 1} of ${chunks.length}...`
        });

        try {
          // Feature flag for backward compatibility
          const DROP_BRAND_AREA_FOR_RPC = false;
          
          const mappedRows = chunk.map(row => {
            const baseRow = {
              brand: row.brand || null,
              area: row.area || null,
              color: row.color || null,
              product_name: row.product_name,
              packed_case: row.packed_case,
              size_text: row.size_text || null,
              ex_vat_per_case: row.ex_vat_per_case || null,
              ex_vat_per_unit: row.ex_vat_per_unit || null,
              inc_vat_per_case: row.inc_vat_per_case || null,
              inc_vat_per_unit: row.inc_vat_per_unit || null,
              source_file: row.source_file || null,
              row_number: row.row_number || null
            };
            
            return baseRow;
          });

          const { error } = await supabase.rpc('upsert_product_prices', {
            rows: mappedRows
          });

          if (error) {
            chunk.forEach((row, index) => {
              errors.push({
                row: row.originalRowIndex,
                product: row.product_name,
                error: error.message
              });
            });
          } else {
            imported += chunk.length;
          }
        } catch (chunkError) {
          chunk.forEach((row, index) => {
            errors.push({
              row: row.originalRowIndex,
              product: row.product_name,
              error: `Import failed: ${chunkError}`
            });
          });
        }

        // Update progress
        setProgress({
          current: imported,
          total: validRows.length,
          status: 'importing',
          message: `Imported ${imported} of ${validRows.length} products...`
        });
      }

      setProgress({
        current: imported,
        total: validRows.length,
        status: 'complete',
        message: `Import complete: ${imported} products imported`
      });

      onImportComplete({
        imported,
        skipped: validRows.length - imported,
        errors
      });

    } catch (error) {
      setProgress({
        current: 0,
        total: validRows.length,
        status: 'error',
        message: `Import failed: ${error}`
      });
    }
  };

  const handleExport = () => {
    exportToExcel(rows, `${filename.replace('.xlsx', '')}-preview.xlsx`);
  };

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Import Actions</h3>
              <p className="text-sm text-gray-600">
                {validRows.length} valid products ready to import
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={rows.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Preview
              </Button>
              
              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || progress.status === 'importing'}
                className="flex items-center gap-2"
              >
                {progress.status === 'importing' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Import {validRows.length} Products
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Progress</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <Progress 
                value={(progress.current / progress.total) * 100} 
                className="w-full"
              />
            </div>
            
            <p className="text-sm text-gray-600">{progress.message}</p>
            
            {progress.status === 'complete' && (
              <Button 
                onClick={() => setShowProgress(false)}
                className="w-full"
              >
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};