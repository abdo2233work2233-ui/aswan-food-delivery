import React, { useState, useEffect } from 'react';
import { FiTruck, FiClock, FiCheckCircle, FiMapPin, FiPhone, FiCompass } from 'react-icons/fi';
import { deliveryDriverService } from '../../services/dashboardService';

interface Delivery {
  id: string;
  customer: string;
  restaurant: string;
  address: string;
  distance: string;
  estimatedTime: string;
  payment: number;
  status: string;
  items: string[];
  total: number;
  phone: string;
}

interface DeliveryManagementProps {
  driverId: string;
}

const DeliveryManagement: React.FC<DeliveryManagementProps> = ({ driverId }) => {
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [currentDelivery, setCurrentDelivery] = useState<Delivery | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    loadAvailableDeliveries();
  }, []);

  const loadAvailableDeliveries = async () => {
    setIsLoading(true);
    try {
      const deliveries = await deliveryDriverService.getAvailableDeliveries();
      setAvailableDeliveries(deliveries as Delivery[]);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptDelivery = async (deliveryId: string) => {
    try {
      await deliveryDriverService.acceptDelivery(deliveryId);
      const delivery = availableDeliveries.find(d => d.id === deliveryId);
      if (delivery) {
        setCurrentDelivery({ ...delivery, status: 'accepted' });
        setAvailableDeliveries(prev => prev.filter(d => d.id !== deliveryId));
      }
    } catch (error) {
      console.error('Failed to accept delivery:', error);
    }
  };

  const updateDeliveryStatus = async (deliveryId: string, status: string) => {
    try {
      await deliveryDriverService.updateDeliveryStatus(deliveryId, status);
      if (currentDelivery) {
        setCurrentDelivery({ ...currentDelivery, status });
        if (status === 'delivered') {
          setCurrentDelivery(null);
        }
      }
    } catch (error) {
      console.error('Failed to update delivery status:', error);
    }
  };

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_for_pickup': return 'text-blue-600 bg-blue-100';
      case 'accepted': return 'text-orange-600 bg-orange-100';
      case 'picked_up': return 'text-purple-600 bg-purple-100';
      case 'out_for_delivery': return 'text-indigo-600 bg-indigo-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      ready_for_pickup: 'Ready for Pickup',
      accepted: 'Accepted',
      picked_up: 'Picked Up',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered'
    };
    return statusMap[status] || status;
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'accepted': return 'picked_up';
      case 'picked_up': return 'out_for_delivery';
      case 'out_for_delivery': return 'delivered';
      default: return null;
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
            onClick={toggleOnlineStatus}
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Customer</p>
                  <p className="text-gray-900">{currentDelivery.customer}</p>
                  <div className="flex items-center mt-1">
                    <FiPhone className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-600">{currentDelivery.phone}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Address</p>
                  <p className="text-gray-900">{currentDelivery.address}</p>
                  <div className="flex items-center mt-1">
                    <FiMapPin className="h-4 w-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-600">{currentDelivery.distance}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Payment</p>
                  <p className="text-gray-900">{currentDelivery.payment} EGP</p>
                  <p className="text-sm text-gray-600">Est. Time: {currentDelivery.estimatedTime}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
                <div className="space-y-1">
                  {currentDelivery.items.map((item, index) => (
                    <div key={index} className="text-sm text-gray-600">• {item}</div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <FiCompass className="h-4 w-4" />
                  <span>Navigate</span>
                </button>
                {getNextStatus(currentDelivery.status) && (
                  <button
                    onClick={() => updateDeliveryStatus(currentDelivery.id, getNextStatus(currentDelivery.status)!)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <FiCheckCircle className="h-4 w-4" />
                    <span>
                      {getNextStatus(currentDelivery.status) === 'picked_up' ? 'Mark Picked Up' :
                       getNextStatus(currentDelivery.status) === 'out_for_delivery' ? 'Start Delivery' :
                       getNextStatus(currentDelivery.status) === 'delivered' ? 'Mark Delivered' : 'Update'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available Deliveries */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Available Deliveries</h3>
            <button
              onClick={loadAvailableDeliveries}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Refresh
            </button>
          </div>
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
              {availableDeliveries.length > 0 ? (
                availableDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
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
                        <button
                          onClick={() => acceptDelivery(delivery.id)}
                          disabled={!isOnline}
                          className="text-green-600 hover:text-green-900 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center"
                        >
                          <FiTruck className="h-4 w-4 mr-1" />
                          Accept
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    {isOnline ? 'No available deliveries at the moment' : 'Go online to see available deliveries'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeliveryManagement;
