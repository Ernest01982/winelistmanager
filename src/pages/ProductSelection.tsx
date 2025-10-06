import React, { useState, useEffect, useMemo } from 'react';
import { Wine, CompanyInfo, WineListConfig } from '../types/wine';
import { Supplier } from '../types/supplier';
import { Search, Package } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { supabase } from '../lib/supabase';
import { WinePreview } from '../components/WinePreview';
import { ExportOptions } from '../components/ExportOptions';

interface ProductSelectionProps {
  onSelectionChanged?: () => void;
  onProductsSynced?: (products: Wine[]) => void;
  companyInfo: CompanyInfo;
  savedConfigs: WineListConfig[];
  currentConfigId: string;
  onSaveConfiguration: (name: string) => void;
  onLoadConfiguration: (configId: string) => void;
  onDeleteConfiguration: (configId: string) => void;
}

export const ProductSelection: React.FC<ProductSelectionProps> = ({
  onSelectionChanged,
  onProductsSynced,
  companyInfo,
  savedConfigs,
  currentConfigId,
  onSaveConfiguration,
  onLoadConfiguration,
  onDeleteConfiguration,
}) => {
  const [products, setProducts] = useState<Wine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadProducts(), loadSuppliers()]);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          suppliers (
            id,
            name
          )
        `)
        .order('name');

      if (fetchError) throw fetchError;

      const productsWithSupplier = (data || []).map(product => {
        const parsedPrice = Number(product.price);

        return {
          ...product,
          price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
          supplier: product.suppliers?.name,
          supplier_id: product.supplier_id || undefined,
        } as Wine;
      });

      setProducts(productsWithSupplier);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products. Please try again.');
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

  useEffect(() => {
    if (products.length > 0 || !loading) {
      onProductsSynced?.(products);
    }
  }, [products, loading, onProductsSynced]);

  const toggleProductSelection = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({ selected: !product.selected })
        .eq('id', productId);

      if (updateError) throw updateError;

      const updatedProducts = products.map(p =>
        p.id === productId ? { ...p, selected: !p.selected } : p
      );

      setProducts(updatedProducts);
      onSelectionChanged?.();
    } catch (err) {
      console.error('Failed to update product selection:', err);
    }
  };

  const categoryOptions = useMemo(() => {
    const categories = Array.from(
      new Set(
        products
          .map(product => product.category)
          .filter((category): category is string => Boolean(category))
      )
    ).sort((a, b) => a.localeCompare(b));

    return categories;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase();

    return products.filter(product => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        (product.description && product.description.toLowerCase().includes(normalizedSearch)) ||
        (product.supplier && product.supplier.toLowerCase().includes(normalizedSearch)) ||
        (product.category && product.category.toLowerCase().includes(normalizedSearch));

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      const matchesSupplier =
        selectedSupplier === 'all' ||
        (selectedSupplier === '_no_supplier' && !product.supplier_id) ||
        product.supplier_id === selectedSupplier;

      return matchesSearch && matchesCategory && matchesSupplier;
    });
  }, [products, searchTerm, selectedCategory, selectedSupplier]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-6 w-6 text-burgundy-600" />
                  Select Products for Wine List
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCount} of {products.length} products selected
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedSupplier('all');
                  }}
                >
                  Clear Filters
                </Button>
                <Button onClick={loadData}>Refresh</Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, description or supplier"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-200"
                >
                  <option value="all">All categories</option>
                  {categoryOptions.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-sm focus:border-burgundy-500 focus:outline-none focus:ring-2 focus:ring-burgundy-200"
                >
                  <option value="all">All suppliers</option>
                  <option value="_no_supplier">No supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="p-6">
            {products.length === 0 ? (
              <div className="py-12 text-center">
                <Package className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-700">No products found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Add products in the Products page to start building your wine list.
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center">
                <h3 className="text-lg font-medium text-gray-700">No products match your filters</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Adjust your search or filter selections to see more products.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="hidden lg:table-cell">Supplier</TableHead>
                      <TableHead className="hidden lg:table-cell">Category</TableHead>
                      <TableHead className="hidden md:table-cell">Vintage</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(product => (
                      <TableRow
                        key={product.id}
                        className={product.selected ? 'bg-burgundy-50/60' : undefined}
                      >
                        <TableCell className="w-12 align-middle">
                          <input
                            type="checkbox"
                            checked={product.selected}
                            onChange={() => toggleProductSelection(product.id)}
                            className="h-4 w-4 rounded border-gray-300 text-burgundy-600 focus:ring-burgundy-500"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="text-base font-semibold text-gray-900">{product.name}</div>
                            {product.description && (
                              <p className="text-sm text-gray-600">{product.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
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
                        </TableCell>
                        <TableCell className="hidden lg:table-cell align-middle text-sm text-gray-600">
                          {product.supplier || <span className="text-gray-400">No supplier</span>}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell align-middle text-sm text-gray-600">
                          {product.category || 'Uncategorised'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell align-middle text-sm text-gray-600">
                          {product.vintage || '—'}
                        </TableCell>
                        <TableCell className="align-middle text-right text-base font-semibold text-burgundy-600">
                          R{product.price.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <WinePreview wines={products} companyInfo={companyInfo} />
          <ExportOptions
            wines={products}
            companyInfo={companyInfo}
            savedConfigs={savedConfigs}
            currentConfigId={currentConfigId}
            onSaveConfiguration={onSaveConfiguration}
            onLoadConfiguration={onLoadConfiguration}
            onDeleteConfiguration={onDeleteConfiguration}
          />
        </div>
      </div>
    </div>
  );
};
