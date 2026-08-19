import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiShoppingBag, 
  FiLogOut, 
  FiCheck, 
  FiEdit, 
  FiClock, 
  FiPackage, 
  FiChevronRight,
  FiShield
} from 'react-icons/fi';

const Profile = () => {
  const navigate = useNavigate();

  // User Auth State
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'orders'
  const [toastMessage, setToastMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');

  // Orders State
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Redirect to login if user is not signed in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token && !userStr) {
      navigate('/login');
    }
  }, [navigate]);

  // Sync state if user changes in localStorage
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Fetch User's Orders from Backend
  useEffect(() => {
    if (!user?.email) return;

    const fetchMyOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch('http://localhost:5001/api/orders');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Filter orders matching user's email
            const myOrders = data.filter(
              (o) => o.customerInfo?.email?.toLowerCase() === user.email.toLowerCase()
            );
            setUserOrders(myOrders);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchMyOrders();
  }, [user]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('http://localhost:5001/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user?.email,
          fullName,
          phone
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, fullName, phone, name: fullName };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('authChange'));
        triggerToast('Profile updated successfully!');
        setIsEditing(false);
      } else {
        triggerToast('Failed to update profile.');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      triggerToast('Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans py-10 px-4 flex flex-col items-center">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#FA9132] text-white px-6 py-3 rounded-xl shadow-lg font-medium text-sm transition-all duration-300 flex items-center gap-2">
          <FiCheck className="text-lg" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-[1020px] flex flex-col gap-6">

        {/* User Header Profile Card */}
        <div className="bg-white rounded-[28px] p-6 md:p-8 border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FA9132] to-[#ff7300] text-white font-extrabold text-3xl flex items-center justify-center shadow-md shrink-0">
              {fullName ? fullName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-gray-900">{fullName || 'DoggoCare User'}</h1>
                <span className="bg-orange-100 text-[#FA9132] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  Member
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                <FiMail className="text-[#FA9132]" /> {email || 'No email provided'}
              </p>
              {phone && (
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <FiPhone className="text-gray-400" /> {phone}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs transition shadow-sm self-stretch md:self-auto justify-center"
          >
            <FiLogOut /> Sign Out
          </button>
        </div>

        {/* Tab Navigation & Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Sidebar Navigation */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-row lg:flex-col gap-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition text-left ${
                activeTab === 'details'
                  ? 'bg-[#FA9132] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiUser className="text-base" /> My Details
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition text-left ${
                activeTab === 'orders'
                  ? 'bg-[#FA9132] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FiShoppingBag className="text-base" /> My Orders ({userOrders.length})
            </button>
          </div>

          {/* Right Main Content Panel */}
          <div className="lg:col-span-3">
            
            {/* TAB 1: MY DETAILS */}
            {activeTab === 'details' && (
              <div className="bg-white rounded-[28px] p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col">
                <div className="flex items-center justify-between border-b border-gray-100 pb-5 mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">Personal Information</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Manage your personal account details</p>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-[#FA9132] font-bold px-4 py-2 rounded-xl text-xs transition border border-orange-200/50"
                    >
                      <FiEdit /> Edit Details
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-gray-400 hover:text-gray-600 font-semibold px-3 py-1"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your Full Name"
                        className={`w-full px-4 py-3 rounded-xl border text-xs text-gray-800 transition ${
                          isEditing
                            ? 'border-gray-300 bg-white focus:outline-none focus:border-[#FA9132]'
                            : 'border-gray-100 bg-gray-50/70 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Phone Number</label>
                      <input
                        type="text"
                        disabled={!isEditing}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 0712345678"
                        className={`w-full px-4 py-3 rounded-xl border text-xs text-gray-800 transition ${
                          isEditing
                            ? 'border-gray-300 bg-white focus:outline-none focus:border-[#FA9132]'
                            : 'border-gray-100 bg-gray-50/70 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={email}
                      className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/70 text-xs text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Email address is linked to your account identity and cannot be changed.</p>
                  </div>

                  {isEditing && (
                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#FA9132] hover:bg-[#e07f28] disabled:bg-gray-300 text-white font-bold px-7 py-3 rounded-xl text-xs transition shadow-md flex items-center gap-2"
                      >
                        {saving ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* TAB 2: MY ORDERS */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-[28px] p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col">
                <div className="border-b border-gray-100 pb-5 mb-6">
                  <h2 className="text-xl font-extrabold text-gray-900">Order History</h2>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Track your healthcare products orders</p>
                </div>

                {loadingOrders ? (
                  <div className="text-center py-16 text-xs text-gray-400">Loading order history...</div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-16 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-orange-50 text-[#FA9132] flex items-center justify-center text-xl mb-3">
                      <FiPackage />
                    </div>
                    <h3 className="font-bold text-gray-800 text-base mb-1">No orders found</h3>
                    <p className="text-xs text-gray-400 mb-5">You haven't placed any orders with DoggoCare yet.</p>
                    <Link
                      to="/store"
                      className="bg-[#FA9132] hover:bg-[#e07f28] text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-sm"
                    >
                      Browse Products
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order, idx) => {
                      const orderDate = order.createdAt && !isNaN(new Date(order.createdAt).getTime())
                        ? new Date(order.createdAt).toLocaleDateString()
                        : 'N/A';
                      
                      const statusColor = order.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : order.status === 'Cancelled'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-amber-50 text-amber-600 border-amber-200';

                      return (
                        <div
                          key={order._id || idx}
                          className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-200/60 pb-3">
                            <div>
                              <span className="text-xs font-extrabold text-gray-900 mr-2">
                                Order #{order.orderId || `ORD_${String(idx + 1).padStart(3, '0')}`}
                              </span>
                              <span className="text-[11px] text-gray-400 font-medium">
                                Date: {orderDate}
                              </span>
                            </div>
                            <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${statusColor}`}>
                              {order.status || 'Pending'}
                            </span>
                          </div>

                          {/* Items List */}
                          <div className="space-y-2">
                            {order.items && order.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center justify-between text-xs text-gray-700 font-medium">
                                <span>{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
                                <span className="font-bold">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-200/60 pt-3 text-xs">
                            <span className="text-gray-500 font-semibold">Payment: <span className="uppercase font-bold text-gray-800">{order.paymentMethod || 'COD'}</span></span>
                            <div className="text-right">
                              <span className="text-gray-400 font-medium mr-2">Total:</span>
                              <span className="font-extrabold text-base text-[#FA9132]">Rs. {order.total ? order.total.toLocaleString() : '0'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
