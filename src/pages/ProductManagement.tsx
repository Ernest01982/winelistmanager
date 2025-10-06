import React, { useState } from 'react';
import { Wine } from '../types/wine';
import { Trash2, Plus, Package, Search, CreditCard as Edit2, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';

interface ProductManagementProps {
  wines: Wine[];
  onAddWine: (wine: Omit<Wine, 'id' | 'selected'>) => void;
  onDeleteWine: (wineId: string) => void;
  onUpdateWine: (wineId: string, wine: Partial<Wine>) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  wines,
  onAddWine,
  onDeleteWine,
  onUpdateWine
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingWine, setEditingWine] = useState<Wine | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Red Wine',
    vintage: '',
    price: '',
    region: '',
    varietal: '',
    supplier: ''
  });

  const filteredWines = wines.filter(wine =>
    wine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    wine.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (wine.supplier && wine.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newWine = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      vintage: formData.vintage || undefined,
      price: parseFloat(formData.price),
      region: formData.region || undefined,
      varietal: formData.varietal || undefined,
      supplier: formData.supplier || undefined
    };

    if (editingWine) {
      onUpdateWine(editingWine.id, newWine);
      setEditingWine(null);
    } else {
      onAddWine(newWine);
    }

    setFormData({
      name: '',
      description: '',
      category: 'Red Wine',
      vintage: '',
      price: '',
      region: '',
      varietal: '',
      supplier: ''
    });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (wine: Wine) => {
    setFormData({
      name: wine.name,
      description: wine.description,
      category: wine.category,
      vintage: wine.vintage || '',
      price: wine.price.toString(),
      region: wine.region || '',
      varietal: wine.varietal || '',
      supplier: wine.supplier || ''
    });
    setEditingWine(wine);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (wineId: string) => {
    onDeleteWine(wineId);
    setDeleteConfirm(null);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingWine(null);
    setFormData({
      name: '',
      description: '',
      category: 'Red Wine',
      vintage: '',
      price: '',
      region: '',
      varietal: '',
      supplier: ''
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
                  Manage your wine inventory ({wines.length} products)
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
                    <DialogTitle>{editingWine ? 'Edit Product' : 'Add New Product'}</DialogTitle>
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

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Supplier
                        </label>
                        <input
                          type="text"
                          value={formData.supplier}
                          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-burgundy-500"
                        />
                      </div>
                    </div>

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
                        {editingWine ? 'Update Product' : 'Add Product'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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

          {wines.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No products yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first product or uploading a file</p>
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
                  {filteredWines.map((wine) => (
                    <tr key={wine.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{wine.name}</span>
                          {wine.vintage && (
                            <span className="text-xs text-gray-500">{wine.vintage}</span>
                          )}
                          {wine.description && (
                            <span className="text-xs text-gray-600 mt-1 line-clamp-2">{wine.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="text-xs">
                          {wine.category}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-burgundy-600">
                          R{wine.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 text-xs text-gray-600">
                          {wine.region && <span>Region: {wine.region}</span>}
                          {wine.varietal && <span>Varietal: {wine.varietal}</span>}
                          {wine.supplier && <span>Supplier: {wine.supplier}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleEdit(wine)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          {deleteConfirm === wine.id ? (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => handleDelete(wine.id)}
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
                              onClick={() => setDeleteConfirm(wine.id)}
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

          {wines.length > 0 && filteredWines.length === 0 && (
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
