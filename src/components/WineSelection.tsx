import React, { useState, useMemo } from 'react';
import { Search, Filter, Wine as WineIcon, DollarSign, X, Building2 } from 'lucide-react';
import { Wine, WineCategory } from '../types/wine';
import { normalizeColor } from '../types/pricing';

interface WineSelectionProps {
  wines: Wine[];
  onToggleWine: (wineId: string) => void;
}

const WINE_CATEGORIES: WineCategory[] = [
  'Red Wine',
  'White Wine',
  'Sparkling Wine',
  'Rosé Wine',
  'Dessert Wine',
  'Fortified Wine',
  'Gin',
  'Shooter',
  'RTD',
  'Canned Wines',
  'Brandy',
  'Bitters'
];

// Map uploaded categories to standardized categories
const CATEGORY_MAPPINGS: Record<string, WineCategory> = {
  // Red wine variations
  'red': 'Red Wine',
  'red wine': 'Red Wine',
  'rouge': 'Red Wine',

  // White wine variations
  'white': 'White Wine',
  'white wine': 'White Wine',
  'blanc': 'White Wine',

  // Sparkling variations
  'sparkling': 'Sparkling Wine',
  'sparkling wine': 'Sparkling Wine',
  'champagne': 'Sparkling Wine',
  'prosecco': 'Sparkling Wine',
  'cava': 'Sparkling Wine',
  'mcc': 'Sparkling Wine',
  'cap classique': 'Sparkling Wine',

  // Rosé variations
  'rose': 'Rosé Wine',
  'rosé': 'Rosé Wine',
  'rosé wine': 'Rosé Wine',
  'rose wine': 'Rosé Wine',
  'blush': 'Rosé Wine',

  // Dessert variations
  'dessert': 'Dessert Wine',
  'dessert wine': 'Dessert Wine',
  'sweet': 'Dessert Wine',
  'port': 'Fortified Wine',

  // Fortified variations
  'fortified': 'Fortified Wine',
  'fortified wine': 'Fortified Wine',
  'sherry': 'Fortified Wine',

  // Spirits
  'gin': 'Gin',
  'shooter': 'Shooter',
  'shooters': 'Shooter',
  'rtd': 'RTD',
  'ready to drink': 'RTD',
  'brandy': 'Brandy',
  'bitters': 'Bitters',

  // Canned wines variations
  'canned': 'Canned Wines',
  'canned wine': 'Canned Wines',
  'canned wines': 'Canned Wines',
  'vinette': 'Canned Wines',
  'vinnete': 'Canned Wines',
  'can': 'Canned Wines'
};

// Get the wine's category - use uploaded category if available, otherwise infer from color
function getWineCategory(wine: Wine): string {
  if (wine.category) {
    // First check exact match
    if (WINE_CATEGORIES.includes(wine.category as WineCategory)) {
      return wine.category;
    }

    // Then check normalized mapping
    const normalizedCategory = wine.category.toLowerCase().trim();
    if (CATEGORY_MAPPINGS[normalizedCategory]) {
      return CATEGORY_MAPPINGS[normalizedCategory];
    }

    // Return as-is if no mapping found
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

// Filter by categories using uploaded category or inferred category
const matchesCategory = (wine: Wine, selectedCategory: string): boolean => {
  if (!selectedCategory) return true;
  const wineCategory = getWineCategory(wine);
  return wineCategory === selectedCategory;
};

export const WineSelection: React.FC<WineSelectionProps> = ({ wines, onToggleWine }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });

  const filteredWines = useMemo(() => {
    return wines.filter(wine => {
      const matchesSearch = wine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          wine.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (wine.region && wine.region.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = matchesCategory(wine, selectedCategory);
      const matchesSupplier = !selectedSupplier || wine.supplier === selectedSupplier;
      const matchesPrice = wine.price >= priceRange.min && wine.price <= priceRange.max;

      return matchesSearch && matchesCat && matchesSupplier && matchesPrice;
    });
  }, [wines, searchTerm, selectedCategory, selectedSupplier, priceRange]);

  const selectedCount = wines.filter(wine => wine.selected).length;

  // Get unique suppliers from wines
  const uniqueSuppliers = useMemo(() => {
    return Array.from(new Set(wines
      .filter(wine => wine.supplier && wine.supplier.trim() !== '')
      .map(wine => wine.supplier!)
    )).sort();
  }, [wines]);

  const handleClearSelection = () => {
    wines.forEach(wine => {
      if (wine.selected) {
        onToggleWine(wine.id);
      }
    });
  };

  if (wines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <WineIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No wines uploaded</h3>
        <p className="text-gray-500">Upload a wine inventory file to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <WineIcon className="h-5 w-5 text-burgundy-600" />
            Wine Selection ({selectedCount} selected)
          </h2>
          {selectedCount > 0 && (
            <button
              onClick={handleClearSelection}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md transition-colors duration-200 text-sm"
            >
              <X className="h-4 w-4" />
              Clear Selection
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search wines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:border-transparent appearance-none"
            >
              <option value="">All Categories</option>
              {WINE_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500 focus:border-transparent"
            >
              <option value="">All Suppliers</option>
              {uniqueSuppliers.map(supplier => (
                <option key={supplier} value={supplier}>{supplier}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredWines.map(wine => (
            <div
              key={wine.id}
              onClick={() => onToggleWine(wine.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                wine.selected 
                  ? 'border-burgundy-500 bg-burgundy-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">
                  {wine.name}
                  {wine.vintage && <span className="text-gray-600 ml-1">{wine.vintage}</span>}
                </h3>
                <span className="text-lg font-bold text-burgundy-600 ml-2 flex-shrink-0">
                  R{wine.price.toFixed(2)}
                </span>
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                <span className="bg-gray-100 px-2 py-1 rounded">{getWineCategory(wine)}</span>
                {wine.region && (
                  <span className="bg-gray-100 px-2 py-1 rounded ml-1">{wine.region}</span>
                )}
                {wine.supplier && (
                  <span className="bg-blue-100 px-2 py-1 rounded ml-1 text-blue-800">{wine.supplier}</span>
                )}
              </div>
              
              {wine.description && (
                <p className="text-xs text-gray-600 line-clamp-2">{wine.description}</p>
              )}
              
              <div className={`mt-3 w-4 h-4 rounded-full border-2 ${
                wine.selected 
                  ? 'bg-burgundy-600 border-burgundy-600' 
                  : 'border-gray-300'
              }`}>
                {wine.selected && (
                  <div className="w-full h-full rounded-full bg-white scale-50"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredWines.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Filter className="mx-auto h-8 w-8 mb-2" />
            <p>No wines match your current filters</p>
          </div>
        )}
      </div>
    </div>
  );
};