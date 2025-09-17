import React, { useState, useEffect } from 'react';
import { FiEdit3, FiTrash2, FiToggleLeft, FiToggleRight, FiX } from 'react-icons/fi';
import { restaurantOwnerService } from '../../services/dashboardService';
import { MenuItem, Category } from '../../types';

interface MenuManagementProps {
  restaurantId: string;
  refreshKey: number;
}

const MenuManagement: React.FC<MenuManagementProps> = ({ restaurantId, refreshKey }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<null | MenuItem>(null);
  const [editData, setEditData] = useState<any>({});
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadMenuItems();
    loadCategories();
  }, [restaurantId, refreshKey]);

  const loadMenuItems = async () => {
    setIsLoading(true);
    try {
      const items = await restaurantOwnerService.getMenuItems(restaurantId);
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await restaurantOwnerService.getRestaurantCategories(restaurantId);
      setCategories(cats);
    } catch (error) {
      setCategories([]);
    }
  };

  const getCategoryName = (item: MenuItem): string => {
    const catProp: any = (item as any).category;
    if (catProp && typeof catProp === 'object') {
      return catProp.name || catProp.id || '';
    }
    if (typeof catProp === 'string') {
      return catProp;
    }
    const found = categories.find(c => c.id === item.categoryId);
    return found?.name || item.categoryId || '';
  };

  const toggleAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      await restaurantOwnerService.updateMenuItem(itemId, { isAvailable: !currentStatus });
      setMenuItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, isAvailable: !currentStatus } : item
        )
      );
    } catch (error) {
      console.error('Failed to update item availability:', error);
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await restaurantOwnerService.deleteMenuItem(itemId);
        setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId));
      } catch (error) {
        console.error('Failed to delete menu item:', error);
      }
    }
  };

  const startEdit = (item: MenuItem) => {
    setIsEditing(item);
    setEditData({
      name: item.name,
      nameAr: item.nameAr,
      price: item.price,
      calories: item.calories || 0,
      preparationTime: item.preparationTime,
      image: item.image || '',
      ingredients: item.ingredients || '',
    });
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    try {
      const updated = await restaurantOwnerService.updateMenuItem(isEditing.id, {
        name: editData.name,
        nameAr: editData.nameAr,
        price: Number(editData.price),
        calories: Number(editData.calories) || undefined,
        preparationTime: Number(editData.preparationTime) || isEditing.preparationTime,
        image: editData.image,
        ingredients: editData.ingredients,
      });
      setMenuItems(prev => prev.map(mi => (mi.id === updated.id ? updated : mi)));
      setIsEditing(null);
    } catch (error) {
      // noop
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {menuItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <img className="h-10 w-10 rounded-full object-cover" src={item.image} alt={item.name} />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.description?.substring(0, 30)}...</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCategoryName(item)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.price} EGP</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-4">
                    <button onClick={() => toggleAvailability(item.id, item.isAvailable)} className="text-gray-400 hover:text-gray-600">
                      {item.isAvailable ? <FiToggleRight className="h-5 w-5 text-green-500" /> : <FiToggleLeft className="h-5 w-5" />}
                    </button>
                    <button onClick={() => startEdit(item)} className="text-blue-600 hover:text-blue-900">
                      <FiEdit3 className="h-5 w-5" />
                    </button>
                    <button onClick={() => deleteMenuItem(item.id)} className="text-red-600 hover:text-red-900">
                      <FiTrash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    {isEditing && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg p-6 w-full max-w-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Edit Menu Item</h3>
            <button onClick={() => setIsEditing(null)} className="text-gray-500 hover:text-gray-700"><FiX className="h-5 w-5" /></button>
          </div>
          <form onSubmit={submitEdit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (Arabic)</label>
              <input value={editData.nameAr || ''} onChange={(e) => setEditData({ ...editData, nameAr: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input type="number" value={editData.price || 0} onChange={(e) => setEditData({ ...editData, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                <input type="number" value={editData.calories || 0} onChange={(e) => setEditData({ ...editData, calories: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prep Time (min)</label>
                <input type="number" value={editData.preparationTime || 0} onChange={(e) => setEditData({ ...editData, preparationTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input value={editData.image || ''} onChange={(e) => setEditData({ ...editData, image: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ingredients</label>
              <input value={editData.ingredients || ''} onChange={(e) => setEditData({ ...editData, ingredients: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button type="button" onClick={() => setIsEditing(null)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
};

export default MenuManagement;
