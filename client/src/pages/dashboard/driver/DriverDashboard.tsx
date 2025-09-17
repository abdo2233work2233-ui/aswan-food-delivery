import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../../store';
import { selectUser } from '../../../store/slices/authSlice';
import { 
  FiTruck, 
  FiClock, 
  FiCheckCircle, 
  FiMapPin,
  FiDollarSign,
  FiCompass,
  FiSettings,
  FiLogOut,
  FiEye,
} from 'react-icons/fi';
import DeliveryManagement from '../../../components/dashboard/DeliveryManagement';

const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [isArabic] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'deliveries' | 'earnings'>('overview');
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({
    totalDeliveries: 89,
    todayDeliveries: 6,
    pendingDeliveries: 2,
    totalEarnings: 2340,
    averageRating: 4.8,
    completedDeliveries: 87
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
  };

  const availableDeliveries = [
    { 
      id: '1', 
      customer: 'Ahmed Ali', 
      restaurant: 'Pizza Palace', 
      address: '123 Main St, Downtown',
      distance: '2.5 km',
      estimatedTime: '15 min',
      payment: 25,
      status: 'ready_for_pickup'
    },
    { 
      id: '2', 
      customer: 'Sara Mohamed', 
      restaurant: 'Burger King', 
      address: '456 Oak Ave, Uptown',
      distance: '3.2 km',
      estimatedTime: '20 min',
      payment: 30,
      status: 'ready_for_pickup'
    },
  ];

  const currentDelivery = {
    id: '3',
    customer: 'Omar Hassan',
    restaurant: 'KFC',
    address: '789 Pine St, Midtown',
    phone: '+20123456789',
    status: 'picked_up',
    estimatedTime: '10 min'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_for_pickup': return 'text-blue-600 bg-blue-100';
      case 'picked_up': return 'text-orange-600 bg-orange-100';
      case 'out_for_delivery': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      ready_for_pickup: 'Ready for Pickup',
      picked_up: 'Picked Up',
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
                {isArabic ? 'لوحة تحكم سائق التوصيل' : 'Delivery Driver Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-700">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <button
                onClick={toggleOnlineStatus}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isOnline 
                    ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {isOnline ? 'Go Offline' : 'Go Online'}
              </button>
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
                <FiTruck className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Deliveries</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiClock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today Deliveries</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCompass className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Deliveries</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiDollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalEarnings} EGP</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCheckCircle className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiCompass className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rating</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.averageRating}</p>
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
                onClick={() => setActiveTab('deliveries')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'deliveries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Deliveries
              </button>
              <button
                onClick={() => setActiveTab('earnings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'earnings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Earnings
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Online Status */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-lg font-medium">
                        {isOnline ? 'Online - Ready for deliveries' : 'Offline'}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsOnline(!isOnline)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isOnline 
                          ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {isOnline ? 'Go Offline' : 'Go Online'}
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button 
                      onClick={() => setActiveTab('deliveries')}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiTruck className="h-6 w-6 text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Available Deliveries</p>
                        <p className="text-sm text-gray-500">View new delivery jobs</p>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveTab('earnings')}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiDollarSign className="h-6 w-6 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">My Earnings</p>
                        <p className="text-sm text-gray-500">Check your payments</p>
                      </div>
                    </button>

                    <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <FiCompass className="h-6 w-6 text-purple-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Navigation</p>
                        <p className="text-sm text-gray-500">Open map</p>
                      </div>
                    </button>

                    <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <FiSettings className="h-6 w-6 text-gray-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Settings</p>
                        <p className="text-sm text-gray-500">Manage your profile</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Current Delivery */}
                {currentDelivery && (
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Current Delivery</h3>
                    </div>
                    <div className="p-6">
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900">Order #{currentDelivery.id}</h4>
                            <p className="text-sm text-gray-600">{currentDelivery.restaurant}</p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(currentDelivery.status)}`}>
                            {getStatusText(currentDelivery.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Customer</p>
                            <p className="text-gray-900">{currentDelivery.customer}</p>
                            <p className="text-sm text-gray-600">{currentDelivery.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Address</p>
                            <p className="text-gray-900">{currentDelivery.address}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Estimated Time</p>
                            <p className="text-gray-900">{currentDelivery.estimatedTime}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-3">
                          <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Navigate
                          </button>
                          <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                            Mark Delivered
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Deliveries Tab */}
            {activeTab === 'deliveries' && (
              <DeliveryManagement driverId="1" />
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Earnings</h3>
                <div className="text-center py-8 text-gray-500">
                  <FiDollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Earnings dashboard coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Available Deliveries */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Available Deliveries</h3>
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
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Distance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availableDeliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{delivery.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {delivery.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {delivery.restaurant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {delivery.distance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {delivery.payment} EGP
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          View Details
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          Accept
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
    </div>
  );
};

export default DriverDashboard;