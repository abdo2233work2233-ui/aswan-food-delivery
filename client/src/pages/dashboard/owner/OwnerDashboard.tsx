import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../store';
import { selectUser } from '../../../store/slices/authSlice';
import { 
  FiShoppingBag, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiDollarSign,
  FiTrendingUp,
  FiUser,
  FiLogOut,
  FiPlus,
  FiEdit3,
  FiEye
} from 'react-icons/fi';
import AddMenuItemModal from '../../../components/dashboard/AddMenuItemModal';
import OrderManagement from '../../../components/dashboard/OrderManagement';
import { restaurantOwnerService } from '../../../services/dashboardService';
import MenuManagement from '../../../components/dashboard/MenuManagement';

const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [isArabic] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'menu' | 'analytics'>('overview');
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 156,
    pendingOrders: 12,
    completedOrders: 134,
    totalRevenue: 15680,
    todayOrders: 8,
    todayRevenue: 450
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const all = await restaurantOwnerService.getAllRestaurants();
        setRestaurants(all as any);
        if (!selectedRestaurantId && all.length > 0) {
          setSelectedRestaurantId(all[0].id);
        }
      } catch (e) {
        // noop
      }
    };
    loadRestaurants();
  }, []);

  // Listen to realtime updates from owner service
  useEffect(() => {
    const onMenuUpdated = (e: any) => {
      if (!selectedRestaurantId || e?.detail?.restaurantId === selectedRestaurantId) {
        setRefreshKey(k => k + 1);
      }
    };
    window.addEventListener('menuUpdated', onMenuUpdated as any);
    return () => window.removeEventListener('menuUpdated', onMenuUpdated as any);
  }, [selectedRestaurantId]);

  const handleAddMenuItem = () => {
    setShowAddMenuItem(true);
  };

  const handleMenuItemAdded = (item: any) => {
    console.log('New menu item added:', item);
    setShowAddMenuItem(false);
    setRefreshKey(oldKey => oldKey + 1);
  };

  const recentOrders = [
    { id: '1', customer: 'Ahmed Ali', items: 3, total: 120, status: 'pending', time: '10 min ago' },
    { id: '2', customer: 'Sara Mohamed', items: 2, total: 85, status: 'preparing', time: '15 min ago' },
    { id: '3', customer: 'Omar Hassan', items: 4, total: 150, status: 'out_for_delivery', time: '20 min ago' },
    { id: '4', customer: 'Fatma Ibrahim', items: 1, total: 45, status: 'delivered', time: '25 min ago' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'preparing': return 'text-orange-600 bg-orange-100';
      case 'out_for_delivery': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      preparing: 'Preparing',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered'
    };
    return statusMap[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {isArabic ? 'لوحة تحكم صاحب المطعم' : 'Restaurant Owner Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {restaurants.length > 1 && (
                <select
                  value={selectedRestaurantId || ''}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                  className="block w-56 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}
              <div className="flex items-center space-x-2">
                <FiUser className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{user?.firstName} {user?.lastName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
              >
                <FiLogOut className="h-5 w-5" />
                <span className="text-sm">{isArabic ? 'تسجيل الخروج' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiClock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiDollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalRevenue} EGP</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiTrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today Orders</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiDollarSign className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayRevenue} EGP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'orders'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'menu'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Menu Management
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button 
                      onClick={handleAddMenuItem}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiPlus className="h-6 w-6 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Add Menu Item</p>
                        <p className="text-sm text-gray-500">Add new dishes</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveTab('menu')}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiEdit3 className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Manage Menu</p>
                        <p className="text-sm text-gray-500">Update existing items</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveTab('analytics')}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiTrendingUp className="h-6 w-6 text-purple-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">View Analytics</p>
                        <p className="text-sm text-gray-500">Sales reports</p>
                      </div>
                    </button>

                    {/* Restaurant Settings button removed as requested */}
                  </div>
                </div>

                {/* Recent Orders */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View All Orders
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Items
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentOrders.slice(0, 3).map((order) => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{order.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.customer}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.items} items
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {order.total} EGP
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.time}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && selectedRestaurantId && (
              <OrderManagement restaurantId={selectedRestaurantId} />
            )}

            {/* Menu Tab */}
            {activeTab === 'menu' && selectedRestaurantId && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Menu Management</h3>
                  <button
                    onClick={handleAddMenuItem}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <FiPlus className="h-4 w-4" />
                    <span>Add Menu Item</span>
                  </button>
                </div>
                <MenuManagement restaurantId={selectedRestaurantId} refreshKey={refreshKey} />
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                <div className="text-center py-8 text-gray-500">
                  <FiEye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Analytics dashboard coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.items} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.total} EGP
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          View
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Menu Item Modal */}
      {selectedRestaurantId && (
        <AddMenuItemModal
          isOpen={showAddMenuItem}
          onClose={() => setShowAddMenuItem(false)}
          onSuccess={handleMenuItemAdded}
          restaurantId={selectedRestaurantId}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;