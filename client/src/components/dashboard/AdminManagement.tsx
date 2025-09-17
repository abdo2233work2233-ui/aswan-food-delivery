import React, { useState, useEffect } from 'react';
import { 
  FiCheckCircle, FiXCircle, FiEye, FiUser, FiShoppingBag, FiTruck, FiTrendingUp,
  FiTrash2, FiPlus, FiMail, FiLock, FiSave, FiPhone, FiEdit3
} from 'react-icons/fi';
import { adminService } from '../../services/dashboardService';

interface PendingApproval {
  id: string;
  type: string;
  name: string;
  owner?: string;
  phone?: string;
  submittedAt: string;
  status: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

interface Restaurant {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  rating: number;
  deliveryTime: number;
  deliveryFee: number;
  isOpen: boolean;
  ownerId: string;
}

interface AdminManagementProps {
  adminId: string;
}

const AdminManagement: React.FC<AdminManagementProps> = ({ adminId }) => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'restaurants'>('approvals');
  const [isLoading, setIsLoading] = useState(true);
  const [creatingUser, setCreatingUser] = useState(false);
  const [creatingRestaurant, setCreatingRestaurant] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userEditForm, setUserEditForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'CUSTOMER',
    password: ''
  });

  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'CUSTOMER'
  });

  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    nameAr: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    openingTime: '09:00',
    closingTime: '23:00',
    image: '',
    coverImage: ''
  });
  const [editingRestaurant, setEditingRestaurant] = useState<any | null>(null);
  const [restaurantEditForm, setRestaurantEditForm] = useState({
    name: '',
    nameAr: '',
    address: '',
    phone: '',
    email: '',
    openingTime: '09:00',
    closingTime: '23:00',
    image: '',
    coverImage: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [approvals, usersData, restaurantsData] = await Promise.all([
        adminService.getPendingApprovals(),
        adminService.getUsers(),
        adminService.getRestaurants()
      ]);
      
      setPendingApprovals(approvals as PendingApproval[]);
      setUsers((usersData as any).users as User[]);
      setRestaurants((restaurantsData as any).restaurants as Restaurant[]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproval = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await adminService.approveRequest(requestId);
      } else {
        await adminService.rejectRequest(requestId, 'Not meeting requirements');
      }
      
      setPendingApprovals(prev => prev.filter(item => item.id !== requestId));
    } catch (error) {
      console.error(`Failed to ${action} request:`, error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return <FiShoppingBag className="h-5 w-5 text-green-600" />;
      case 'driver': return <FiTruck className="h-5 w-5 text-blue-600" />;
      default: return <FiUser className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'restaurant': return 'Restaurant';
      case 'driver': return 'Driver';
      default: return 'User';
    }
  };

  const norm = (r: string) => r?.toLowerCase();
  const getRoleText = (role: string) => {
    switch (role) {
      case 'CUSTOMER':
      case 'customer': return 'Customer';
      case 'RESTAURANT_OWNER':
      case 'restaurant_owner': return 'Restaurant Owner';
      case 'DELIVERY_DRIVER':
      case 'delivery_driver': return 'Delivery Driver';
      case 'ADMIN':
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (norm(role)) {
      case 'customer': return 'text-blue-600 bg-blue-100';
      case 'restaurant_owner': return 'text-green-600 bg-green-100';
      case 'delivery_driver': return 'text-purple-600 bg-purple-100';
      case 'admin': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const roleOptions = [
    { value: 'CUSTOMER', label: 'Customer' },
    { value: 'RESTAURANT_OWNER', label: 'Restaurant Owner' },
    { value: 'DELIVERY_DRIVER', label: 'Delivery Driver' },
    { value: 'ADMIN', label: 'Admin' },
  ];

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    try {
      const created: any = await adminService.createUser({
        email: userForm.email,
        password: userForm.password,
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        phone: userForm.phone,
        role: userForm.role as any,
      });
      setUsers(prev => [...prev, created]);
      setUserForm({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'CUSTOMER' });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await adminService.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    try {
      const updated: any = await adminService.setUserRole(userId, newRole as any);
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: updated.role } : u)));
    } catch (err) {
      console.error(err);
    }
  };

  const startEditUser = (u: User) => {
    setEditingUser(u);
    setUserEditForm({
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: (u as any).phone || '',
      role: (u as any).role || 'CUSTOMER',
      password: ''
    });
  };

  const submitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const updated: any = await adminService.updateUser(editingUser.id, {
        email: userEditForm.email,
        firstName: userEditForm.firstName,
        lastName: userEditForm.lastName,
        phone: userEditForm.phone,
        role: userEditForm.role as any,
        password: userEditForm.password || undefined,
      });
      setUsers(prev => prev.map(u => (u.id === editingUser.id ? { ...u, ...updated } : u)));
      setEditingUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingRestaurant(true);
    try {
      const payload: any = {
        name: restaurantForm.name,
        nameAr: restaurantForm.nameAr || restaurantForm.name,
        description: restaurantForm.description || '',
        descriptionAr: restaurantForm.description || '',
        image: restaurantForm.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop&crop=center',
        coverImage: restaurantForm.coverImage || restaurantForm.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=400&fit=crop&crop=center',
        address: restaurantForm.address || 'Address, City',
        latitude: 24.0889,
        longitude: 32.8998,
        phone: restaurantForm.phone || '+20123456789',
        email: restaurantForm.email || 'info@example.com',
        isActive: true,
        isOpen: true,
        deliveryTime: 30,
        deliveryFee: 15,
        minimumOrder: 50,
        rating: 4.5,
        openingTime: restaurantForm.openingTime,
        closingTime: restaurantForm.closingTime,
        cuisine: 'International',
        priceRange: '$$',
        categories: []
      };
      const created: any = await adminService.createRestaurant(payload);
      setRestaurants(prev => [created, ...prev]);
      setRestaurantForm({ name: '', nameAr: '', description: '', address: '', phone: '', email: '', openingTime: '09:00', closingTime: '23:00', image: '', coverImage: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingRestaurant(false);
    }
  };

  const handleDeleteRestaurant = async (restaurantId: string) => {
    try {
      await adminService.deleteRestaurant(restaurantId);
      setRestaurants(prev => prev.filter(r => r.id !== restaurantId));
    } catch (err) {
      console.error(err);
    }
  };

  const startEditRestaurant = (r: any) => {
    setEditingRestaurant(r);
    setRestaurantEditForm({
      name: r.name || '',
      nameAr: r.nameAr || '',
      address: r.address || '',
      phone: r.phone || '',
      email: r.email || '',
      openingTime: r.openingTime || '09:00',
      closingTime: r.closingTime || '23:00',
      image: r.image || '',
      coverImage: r.coverImage || ''
    });
  };

  const submitEditRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRestaurant) return;
    try {
      const updated: any = await adminService.updateRestaurant(editingRestaurant.id, {
        ...restaurantEditForm
      } as any);
      setRestaurants(prev => prev.map(r => (r.id === editingRestaurant.id ? { ...r, ...updated } : r)));
      setEditingRestaurant(null);
    } catch (err) {
      console.error(err);
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
    <div className="relative space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approvals'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiTrendingUp className="h-4 w-4" />
                <span>Pending Approvals ({pendingApprovals.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiUser className="h-4 w-4" />
                <span>Users ({users.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('restaurants')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'restaurants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FiShoppingBag className="h-4 w-4" />
                <span>Restaurants ({restaurants.length})</span>
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Pending Approvals Tab */}
          {activeTab === 'approvals' && (
            <div className="space-y-4">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((approval) => (
                  <div key={approval.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(approval.type)}
                        <div>
                          <h3 className="font-medium text-gray-900">{approval.name}</h3>
                          <p className="text-sm text-gray-600">
                            {getTypeText(approval.type)} • Submitted {new Date(approval.submittedAt).toLocaleDateString()}
                          </p>
                          {approval.owner && <p className="text-sm text-gray-600">Owner: {approval.owner}</p>}
                          {approval.phone && <p className="text-sm text-gray-600">Phone: {approval.phone}</p>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproval(approval.id, 'approve')}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                        >
                          <FiCheckCircle className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleApproval(approval.id, 'reject')}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                        >
                          <FiXCircle className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiCheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No pending approvals</p>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto space-y-6">
              {/* Create User */}
              <form onSubmit={handleCreateUser} className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center"><FiPlus className="h-4 w-4 mr-2 text-green-600"/>Create User</h4>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Email</label>
                    <div className="flex items-center border border-gray-300 rounded-md px-2">
                      <FiMail className="text-gray-400 mr-2"/>
                      <input type="email" required value={userForm.email} onChange={(e)=>setUserForm({...userForm,email:e.target.value})} className="w-full py-2 outline-none" placeholder="user@example.com"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Password</label>
                    <div className="flex items-center border border-gray-300 rounded-md px-2">
                      <FiLock className="text-gray-400 mr-2"/>
                      <input type="text" required value={userForm.password} onChange={(e)=>setUserForm({...userForm,password:e.target.value})} className="w-full py-2 outline-none" placeholder="password"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">First Name</label>
                    <input type="text" required value={userForm.firstName} onChange={(e)=>setUserForm({...userForm,firstName:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Last Name</label>
                    <input type="text" required value={userForm.lastName} onChange={(e)=>setUserForm({...userForm,lastName:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Phone</label>
                    <div className="flex items-center border border-gray-300 rounded-md px-2">
                      <FiPhone className="text-gray-400 mr-2"/>
                      <input type="text" value={userForm.phone} onChange={(e)=>setUserForm({...userForm,phone:e.target.value})} className="w-full py-2 outline-none" placeholder="+20123456789"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Role</label>
                    <select required value={userForm.role} onChange={(e)=>setUserForm({...userForm,role:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button type="submit" disabled={creatingUser} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center">
                    <FiSave className="h-4 w-4 mr-2"/>Create
                  </button>
                </div>
              </form>

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isVerified ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                        }`}>
                          {user.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select value={user.role} onChange={(e)=>handleChangeUserRole(user.id, e.target.value)} className="px-2 py-1 border border-gray-300 rounded-md text-sm">
                          {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button onClick={()=>startEditUser(user)} className="text-blue-600 hover:text-blue-900 inline-flex items-center"><FiSave className="h-4 w-4 mr-1"/>Edit</button>
                        <button onClick={()=>handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900 inline-flex items-center"><FiTrash2 className="h-4 w-4 mr-1"/>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Restaurants Tab */}
          {activeTab === 'restaurants' && (
            <div className="overflow-x-auto space-y-6">
              {/* Create Restaurant */}
              <form onSubmit={handleCreateRestaurant} className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center"><FiPlus className="h-4 w-4 mr-2 text-green-600"/>Create Restaurant</h4>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Name</label>
                    <input required value={restaurantForm.name} onChange={(e)=>setRestaurantForm({...restaurantForm,name:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Name (Ar)</label>
                    <input value={restaurantForm.nameAr} onChange={(e)=>setRestaurantForm({...restaurantForm,nameAr:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Address</label>
                    <input required value={restaurantForm.address} onChange={(e)=>setRestaurantForm({...restaurantForm,address:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Phone</label>
                    <input value={restaurantForm.phone} onChange={(e)=>setRestaurantForm({...restaurantForm,phone:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Email</label>
                    <input type="email" value={restaurantForm.email} onChange={(e)=>setRestaurantForm({...restaurantForm,email:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Open</label>
                    <input value={restaurantForm.openingTime} onChange={(e)=>setRestaurantForm({...restaurantForm,openingTime:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="09:00"/>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Close</label>
                    <input value={restaurantForm.closingTime} onChange={(e)=>setRestaurantForm({...restaurantForm,closingTime:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="23:00"/>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Image URL</label>
                    <input value={restaurantForm.image} onChange={(e)=>setRestaurantForm({...restaurantForm,image:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Cover Image URL</label>
                    <input value={restaurantForm.coverImage} onChange={(e)=>setRestaurantForm({...restaurantForm,coverImage:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button type="submit" disabled={creatingRestaurant} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center">
                    <FiSave className="h-4 w-4 mr-2"/>Create
                  </button>
                </div>
              </form>

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {restaurants.map((restaurant) => (
                    <tr key={restaurant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                          <div className="text-sm text-gray-500">{restaurant.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="text-yellow-400">★</span>
                          <span className="ml-1">{restaurant.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {restaurant.deliveryTime} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          restaurant.isOpen ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                        }`}>
                          {restaurant.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button onClick={()=>startEditRestaurant(restaurant)} className="text-blue-600 hover:text-blue-900 inline-flex items-center"><FiEdit3 className="h-4 w-4 mr-1"/>Edit</button>
                        <button onClick={()=>handleDeleteRestaurant(restaurant.id)} className="text-red-600 hover:text-red-900 inline-flex items-center"><FiTrash2 className="h-4 w-4 mr-1"/>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">Edit User</h4>
              <button onClick={()=>setEditingUser(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={submitEditUser} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Email</label>
                  <input type="email" required value={userEditForm.email} onChange={(e)=>setUserEditForm({...userEditForm,email:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Password (leave blank to keep)</label>
                  <input type="text" value={userEditForm.password} onChange={(e)=>setUserEditForm({...userEditForm,password:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">First Name</label>
                  <input required value={userEditForm.firstName} onChange={(e)=>setUserEditForm({...userEditForm,firstName:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Last Name</label>
                  <input required value={userEditForm.lastName} onChange={(e)=>setUserEditForm({...userEditForm,lastName:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Phone</label>
                  <input value={userEditForm.phone} onChange={(e)=>setUserEditForm({...userEditForm,phone:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Role</label>
                  <select required value={userEditForm.role} onChange={(e)=>setUserEditForm({...userEditForm,role:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={()=>setEditingUser(null)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Restaurant Modal */}
      {editingRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold">Edit Restaurant</h4>
              <button onClick={()=>setEditingRestaurant(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={submitEditRestaurant} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Name</label>
                  <input required value={restaurantEditForm.name} onChange={(e)=>setRestaurantEditForm({...restaurantEditForm,name:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Name (Ar)</label>
                  <input value={restaurantEditForm.nameAr} onChange={(e)=>setRestaurantEditForm({...restaurantEditForm,nameAr:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Address</label>
                  <input required value={restaurantEditForm.address} onChange={(e)=>setRestaurantEditForm({...restaurantEditForm,address:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Phone</label>
                  <input value={restaurantEditForm.phone} onChange={(e)=>setRestaurantEditForm({...restaurantEditForm,phone:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Email</label>
                  <input type="email" value={restaurantEditForm.email} onChange={(e)=>setRestaurantEditForm({...restaurantEditForm,email:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Open</label>
                  <input value={restaurantEditForm.openingTime} onChange={(e)=>setRestaurantEditForm({...restaurantEditForm,openingTime:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Close</label>
                  <input value={restaurantEditForm.closingTime} onChange={(e)=>setRestaurantEditForm({...restaurantEditForm,closingTime:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Image URL</label>
                    <input value={restaurantEditForm.image} onChange={(e)=>setRestaurantEditForm({...restaurantEditForm,image:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Cover Image URL</label>
                    <input value={restaurantEditForm.coverImage} onChange={(e)=>setRestaurantEditForm({...restaurantEditForm,coverImage:e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={()=>setEditingRestaurant(null)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
