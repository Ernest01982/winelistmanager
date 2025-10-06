import React, { useState } from 'react';
import { Wine as WineIcon, Eye, Download, Settings, Package, Truck } from 'lucide-react';
import { CompanyBranding } from './components/CompanyBranding';
import { WinePreview } from './components/WinePreview';
import { ExportOptions } from './components/ExportOptions';
import { useWineData } from './hooks/useWineData';
import { ProductManagement } from './pages/ProductManagement';
import { ProductSelection } from './pages/ProductSelection';
import { SupplierManagement } from './pages/SupplierManagement';

type ActiveTab = 'branding' | 'selection' | 'preview' | 'export' | 'products' | 'suppliers';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const {
    wines,
    companyInfo,
    savedConfigs,
    currentConfigId,
    updateWines,
    updateCompanyInfo,
    saveConfiguration,
    loadConfiguration,
    deleteConfiguration,
  } = useWineData();

  const selectedCount = wines.filter(wine => wine.selected).length;

  const tabs = [
    { id: 'suppliers' as ActiveTab, label: 'Suppliers', icon: Truck, disabled: false },
    { id: 'products' as ActiveTab, label: 'Products', icon: Package, disabled: false },
    { id: 'selection' as ActiveTab, label: 'Selection', icon: WineIcon, disabled: false },
    { id: 'branding' as ActiveTab, label: 'Branding', icon: Settings, disabled: false },
    { id: 'preview' as ActiveTab, label: 'Preview', icon: Eye, disabled: selectedCount === 0 },
    { id: 'export' as ActiveTab, label: 'Export', icon: Download, disabled: selectedCount === 0 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-burgundy-600 p-2 rounded-lg">
                <WineIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">WineList Manager</h1>
                <p className="text-sm text-gray-500">Professional wine list creation system</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {wines.length > 0 && `${wines.length} wines imported • ${selectedCount} selected`}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isDisabled = tab.disabled;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    isActive
                      ? 'border-burgundy-500 text-burgundy-600'
                      : isDisabled
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {activeTab === 'suppliers' && (
            <SupplierManagement />
          )}

          {activeTab === 'products' && (
            <ProductManagement />
          )}

          {activeTab === 'selection' && (
            <ProductSelection
              companyInfo={companyInfo}
              savedConfigs={savedConfigs}
              currentConfigId={currentConfigId}
              onSaveConfiguration={saveConfiguration}
              onLoadConfiguration={loadConfiguration}
              onDeleteConfiguration={deleteConfiguration}
              onProductsSynced={updateWines}
            />
          )}

          {activeTab === 'branding' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Branding</h2>
                <p className="text-gray-600">
                  Set up your company information and branding for the wine list
                </p>
              </div>
              <CompanyBranding 
                companyInfo={companyInfo}
                onCompanyInfoChange={updateCompanyInfo}
              />
            </div>
          )}


          {activeTab === 'preview' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview Wine List</h2>
                <p className="text-gray-600">
                  Review how your wine list will appear to customers
                </p>
              </div>
              <WinePreview 
                wines={wines}
                companyInfo={companyInfo}
              />
            </div>
          )}

          {activeTab === 'export' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Export & Save</h2>
                <p className="text-gray-600">
                  Generate professional wine lists and save configurations
                </p>
              </div>
              <ExportOptions 
                wines={wines}
                companyInfo={companyInfo}
                savedConfigs={savedConfigs}
                currentConfigId={currentConfigId}
                onSaveConfiguration={saveConfiguration}
                onLoadConfiguration={loadConfiguration}
                onDeleteConfiguration={deleteConfiguration}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;