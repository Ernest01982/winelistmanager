import React, { useState } from 'react';
import { Download, FileText, File, Save, Folder } from 'lucide-react';
import { Wine, CompanyInfo, WineListConfig } from '../types/wine';
import { generatePDF, generateExcel } from '../utils/exportUtils';

interface ExportOptionsProps {
  wines: Wine[];
  companyInfo: CompanyInfo;
  savedConfigs: WineListConfig[];
  currentConfigId: string;
  onSaveConfiguration: (name: string) => void;
  onLoadConfiguration: (configId: string) => void;
  onDeleteConfiguration: (configId: string) => void;
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  wines,
  companyInfo,
  savedConfigs,
  currentConfigId,
  onSaveConfiguration,
  onLoadConfiguration,
  onDeleteConfiguration
}) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [configName, setConfigName] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const selectedWines = wines.filter(wine => wine.selected);

  const handleExportPDF = async () => {
    if (selectedWines.length === 0) return;
    
    setIsExporting(true);
    try {
      generatePDF(selectedWines, companyInfo);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (selectedWines.length === 0) return;
    
    setIsExporting(true);
    try {
      generateExcel(selectedWines, companyInfo);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveConfig = () => {
    if (configName.trim()) {
      onSaveConfiguration(configName);
      setConfigName('');
      setSaveDialogOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Download className="h-5 w-5 text-burgundy-600" />
          Export & Save Options
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Export Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Export Wine List</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleExportPDF}
              disabled={selectedWines.length === 0 || isExporting}
              className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-5 w-5" />
              {isExporting ? 'Generating...' : 'Export PDF'}
            </button>
            
            <button
              onClick={handleExportExcel}
              disabled={selectedWines.length === 0 || isExporting}
              className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <File className="h-5 w-5" />
              {isExporting ? 'Generating...' : 'Export Excel'}
            </button>
          </div>
          
          {selectedWines.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Select wines from your inventory to enable exports
            </p>
          )}
        </div>

        {/* Save Configuration Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Save Configuration</h3>
          
          {!saveDialogOpen ? (
            <button
              onClick={() => setSaveDialogOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              <Save className="h-4 w-4" />
              Save Current Selection
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="Configuration name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSaveConfig()}
              />
              <button
                onClick={handleSaveConfig}
                disabled={!configName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setSaveDialogOpen(false);
                  setConfigName('');
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Saved Configurations */}
        {savedConfigs.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4 flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Saved Configurations
            </h3>
            <div className="space-y-2">
              {savedConfigs.map(config => (
                <div
                  key={config.id}
                  className={`flex items-center justify-between p-3 border rounded-lg ${
                    currentConfigId === config.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div>
                    <h4 className="font-medium text-gray-800">{config.name}</h4>
                    <p className="text-sm text-gray-500">
                      {config.selectedWines.length} wines • {config.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLoadConfiguration(config.id)}
                      className="text-blue-600 hover:text-blue-800 px-3 py-1 text-sm"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => onDeleteConfiguration(config.id)}
                      className="text-red-600 hover:text-red-800 px-3 py-1 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};