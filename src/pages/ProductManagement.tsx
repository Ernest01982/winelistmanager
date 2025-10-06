import React, { useState, useEffect, useRef } from 'react';
import { Wine } from '../types/wine';
import { Supplier } from '../types/supplier';
import { Trash2, Plus, Package, Search, CreditCard as Edit2, X, PlusCircle, Upload, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { supabase } from '../lib/supabase';
import { generateProductUploadTemplate, parseProductUploadFile } from '../utils/productUpload';

interface ProductManagementProps {
  onProductsChanged?: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ onProductsChanged }) => {
  const [products, setProducts] = useState<Wine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isQuickAddSupplierOpen, setIsQuickAddSupplierOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Wine | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [uploadAlertType, setUploadAlertType] = useState<'error' | 'warning' | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Red Wine',
    vintage: '',
    price: '',
    region: '',
    varietal: '',
    supplier_id: ''
  });

  const [quickSupplierData, setQuickSupplierData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: ''
  });

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

      const productsWithSupplier = (data || []).map(product => {
        const parsedPrice = Number(product.price);

        return {
          ...product,
          price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
          supplier: product.suppliers?.name,
          supplier_id: product.supplier_id || undefined
        };
      });

      setProducts(productsWithSupplier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
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

  const handleDownloadTemplate = () => {
    generateProductUploadTemplate();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadMessage(null);
    setUploadErrors([]);
    setUploadAlertType(null);
    setUploading(true);

    try {
      const result = await parseProductUploadFile(file);
      const supplierNameLookup = new Map(
        suppliers.map(supplier => [supplier.name.trim().toLowerCase(), supplier.id])
      );
      const supplierIdLookup = new Set(suppliers.map(supplier => supplier.id));
      const supplierErrors: string[] = [];

      const rowsToUpsert = result.products.map(product => {
        let supplierId: string | null = null;

        if (product.supplierId) {
          if (supplierIdLookup.has(product.supplierId)) {
            supplierId = product.supplierId;
          } else {
            supplierErrors.push(
              `Row ${product.rowNumber}: Supplier ID "${product.supplierId}" was not found.`
            );
            return null;
          }
        } else if (product.supplier) {
          const lookupId = supplierNameLookup.get(product.supplier.trim().toLowerCase());
          if (lookupId) {
            supplierId = lookupId;
          } else {
            supplierErrors.push(
              `Row ${product.rowNumber}: Supplier "${product.supplier}" was not found. Add the supplier first or leave the field blank.`
            );
            return null;
          }
        }

        const toNullable = (value?: string) => (value && value.trim() !== '' ? value.trim() : null);

        return {
          id: product.id || undefined,
          name: product.name.trim(),
          description: toNullable(product.description),
          category: toNullable(product.category) || 'Red Wine',
          vintage: toNullable(product.vintage),
          price: product.price,
          region: toNullable(product.region),
          varietal: toNullable(product.varietal),
          supplier_id: supplierId
        };
      }).filter((row): row is {
        id?: string;
        name: string;
        description: string | null;
        category: string;
        vintage: string | null;
        price: number;
        region: string | null;
        varietal: string | null;
        supplier_id: string | null;
      } => row !== null);

      const combinedErrors = [...result.errors, ...supplierErrors];

      if (rowsToUpsert.length === 0) {
        setUploadErrors(combinedErrors.length ? combinedErrors : ['No valid rows found in the file.']);
        setUploadAlertType('error');
        return;
      }

      const { error: upsertError } = await supabase
        .from('products')
        .upsert(rowsToUpsert, { onConflict: 'id' });

      if (upsertError) {
        throw upsertError;
      }

      setUploadMessage(`Successfully uploaded ${rowsToUpsert.length} product${rowsToUpsert.length === 1 ? '' : 's'}.`);

      if (combinedErrors.length) {
        setUploadErrors(combinedErrors);
        setUploadAlertType('warning');
      } else {
        setUploadErrors([]);
        setUploadAlertType(null);
      }

      await loadProducts();
      onProductsChanged?.();
    } catch (uploadErr) {
      let errorMessage = 'Failed to upload products.';

      if (uploadErr instanceof Error) {
        errorMessage = uploadErr.message;
      } else if (
        uploadErr &&
        typeof uploadErr === 'object' &&
        'message' in uploadErr &&
        typeof (uploadErr as { message?: unknown }).message === 'string'
      ) {
        errorMessage = (uploadErr as { message: string }).message;
        if (
          'details' in uploadErr &&
          typeof (uploadErr as { details?: unknown }).details === 'string' &&
          (uploadErr as { details: string }).details.trim()
        ) {
          errorMessage = `${errorMessage} — ${(uploadErr as { details: string }).details}`;
        }
      }

      setUploadErrors([errorMessage]);
      setUploadAlertType('error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.supplier && product.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleQuickAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          name: quickSupplierData.name,
          contact_person: quickSupplierData.contact_person,
          email: quickSupplierData.email,
          phone: quickSupplierData.phone
        }])
        .select()
        .single();

      if (error) throw error;

      await loadSuppliers();
      setFormData({ ...formData, supplier_id: data.id });
      setQuickSupplierData({ name: '', contact_person: '', email: '', phone: '' });
      setIsQuickAddSupplierOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add supplier');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        vintage: formData.vintage || null,
        price: parseFloat(formData.price),
        region: formData.region || null,
        varietal: formData.varietal || null,
        supplier_id: formData.supplier_id || null
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
      }

      await loadProducts();
      handleCloseDialog();
      onProductsChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  const handleEdit = (product: Wine) => {
    setFormData({
      name: product.name,
      description: product.description,
      category: product.category,
      vintage: product.vintage || '',
      price: product.price.toString(),
      region: product.region || '',
      varietal: product.varietal || '',
      supplier_id: product.supplier_id || ''
    });
    setEditingProduct(product);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      await loadProducts();
      setDeleteConfirm(null);
      onProductsChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category: 'Red Wine',
      vintage: '',
      price: '',
      region: '',
      varietal: '',
      supplier_id: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-6 w-6 text-burgundy-600" />
                  Product Management
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your wine inventory ({products.length} products)
                </p>
              </div>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-burgundy-600 hover:bg-burgundy-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                        />
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Supplier
                          </label>
                          <Dialog open={isQuickAddSupplierOpen} onOpenChange={setIsQuickAddSupplierOpen}>
                            <DialogTrigger asChild>
                              <button
                                type="button"
                                className="text-xs text-burgundy-600 hover:text-burgundy-700 flex items-center gap-1"
                              >
                                <PlusCircle className="h-3 w-3" />
                                Quick Add Supplier
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Quick Add Supplier</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleQuickAddSupplier} className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Supplier Name *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={quickSupplierData.name}
                                    onChange={(e) => setQuickSupplierData({ ...quickSupplierData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Person
                                  </label>
                                  <input
                                    type="text"
                                    value={quickSupplierData.contact_person}
                                    onChange={(e) => setQuickSupplierData({ ...quickSupplierData, contact_person: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                  </label>
                                  <input
                                    type="email"
                                    value={quickSupplierData.email}
                                    onChange={(e) => setQuickSupplierData({ ...quickSupplierData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                  </label>
                                  <input
                                    type="tel"
                                    value={quickSupplierData.phone}
                                    onChange={(e) => setQuickSupplierData({ ...quickSupplierData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                                  />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                  <Button
                                    type="button"
                                    onClick={() => setIsQuickAddSupplierOpen(false)}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="submit"
                                    className="bg-burgundy-600 hover:bg-burgundy-700 text-white"
                                  >
                                    Add Supplier
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <select
                          value={formData.supplier_id}
                          onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                        >
                          <option value="">No Supplier</option>
                          {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                        >
                          <option value="Red Wine">Red Wine</option>
                          <option value="White Wine">White Wine</option>
                          <option value="Sparkling Wine">Sparkling Wine</option>
                          <option value="Rosé Wine">Rosé Wine</option>
                          <option value="Dessert Wine">Dessert Wine</option>
                          <option value="Fortified Wine">Fortified Wine</option>
                          <option value="Gin">Gin</option>
                          <option value="Shooter">Shooter</option>
                          <option value="RTD">RTD</option>
                          <option value="Canned Wines">Canned Wines</option>
                          <option value="Brandy">Brandy</option>
                          <option value="Bitters">Bitters</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price (R) *
                        </label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vintage
                        </label>
                        <input
                          type="text"
                          value={formData.vintage}
                          onChange={(e) => setFormData({ ...formData, vintage: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Region
                        </label>
                        <input
                          type="text"
                          value={formData.region}
                          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Varietal
                        </label>
                        <input
                          type="text"
                          value={formData.varietal}
                          onChange={(e) => setFormData({ ...formData, varietal: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                        />
                      </div>
                    </div>

                    {error && (
                      <Alert className="bg-red-50 border-red-200">
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        onClick={handleCloseDialog}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-burgundy-600 hover:bg-burgundy-700 text-white"
                      >
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {error && !isAddDialogOpen && (
              <Alert className="mb-4 bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-800">Bulk upload products</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Download the template, fill in your product details, and upload an Excel or CSV file to add or update products in bulk.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="bg-white text-burgundy-600 border border-burgundy-200 hover:bg-burgundy-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Excel Template
                  </Button>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-burgundy-600 hover:bg-burgundy-700 text-white"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload Products'}
                  </Button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              {uploadMessage && (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">{uploadMessage}</AlertDescription>
                </Alert>
              )}

              {uploadAlertType && uploadErrors.length > 0 && (
                <Alert
                  className={`mt-4 ${
                    uploadAlertType === 'warning'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <AlertDescription
                    className={uploadAlertType === 'warning' ? 'text-amber-800' : 'text-red-800'}
                  >
                    <ul className="list-disc pl-5 space-y-1">
                      {uploadErrors.map((errMsg, index) => (
                        <li key={index}>{errMsg}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, description, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-burgundy-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-4">
                Use the bulk upload tools above to import products from Excel/CSV or add them manually.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{product.name}</span>
                          {product.vintage && (
                            <span className="text-xs text-gray-500">{product.vintage}</span>
                          )}
                          {product.description && (
                            <span className="text-xs text-gray-600 mt-1 line-clamp-2">{product.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {product.supplier ? (
                          <Badge variant="secondary" className="text-xs">
                            {product.supplier}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">No supplier</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-burgundy-600">
                          R{product.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                          {product.region && <span>Region: {product.region}</span>}
                          {product.varietal && <span>Varietal: {product.varietal}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleEdit(product)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {deleteConfirm === product.id ? (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleDelete(product.id)}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                              >
                                Confirm
                              </Button>
                              <Button
                                onClick={() => setDeleteConfirm(null)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-1"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setDeleteConfirm(product.id)}
                              className="bg-red-100 hover:bg-red-200 text-red-700 p-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {products.length > 0 && filteredProducts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Search className="mx-auto h-8 w-8 mb-2" />
              <p>No products match your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
