import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import { parseCSVFile, parseExcelFile } from '../utils/fileParser';
import { Wine } from '../types/wine';
import { generateWineUploadTemplate, generateWineCSVTemplate } from '../utils/templateGenerator';

interface FileUploadProps {
  onWinesUploaded: (wines: Wine[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onWinesUploaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    details?: string[];
  }>({ type: null, message: '' });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      setUploadStatus({
        type: 'error',
        message: 'Invalid file format. Please upload CSV or Excel files only.'
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus({ type: null, message: '' });

    try {
      let parseResult;
      
      if (fileExtension === 'csv') {
        parseResult = await parseCSVFile(file);
      } else {
        parseResult = await parseExcelFile(file);
      }

      if (parseResult.errors.length > 0) {
        setUploadStatus({
          type: 'error',
          message: `Upload completed with ${parseResult.errors.length} errors`,
          details: parseResult.errors
        });
      } else {
        setUploadStatus({
          type: 'success',
          message: `Successfully uploaded ${parseResult.wines.length} wines`
        });
      }

      onWinesUploaded(parseResult.wines);
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: 'Failed to process file'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-yellow-400 bg-yellow-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className={`mx-auto h-12 w-12 mb-4 ${
          isDragging ? 'text-yellow-600' : 'text-gray-400'
        }`} />
        
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Upload Wine Inventory
        </h3>
        
        <p className="text-gray-500 mb-4">
          Drag and drop your CSV or Excel file here, or click to browse
        </p>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-burgundy-600 hover:bg-burgundy-700 text-white px-6 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Processing...' : 'Choose File'}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="mt-4 text-sm text-gray-500">
          <div className="flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              CSV
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Excel (.xlsx, .xls)
            </span>
          </div>
        </div>
      </div>

      {uploadStatus.type && (
        <div className={`mt-4 p-4 rounded-lg ${
          uploadStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start gap-3">
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-medium ${
                uploadStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {uploadStatus.message}
              </p>
              {uploadStatus.details && (
                <ul className="mt-2 text-sm text-red-700">
                  {uploadStatus.details.slice(0, 5).map((detail, index) => (
                    <li key={index} className="list-disc list-inside">
                      {detail}
                    </li>
                  ))}
                  {uploadStatus.details.length > 5 && (
                    <li className="text-red-600 font-medium">
                      ... and {uploadStatus.details.length - 5} more errors
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Expected File Format:</h4>
        <div className="flex gap-2 mb-4">
          <button
            onClick={generateWineUploadTemplate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
          >
            <Download className="h-4 w-4" />
            Download Excel Template
          </button>
          <button
            onClick={generateWineCSVTemplate}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors duration-200"
          >
            <Download className="h-4 w-4" />
            Download CSV Template
          </button>
        </div>
        <div className="text-sm text-blue-700">
          <p className="mb-2"><strong>Required columns:</strong> Wine Name, Price (or similar)</p>
          <p className="mb-2"><strong>Standard columns:</strong> Description, Category, Vintage, Region, Varietal</p>
          <p className="mb-2"><strong>Pricing columns:</strong> Wholesale Price, Markup, Supplier, SKU, Stock</p>
          <div className="mt-3 p-3 bg-white rounded border">
            <p className="font-medium mb-1">Supported column variations:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>• Wine Name, Product Name, Name</div>
              <div>• Price, Cost, Retail Price, Selling Price</div>
              <div>• Description, Notes, Tasting Notes</div>
              <div>• Category, Type, Wine Type, Style</div>
              <div>• Vintage, Year</div>
              <div>• Region, Appellation, Origin</div>
              <div>• Varietal, Grape, Variety</div>
              <div>• Wholesale, Cost Price, Buy Price</div>
              <div>• Markup, Margin, Markup Percentage</div>
              <div>• Supplier, Vendor, Distributor</div>
              <div>• SKU, Product Code, Item Code</div>
              <div>• Stock, Inventory, Quantity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};