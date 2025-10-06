import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { ParseResult } from '../../types/pricing';

interface ValidationSummaryProps {
  parseResult: ParseResult;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ parseResult }) => {
  const { totalRows, validRows, invalidRows, sectionHeaders, errors, warnings } = parseResult;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Total Rows</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalRows}</p>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Valid</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{validRows}</p>
        </div>
        
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Invalid</span>
          </div>
          <p className="text-2xl font-bold text-red-900">{invalidRows}</p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="h-4 w-4 p-0" />
            <span className="text-sm font-medium text-gray-800">Sections</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{sectionHeaders}</p>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{errors.length} validation errors found:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {errors.slice(0, 10).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {errors.length > 10 && (
                  <li className="text-red-600 font-medium">
                    ... and {errors.length - 10} more errors
                  </li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">{warnings.length} warnings found:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {warnings.slice(0, 5).map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
                {warnings.length > 5 && (
                  <li className="text-yellow-600 font-medium">
                    ... and {warnings.length - 5} more warnings
                  </li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success */}
      {validRows > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <p className={`font-medium ${errors.length === 0 ? 'text-green-800' : 'text-blue-800'}`}>
              Ready to import {validRows} valid products
              {warnings.length > 0 && ` (${warnings.length} warnings)`}
              {errors.length > 0 && ` • ${errors.length} errors to fix`}
              {sectionHeaders > 0 && ` • ${sectionHeaders} section headers detected`}
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};