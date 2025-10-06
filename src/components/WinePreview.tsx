import React from 'react';
import { Eye, FileText } from 'lucide-react';
import { Wine, CompanyInfo } from '../types/wine';
import { normalizeColor } from '../types/pricing';

interface WinePreviewProps {
  wines: Wine[];
  companyInfo: CompanyInfo;
}

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

export const WinePreview: React.FC<WinePreviewProps> = ({ wines, companyInfo }) => {
  const selectedWines = wines.filter(wine => wine.selected);
  
  const winesByCategory = selectedWines.reduce((acc, wine) => {
    const category = getWineCategory(wine);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(wine);
    return acc;
  }, {} as Record<string, Wine[]>);

  if (selectedWines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No wines selected</h3>
        <p className="text-gray-500">Select wines from your inventory to preview the wine list</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Eye className="h-5 w-5 text-burgundy-600" />
          Wine List Preview ({selectedWines.length} wines)
        </h2>
      </div>

      <div className="p-6">
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
          {/* Preview Document */}
          <div className="bg-white p-8 m-4 rounded shadow-sm" style={{ minHeight: '600px' }}>
            {/* Header */}
            <div className="text-center mb-8 pb-4 border-b-2 border-burgundy-600">
              {companyInfo.logo && (
                <div className="flex justify-center mb-4">
                  <img 
                    src={companyInfo.logo} 
                    alt="Company Logo" 
                    className="max-h-16 max-w-48 object-contain"
                  />
                </div>
              )}
              <h1 className="text-3xl font-bold text-burgundy-800 mb-2">
                {companyInfo.name || 'Wine Selection'}
              </h1>
              {companyInfo.address && (
                <p className="text-gray-600 text-sm">{companyInfo.address}</p>
              )}
              <div className="flex justify-center items-center gap-4 mt-2 text-sm text-gray-600">
                {companyInfo.phone && <span>{companyInfo.phone}</span>}
                {companyInfo.email && <span>{companyInfo.email}</span>}
              </div>
              {companyInfo.website && (
                <p className="text-gray-600 text-sm mt-1">{companyInfo.website}</p>
              )}
            </div>

            {/* Wine Categories */}
            {Object.entries(winesByCategory).map(([category, categoryWines]) => (
              <div key={category} className="mb-8">
                <h2 className="text-xl font-bold text-burgundy-700 mb-4 pb-2 border-b border-gray-300">
                  {category}
                </h2>
                <div className="space-y-4">
                  {categoryWines.map(wine => (
                    <div key={wine.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {wine.name}
                          {wine.vintage && <span className="text-gray-600 ml-2">{wine.vintage}</span>}
                        </h3>
                        {wine.region && wine.varietal && (
                          <p className="text-sm text-gray-600 mt-1">
                            {wine.varietal} • {wine.region}
                          </p>
                        )}
                        {wine.description && (
                          <p className="text-sm text-gray-700 mt-1 italic">
                            {wine.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <span className="text-lg font-bold text-burgundy-600">
                          R{wine.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Footer */}
            <div className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
              Generated on {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};