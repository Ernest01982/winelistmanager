import React, { useState, useEffect, useMemo } from 'react';
import { Wine } from '../types/wine';
import { Supplier } from '../types/supplier';
import { Search, ChevronDown, ChevronRight, Package, Check } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';

interface ProductSelectionProps {
  onSelectionChanged?: () => void;
}

export const ProductSelection: React.FC<ProductSelectionProps> = ({ onSelectionChanged }) => {
  const [products, setProducts] = useState<Wine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'hierarchy' | 'category'>('hierarchy');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadProducts(), loadSuppliers()]);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          suppliers (
            id,
            name
          )
        `)
        .order('name');

      if (error) throw error;

      const productsWithSupplier = (data || []).map(product => ({
        ...product,
        supplier: product.suppliers?.name,
        supplier_id: product.supplier_id || undefined
      }));

      setProducts(productsWithSupplier);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    }
  };

  const toggleProductSelection = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ selected: !product.selected })
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, selected: !p.selected } : p
      ));

      onSelectionChanged?.();
    } catch (err) {
      console.error('Failed to update product selection:', err);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const hierarchicalData = useMemo(() => {
    const grouped = new Map<string, Map<string, Wine[]>>();

    // Add "No Supplier" group
    const noSupplierProducts = filteredProducts.filter(p => !p.supplier_id);
    if (noSupplierProducts.length > 0) {
      const categoryMap = new Map<string, Wine[]>();
      noSupplierProducts.forEach(product => {
        const category = product.category || 'Uncategorized';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(product);
      });
      grouped.set('_no_supplier', categoryMap);
    }

    // Group by supplier
    suppliers.forEach(supplier => {
      const supplierProducts = filteredProducts.filter(p => p.supplier_id === supplier.id);
      if (supplierProducts.length > 0) {
        const categoryMap = new Map<string, Wine[]>();
        supplierProducts.forEach(product => {
          const category = product.category || 'Uncategorized';
          if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
          }
          categoryMap.get(category)!.push(product);
        });
        grouped.set(supplier.id, categoryMap);
      }
    });

    return grouped;
  }, [filteredProducts, suppliers]);

  const categoryData = useMemo(() => {
    const grouped = new Map<string, Wine[]>();

    filteredProducts.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(product);
    });

    return grouped;
  }, [filteredProducts]);

  const toggleSupplier = (supplierId: string) => {
    setExpandedSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(supplierId)) {
        next.delete(supplierId);
      } else {
        next.add(supplierId);
      }
      return next;
    });
  };

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectedCount = products.filter(p => p.selected).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-burgundy-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-6 w-6 text-burgundy-600" />
                  Select Products for Wine List
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCount} of {products.length} products selected
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setViewMode('hierarchy')}
                  className={viewMode === 'hierarchy' ? 'bg-burgundy-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
                >
                  By Supplier
                </Button>
                <Button
                  onClick={() => setViewMode('category')}
                  className={viewMode === 'category' ? 'bg-burgundy-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
                >
                  By Category
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
          </div>

          <div className="p-6">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">No products yet</h3>
                <p className="text-gray-500">Add products in the Products page to get started</p>
              </div>
            ) : viewMode === 'hierarchy' ? (
              <div className="space-y-4">
                {Array.from(hierarchicalData.entries()).map(([supplierId, categories]) => {
                  const supplier = suppliers.find(s => s.id === supplierId);
                  const supplierName = supplierId === '_no_supplier' ? 'No Supplier' : (supplier?.name || 'Unknown');
                  const isExpanded = expandedSuppliers.has(supplierId);
                  const supplierProductCount = Array.from(categories.values()).reduce((sum, prods) => sum + prods.length, 0);
                  const selectedInSupplier = Array.from(categories.values()).reduce((sum, prods) => sum + prods.filter(p => p.selected).length, 0);

                  return (
                    <div key={supplierId} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        onClick={() => toggleSupplier(supplierId)}
                        className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                          <span className="font-semibold text-gray-900">{supplierName}</span>
                          <Badge variant="secondary">
                            {selectedInSupplier} / {supplierProductCount} selected
                          </Badge>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 space-y-3">
                          {Array.from(categories.entries()).map(([category, categoryProducts]) => {
                            const categoryKey = `${supplierId}-${category}`;
                            const isCategoryExpanded = expandedCategories.has(categoryKey);
                            const selectedInCategory = categoryProducts.filter(p => p.selected).length;

                            return (
                              <div key={categoryKey} className="border border-gray-100 rounded-md overflow-hidden">
                                <div
                                  onClick={() => toggleCategory(categoryKey)}
                                  className="bg-white px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    {isCategoryExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-400" />
                                    )}
                                    <span className="font-medium text-gray-700">{category}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {selectedInCategory} / {categoryProducts.length}
                                    </Badge>
                                  </div>
                                </div>

                                {isCategoryExpanded && (
                                  <div className="bg-white px-4 py-2 space-y-2">
                                    {categoryProducts.map(product => (
                                      <div
                                        key={product.id}
                                        onClick={() => toggleProductSelection(product.id)}
                                        className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                                      >
                                        <div className={`flex-shrink-0 mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                          product.selected
                                            ? 'bg-burgundy-600 border-burgundy-600'
                                            : 'border-gray-300 bg-white'
                                        }`}>
                                          {product.selected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                              <h4 className="font-medium text-gray-900">{product.name}</h4>
                                              {product.vintage && (
                                                <p className="text-xs text-gray-500">{product.vintage}</p>
                                              )}
                                              {product.description && (
                                                <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                                              )}
                                              <div className="flex gap-2 mt-2 flex-wrap">
                                                {product.region && (
                                                  <Badge variant="secondary" className="text-xs">
                                                    {product.region}
                                                  </Badge>
                                                )}
                                                {product.varietal && (
                                                  <Badge variant="secondary" className="text-xs">
                                                    {product.varietal}
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                              <span className="text-lg font-semibold text-burgundy-600">
                                                R{product.price.toFixed(2)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from(categoryData.entries()).map(([category, categoryProducts]) => {
                  const isCategoryExpanded = expandedCategories.has(category);
                  const selectedInCategory = categoryProducts.filter(p => p.selected).length;

                  return (
                    <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        onClick={() => toggleCategory(category)}
                        className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isCategoryExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-500" />
                          )}
                          <span className="font-semibold text-gray-900">{category}</span>
                          <Badge variant="secondary">
                            {selectedInCategory} / {categoryProducts.length} selected
                          </Badge>
                        </div>
                      </div>

                      {isCategoryExpanded && (
                        <div className="bg-white px-4 py-2 space-y-2">
                          {categoryProducts.map(product => (
                            <div
                              key={product.id}
                              onClick={() => toggleProductSelection(product.id)}
                              className="flex items-start gap-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                            >
                              <div className={`flex-shrink-0 mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                product.selected
                                  ? 'bg-burgundy-600 border-burgundy-600'
                                  : 'border-gray-300 bg-white'
                              }`}>
                                {product.selected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                                    {product.vintage && (
                                      <p className="text-xs text-gray-500">{product.vintage}</p>
                                    )}
                                    {product.supplier && (
                                      <p className="text-xs text-gray-500 mt-1">Supplier: {product.supplier}</p>
                                    )}
                                    {product.description && (
                                      <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                                    )}
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                      {product.region && (
                                        <Badge variant="secondary" className="text-xs">
                                          {product.region}
                                        </Badge>
                                      )}
                                      {product.varietal && (
                                        <Badge variant="secondary" className="text-xs">
                                          {product.varietal}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <span className="text-lg font-semibold text-burgundy-600">
                                      R{product.price.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
