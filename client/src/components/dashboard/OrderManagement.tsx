import React, { useState, useEffect } from 'react';
import { FiClock, FiCheckCircle, FiTruck, FiEye, FiEdit3, FiX } from 'react-icons/fi';
import { restaurantOwnerService } from '../../services/dashboardService';

interface Order {
  id: string;
  customer: string;
  items: string[];
  total: number;
  status: string;
  time: string;
  phone: string;
  address: string;
}

interface OrderManagementProps {
  restaurantId: string;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ restaurantId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [restaurantId]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      // Mock orders data
      const mockOrders: Order[] = [
        {
          id: '1',
          customer: 'Ahmed Ali',
          items: ['Margherita Pizza', 'Chicken Burger'],
          total: 80,
          status: 'pending',
          time: '10 min ago',
          phone: '+20123456789',
          address: '123 Main St, Downtown'
        },
        {
          id: '2',
          customer: 'Sara Mohamed',
          items: ['Chicken Burger', 'Fries'],
          total: 65,
          status: 'preparing',
          time: '15 min ago',
          phone: '+20123456790',
          address: '456 Oak Ave, Uptown'
        },
        {
          id: '3',
          customer: 'Omar Hassan',
          items: ['Margherita Pizza', 'Salad'],
          total: 70,
          status: 'out_for_delivery',
          time: '20 min ago',
          phone: '+20123456791',
          address: '789 Pine St, Midtown'
        },
        {
          id: '4',
          customer: 'Fatma Ibrahim',
          items: ['Chicken Burger'],
          total: 35,
          status: 'delivered',
          time: '25 min ago',
          phone: '+20123456792',
          address: '321 Elm St, Uptown'
        }
      ];
      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

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

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'preparing';
      case 'preparing': return 'out_for_delivery';
      case 'out_for_delivery': return 'delivered';
      default: return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <FiClock className="h-4 w-4" />;
      case 'preparing': return <FiEdit3 className="h-4 w-4" />;
      case 'out_for_delivery': return <FiTruck className="h-4 w-4" />;
      case 'delivered': return <FiCheckCircle className="h-4 w-4" />;
      default: return <FiClock className="h-4 w-4" />;
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
      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Order Management</h3>
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
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.items.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.total} EGP
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{getStatusText(order.status)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <FiEye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      {getNextStatus(order.status) && (
                        <button
                          onClick={() => updateOrderStatus(order.id, getNextStatus(order.status)!)}
                          disabled={isUpdating}
                          className="text-green-600 hover:text-green-900 flex items-center disabled:opacity-50"
                        >
                          <FiCheckCircle className="h-4 w-4 mr-1" />
                          {getNextStatus(order.status) === 'preparing' ? 'Start Prep' :
                           getNextStatus(order.status) === 'out_for_delivery' ? 'Ready' :
                           getNextStatus(order.status) === 'delivered' ? 'Complete' : 'Update'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Order #{selectedOrder.id} Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900">Customer Information</h3>
                  <p className="text-sm text-gray-600">Name: {selectedOrder.customer}</p>
                  <p className="text-sm text-gray-600">Phone: {selectedOrder.phone}</p>
                  <p className="text-sm text-gray-600">Address: {selectedOrder.address}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Order Information</h3>
                  <p className="text-sm text-gray-600">Total: {selectedOrder.total} EGP</p>
                  <p className="text-sm text-gray-600">Time: {selectedOrder.time}</p>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusIcon(selectedOrder.status)}
                    <span className="ml-1">{getStatusText(selectedOrder.status)}</span>
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {getNextStatus(selectedOrder.status) && (
                <div className="pt-4 border-t">
                  <button
                    onClick={() => {
                      updateOrderStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!);
                      setSelectedOrder(null);
                    }}
                    disabled={isUpdating}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isUpdating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="h-4 w-4" />
                        <span>
                          {getNextStatus(selectedOrder.status) === 'preparing' ? 'Start Preparation' :
                           getNextStatus(selectedOrder.status) === 'out_for_delivery' ? 'Mark as Ready' :
                           getNextStatus(selectedOrder.status) === 'delivered' ? 'Mark as Delivered' : 'Update Status'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
