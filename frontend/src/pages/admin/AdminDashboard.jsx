import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUsers, 
  FiPackage, 
  FiStar, 
  FiSearch, 
  FiPlus, 
  FiX, 
  FiLogOut,
  FiEdit,
  FiTrash2,
  FiEye,
  FiCheck,
  FiUserPlus,
  FiMessageSquare,
  FiSmile,
  FiSend
} from 'react-icons/fi';
import { FaCapsules } from 'react-icons/fa';

const PillIcon = ({ className = "text-4xl" }) => (
  <FaCapsules className={className} />
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Popups
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [viewingOrderDetails, setViewingOrderDetails] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Live Chat State for Admin
  const [conversations, setConversations] = useState([]);
  const [selectedChatEmail, setSelectedChatEmail] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [adminReplyInput, setAdminReplyInput] = useState('');
  const adminChatContainerRef = useRef(null);

  // Find active conversation object
  const selectedConversation = conversations.find(c => c._id === selectedChatEmail);

  // --- STATE DATA ---
  const [users, setUsers] = useState([
    { id: '001', name: 'John Silva', email: 'john@gmail.com', phone: '0712345678', status: 'Active' },
    { id: '002', name: 'Emily Perera', email: 'emily@gmail.com', phone: '0774561230', status: 'Blocked' },
    { id: '003', name: 'David Fernando', email: 'david@gmail.com', phone: '0761234567', status: 'Active' },
    { id: '004', name: 'Sarah Jay', email: 'sarah@gmail.com', phone: '0759632587', status: 'Active' }
  ]);

  const [inventory, setInventory] = useState([]);

  // Fetch inventory, orders, feedback and chat conversations from backend on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const formattedUsers = data.map((u, idx) => ({
              dbId: u._id,
              id: `USR_${String(idx + 1).padStart(3, '0')}`,
              name: u.fullName || u.username || 'User',
              email: u.email,
              phone: u.phone || 'N/A',
              status: u.status || 'Active'
            }));
            setUsers(formattedUsers);
          }
        }
      } catch (err) {
        console.error('Failed to fetch real users:', err);
      }
    };

    const fetchInventory = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/items');
        if (res.ok) {
          const data = await res.json();
          setInventory(data);
        }
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
      }
    };

    const fetchOrders = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/orders');
        if (res.ok) {
          const data = await res.json();
          const formattedOrders = data.map((o, idx) => ({
            id: o.orderId || `ORD_${String(idx).padStart(3, '0')}`,
            dbId: o._id,
            customerInfo: o.customerInfo,
            customer: `${o.customerInfo?.firstName || ''} ${o.customerInfo?.lastName || ''}`,
            items: o.items || [],
            product: o.items ? o.items.map(i => `${i.name} (x${i.quantity})`).join(', ') : '',
            qty: o.items ? o.items.reduce((acc, item) => acc + item.quantity, 0) : 0,
            subtotal: o.subtotal,
            deliveryFee: o.deliveryFee,
            discount: o.discount,
            totalNum: o.total,
            total: `Rs. ${o.total ? o.total.toLocaleString() : 0}`,
            payment: o.paymentMethod === 'cod' ? 'COD' : (o.paymentMethod || 'Paid'),
            status: o.status,
            createdAt: o.createdAt
          }));
          setOrders(formattedOrders);
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      }
    };

    const fetchFeedback = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/reviews');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const formatted = data.map((fb, idx) => ({
              id: `FB_${String(data.length - idx).padStart(3, '0')}`,
              _id: fb._id,
              customer: fb.customerName || 'Anonymous',
              product: fb.productName || 'General Item',
              rating: Math.max(1, Math.min(5, Number(fb.rating) || 5)),
              comment: fb.comment || '',
              date: fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : 'N/A'
            }));
            setFeedback(formatted);
          }
        }
      } catch (err) {
        console.error('Failed to fetch feedback from DB:', err);
      }
    };

    const fetchConversations = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/messages/conversations');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const validData = data.filter(c => c && typeof c._id === 'string' && c._id.trim() !== '');
            setConversations(validData);
            if (validData.length > 0) {
              setSelectedChatEmail(prev => (typeof prev === 'string' && prev) ? prev : validData[0]._id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      }
    };

    fetchUsers();
    fetchInventory();
    fetchOrders();
    fetchFeedback();
    fetchConversations();

    const interval = setInterval(fetchConversations, 3000);
    return () => clearInterval(interval);
  }, []);

  // Poll for messages when a customer chat is selected
  useEffect(() => {
    if (!selectedChatEmail || typeof selectedChatEmail !== 'string') return;

    const fetchUserMessages = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/messages?email=${encodeURIComponent(selectedChatEmail)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setChatMessages(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user messages:', err);
      }
    };

    fetchUserMessages();
    const interval = setInterval(fetchUserMessages, 2000);
    return () => clearInterval(interval);
  }, [selectedChatEmail]);

  useEffect(() => {
    if (adminChatContainerRef.current) {
      adminChatContainerRef.current.scrollTop = adminChatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleAdminSendReply = async (e) => {
    e.preventDefault();
    if (!adminReplyInput.trim() || !selectedChatEmail || typeof selectedChatEmail !== 'string') return;

    const msgText = adminReplyInput;
    setAdminReplyInput('');

    try {
      const res = await fetch('http://localhost:5001/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: selectedChatEmail,
          userName: selectedConversation?.userName || (selectedChatEmail.includes('@') ? selectedChatEmail.split('@')[0] : selectedChatEmail),
          sender: 'admin',
          message: msgText
        })
      });

      if (res.ok) {
        const savedMsg = await res.json();
        setChatMessages((prev) => Array.isArray(prev) ? [...prev, savedMsg] : [savedMsg]);
        triggerToast('Reply sent to customer!');
      } else {
        triggerToast('Failed to send reply.');
      }
    } catch (err) {
      console.error('Failed to send admin reply:', err);
      triggerToast('Error sending reply.');
    }
  };

  const handleAdminDeleteChat = async () => {
    if (!selectedChatEmail) return;
    if (!window.confirm(`Are you sure you want to delete all chat history for ${selectedChatEmail}?`)) return;

    try {
      const res = await fetch(`http://localhost:5001/api/messages?email=${encodeURIComponent(selectedChatEmail)}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        triggerToast('Chat history deleted successfully!');
        setChatMessages([]);
        setConversations(prev => prev.filter(c => c._id !== selectedChatEmail));
        setSelectedChatEmail('');
      } else {
        triggerToast('Failed to delete chat history.');
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      triggerToast('Error deleting chat history.');
    }
  };

  const handleToggleUserStatus = async (userObj) => {
    const newStatus = userObj.status === 'Active' ? 'Blocked' : 'Active';
    try {
      if (userObj.dbId) {
        const res = await fetch(`http://localhost:5001/api/admin/users/${userObj.dbId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
          setUsers(prev => prev.map(u => u.dbId === userObj.dbId ? { ...u, status: newStatus } : u));
          triggerToast(`User status updated to ${newStatus}`);
          return;
        }
      }
      setUsers(prev => prev.map(u => u.id === userObj.id ? { ...u, status: newStatus } : u));
      triggerToast(`User status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to toggle status:', err);
      triggerToast('Error updating user status');
    }
  };

  const handleDeleteUser = async (userObj) => {
    if (!window.confirm(`Are you sure you want to delete ${userObj.name}?`)) return;
    try {
      if (userObj.dbId) {
        await fetch(`http://localhost:5001/api/admin/users/${userObj.dbId}`, { method: 'DELETE' });
      }
      setUsers(prev => prev.filter(u => u.dbId ? u.dbId !== userObj.dbId : u.id !== userObj.id));
      triggerToast(`User ${userObj.name} deleted successfully!`);
    } catch (err) {
      console.error('Failed to delete user:', err);
      triggerToast('Error deleting user');
    }
  };

  const [orders, setOrders] = useState([]);
  const [feedback, setFeedback] = useState([]);

  // --- FORM STATES ---
  // Inventory Form State
  const [itemForm, setItemForm] = useState({ itemCode: '', name: '', category: '', price: '', stock: '', description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [additionalFiles, setAdditionalFiles] = useState([]);

  // Order Status Form State
  const [orderForm, setOrderForm] = useState({ orderId: '', dbId: '', customerName: '', status: '', notes: '' });

  // Feedback Details Form State
  const [feedbackForm, setFeedbackForm] = useState({ customerName: '', productName: '', rating: '', comment: '' });

  // Add User Modal State
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', phone: '', status: 'Active' });

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Handlers
  const handleSaveInventoryItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price) return;
    
    try {
      const formData = new FormData();
      if (itemForm.itemCode) {
        formData.append('itemCode', itemForm.itemCode);
      }
      formData.append('name', itemForm.name);
      formData.append('category', itemForm.category || 'General');
      formData.append('price', itemForm.price);
      formData.append('stock', parseInt(itemForm.stock) || 10);
      formData.append('description', itemForm.description);
      
      if (imageFile) {
        formData.append('image', imageFile);
      }

      additionalFiles.forEach((file) => {
        formData.append('additionalImages', file);
      });

      const res = await fetch('http://localhost:5001/api/items', {
        method: 'POST',
        body: formData // No Content-Type header, browser sets it for FormData
      });

      if (res.ok) {
        const savedItem = await res.json();
        setInventory([savedItem, ...inventory]); // Add to top of list
        setItemForm({ itemCode: '', name: '', category: '', price: '', stock: '', description: '' });
        setImageFile(null); // Reset file input
        setAdditionalFiles([]); // Reset additional files
        // Also reset the actual file input DOM elements
        const fileInput = document.getElementById('item-image-upload');
        if (fileInput) fileInput.value = "";
        const additionalInput = document.getElementById('item-additional-upload');
        if (additionalInput) additionalInput.value = "";
        triggerToast('Pet item saved successfully!');
      } else {
        triggerToast('Failed to save item.');
      }
    } catch (err) {
      console.error('Error saving item:', err);
      triggerToast('Server error while saving.');
    }
  };

  const handleUpdateOrderStatus = async (e) => {
    e.preventDefault();
    if (!orderForm.orderId) return;

    const targetOrder = orders.find(o => o.id === orderForm.orderId || o.dbId === orderForm.orderId);
    const targetId = targetOrder ? targetOrder.dbId : orderForm.orderId;
    
    try {
      const res = await fetch(`http://localhost:5001/api/orders/${targetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: orderForm.status })
      });

      if (res.ok) {
        const updatedOrder = await res.json();
        setOrders(orders.map(o => (o.id === orderForm.orderId || o.dbId === targetId) ? { ...o, status: updatedOrder.status } : o));
        triggerToast(`Order status updated successfully!`);
        setOrderForm({ orderId: '', dbId: '', customerName: '', status: '', notes: '' });
      } else {
        triggerToast('Failed to update order status.');
      }
    } catch (err) {
      console.error('Error updating order:', err);
      triggerToast('Server error while updating order.');
    }
  };

  const handleMarkFeedbackReviewed = (e) => {
    e.preventDefault();
    triggerToast('Feedback marked as reviewed!');
    setFeedbackForm({ customerName: '', productName: '', rating: '', comment: '' });
  };

  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;
    const u = {
      id: `00${users.length + 1}`,
      name: newUserForm.name,
      email: newUserForm.email,
      phone: newUserForm.phone || '0700000000',
      status: newUserForm.status
    };
    setUsers([...users, u]);
    setShowAddUserModal(false);
    setNewUserForm({ name: '', email: '', phone: '', status: 'Active' });
    triggerToast('New user added successfully!');
  };

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fa] font-sans antialiased text-gray-800 select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium animate-bounce">
          <FiCheck className="text-emerald-400 text-lg" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT SIDEBAR (Matching exact orange sidebar) */}
      <aside className="w-64 bg-[#ff7300] min-h-screen text-white flex flex-col p-6 shrink-0 shadow-lg select-none">
        <div className="mb-10 pl-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
            DoggoCare<br />Admin
          </h1>
        </div>

        {/* Navigation List */}
        <nav className="space-y-2 flex-1">
          {[
            { label: 'Dashboard' },
            { label: 'Manage Users' },
            { label: 'Manage Inventory' },
            { label: 'Manage Orders' },
            { label: 'User Feedback' },
            { label: 'Customer Live Chat' }
          ].map((item) => {
            const isActive = activeTab === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`w-full text-left px-4 py-3 rounded-xl text-base font-semibold transition duration-150 flex items-center justify-between ${
                  isActive
                    ? 'bg-white/25 text-white shadow-inner'
                    : 'text-white/90 hover:bg-white/10'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full text-left px-4 py-3 rounded-xl text-base font-semibold text-white/90 hover:bg-white/10 transition duration-150 flex items-center gap-2 mt-6"
          >
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* TOP NAVBAR / HEADER */}
        <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {activeTab === 'Dashboard' ? 'Admin Dashboard' : activeTab}
            </h1>
            {activeTab === 'Dashboard' && (
              <p className="text-xs text-gray-500 font-medium mt-0.5">Welcome Administrator</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#ff7300] focus:ring-1 focus:ring-[#ff7300] transition bg-white"
              />
            </div>

            {activeTab === 'Manage Inventory' && (
              <button
                onClick={() => {
                  const formEl = document.getElementById('inventory-form');
                  if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[#ff7300] hover:bg-[#e56700] text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <FiPlus className="text-sm stroke-[3]" /> Add Item
              </button>
            )}

            {activeTab === 'Manage Users' && (
              <button
                onClick={() => setShowAddUserModal(true)}
                className="bg-[#ff7300] hover:bg-[#e56700] text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 shadow-sm transition"
              >
                <FiUserPlus className="text-sm stroke-[2.5]" /> Add User
              </button>
            )}
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="p-8 space-y-8 flex-1 overflow-y-auto max-w-7xl">
          
          {/* VIEW 1: DASHBOARD VIEW */}
          {activeTab === 'Dashboard' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="text-[#ff7300] mb-2"><FiUsers className="text-4xl" /></div>
                  <h3 className="text-sm font-bold text-gray-900">Total Users</h3>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">{users.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="text-[#ff7300] mb-2"><PillIcon className="text-4xl" /></div>
                  <h3 className="text-sm font-bold text-gray-900">Store Items</h3>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">{inventory.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="text-[#ff7300] mb-2"><FiPackage className="text-4xl" /></div>
                  <h3 className="text-sm font-bold text-gray-900">Total Orders</h3>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">{orders.length}</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="text-[#ff7300] mb-2"><FiStar className="text-4xl fill-[#ff7300]" /></div>
                  <h3 className="text-sm font-bold text-gray-900">User Reviews</h3>
                  <p className="text-2xl font-extrabold text-gray-900 mt-1">{feedback.length}</p>
                </div>
              </div>

              {/* Revenue & Recent Orders Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
                    <button
                      onClick={() => setActiveTab('Manage Orders')}
                      className="text-xs text-[#ff7300] font-bold hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#fff2eb]">
                          <th className="py-3.5 px-6 font-bold text-gray-900 text-xs uppercase">Order ID</th>
                          <th className="py-3.5 px-6 font-bold text-gray-900 text-xs uppercase">Customer</th>
                          <th className="py-3.5 px-6 font-bold text-gray-900 text-xs uppercase">Total</th>
                          <th className="py-3.5 px-6 font-bold text-gray-900 text-xs uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="py-6 text-center text-xs text-gray-400">
                              No orders placed yet.
                            </td>
                          </tr>
                        ) : (
                          orders.slice(0, 5).map((o, idx) => (
                            <tr key={o.dbId || idx} className="hover:bg-gray-50 transition">
                              <td className="py-3.5 px-6 text-xs text-gray-800 font-bold">{o.id}</td>
                              <td className="py-3.5 px-6 text-xs text-gray-800 font-medium">{o.customer || 'Customer'}</td>
                              <td className="py-3.5 px-6 text-xs text-[#ff7300] font-bold">{o.total}</td>
                              <td className="py-3.5 px-6 text-xs">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  o.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' :
                                  o.status === 'Cancelled' ? 'bg-rose-100 text-rose-500' :
                                  'bg-amber-100 text-amber-600'
                                }`}>
                                  {o.status || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 mb-4">Total Store Revenue</h2>
                    <div className="bg-orange-50/60 p-5 rounded-2xl border border-orange-100 mb-6">
                      <p className="text-xs text-gray-500 font-medium">Accumulated Sales</p>
                      <p className="text-3xl font-extrabold text-[#ff7300] mt-1">
                        Rs. {orders.reduce((sum, o) => sum + (Number(o.totalNum) || 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
                    <div className="space-y-2.5">
                      <button onClick={() => setActiveTab('Manage Inventory')} className="w-full bg-[#ff7300] hover:bg-[#e56700] text-white font-bold py-3 px-4 rounded-xl text-xs transition shadow-sm text-center">Add Item</button>
            
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* VIEW 2: MANAGE USERS (Matching Image 3) */}
          {activeTab === 'Manage Users' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#fff2eb]">
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">ID</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Name</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Email</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Phone</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Status</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition">
                          <td className="py-4 px-6 text-sm font-semibold text-gray-700">{u.id}</td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900">{u.name}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{u.email}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{u.phone}</td>
                          <td className="py-4 px-6 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              u.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg text-white transition ${
                                  u.status === 'Active' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                                }`}
                                title={u.status === 'Active' ? 'Block User' : 'Activate User'}
                              >
                                {u.status === 'Active' ? 'Block' : 'Activate'}
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u)}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
                                title="Delete User"
                              >
                                <FiTrash2 className="text-sm" />
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
          )}

          {/* VIEW 3: MANAGE INVENTORY (Matching Image 1) */}
          {activeTab === 'Manage Inventory' && (
            <div className="space-y-8">
              {/* Inventory Table */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#fff2eb]">
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Image</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Item Code</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Item Name</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Category</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Price</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Stock</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Status</th>
                        <th className="py-4 px-6 font-bold text-gray-900 text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {inventory.map((item, index) => (
                        <tr key={item._id || item.id || index} className="hover:bg-gray-50 transition">
                          <td className="py-4 px-6">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-md shadow-sm border border-gray-200" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                                <FiPackage />
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-sm font-bold text-[#ff7300]">{item.itemId || `ITM_${String(index).padStart(3, '0')}`}</td>
                          <td className="py-4 px-6 text-sm font-medium text-gray-900">{item.name}</td>
                          <td className="py-4 px-6 text-sm text-gray-600">{item.category}</td>
                          <td className="py-4 px-6 text-sm font-semibold text-gray-900">{item.price}</td>
                          <td className="py-4 px-6 text-sm text-gray-700">{item.stock}</td>
                          <td className="py-4 px-6 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              item.status === 'Available' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setItemForm({ name: item.name, category: item.category, price: item.price.toString().replace('$',''), stock: item.stock.toString(), description: item.description || '' });
                                  const formEl = document.getElementById('inventory-form');
                                  if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="bg-amber-400 hover:bg-amber-500 text-white p-2 rounded-lg transition"
                                title="Edit Item"
                              >
                                <FiEdit className="text-sm" />
                              </button>
                              <button 
                                onClick={() => {
                                  setInventory(inventory.filter(x => (x._id || x.id) !== (item._id || item.id)));
                                  triggerToast(`Item ${item.name} deleted.`);
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
                                title="Delete Item"
                              >
                                <FiTrash2 className="text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Add / Update Pet Item Form (Card matching Image 1 bottom) */}
              <div id="inventory-form" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-gray-900">Add / Update Pet Item</h2>
                
                <form onSubmit={handleSaveInventoryItem} className="space-y-4">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Pet Item Name"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ff7300]"
                    />
                    <select
                      value={itemForm.category}
                      onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-100/70 focus:outline-none focus:border-[#ff7300]"
                    >
                      <option value="">Category</option>
                      <option value="Skin Care">Skin Care</option>
                      <option value="Medicine">Medicine</option>
                      <option value="Supplements">Supplements</option>
                      <option value="Grooming">Grooming</option>
                    </select>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Price"
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ff7300]"
                    />
                    <input
                      type="number"
                      placeholder="Stock Quantity"
                      value={itemForm.stock}
                      onChange={(e) => setItemForm({ ...itemForm, stock: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ff7300]"
                    />
                  </div>

                  {/* Row 3 */}
                  <div>
                    <textarea
                      rows="4"
                      placeholder="Description"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ff7300] resize-none"
                    ></textarea>
                  </div>

                   {/* Row 4: File Inputs */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="flex flex-col">
                       <label className="text-xs text-gray-500 mb-1 font-semibold">Main Item Image</label>
                       <div className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 bg-white flex items-center">
                         <input 
                           id="item-image-upload"
                           type="file" 
                           accept="image/*"
                           onChange={(e) => setImageFile(e.target.files[0])}
                           className="text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer w-full" 
                         />
                       </div>
                     </div>
                     <div className="flex flex-col">
                       <label className="text-xs text-gray-500 mb-1 font-semibold">Additional Images (Up to 5)</label>
                       <div className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 bg-white flex items-center">
                         <input 
                           id="item-additional-upload"
                           type="file" 
                           multiple
                           accept="image/*"
                           onChange={(e) => setAdditionalFiles(Array.from(e.target.files))}
                           className="text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer w-full" 
                         />
                       </div>
                     </div>
                   </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="bg-[#ff7300] hover:bg-[#e66700] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition shadow-sm"
                    >
                      Save Item
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemForm({ name: '', category: '', price: '', stock: '', description: '' })}
                      className="bg-[#6b7280] hover:bg-[#4b5563] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition shadow-sm"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VIEW 4: MANAGE ORDERS (Matching Image 2) */}
          {activeTab === 'Manage Orders' && (
            <div className="space-y-8">
              {/* Orders Table */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#fff2eb]">
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Order ID</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Customer</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Product</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Qty</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Total</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Payment</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Status</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {orders.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50 transition">
                          <td className="py-4 px-5 text-sm font-semibold text-gray-800">{o.id}</td>
                          <td className="py-4 px-5 text-sm font-medium text-gray-900">{o.customer}</td>
                          <td className="py-4 px-5 text-sm text-gray-600">{o.product}</td>
                          <td className="py-4 px-5 text-sm text-gray-700">{o.qty}</td>
                          <td className="py-4 px-5 text-sm font-semibold text-gray-900">{o.total}</td>
                          <td className="py-4 px-5 text-sm text-gray-600">{o.payment}</td>
                          <td className="py-4 px-5 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              o.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                              o.status === 'Processing' ? 'bg-sky-100 text-sky-600' :
                              o.status === 'Delivered' ? 'bg-emerald-100 text-emerald-600' :
                              'bg-rose-100 text-rose-600'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-sm">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setViewingOrderDetails(o)}
                                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition"
                                title="View Order Details"
                              >
                                <FiEye className="text-sm" />
                              </button>
                              <button 
                                onClick={() => {
                                  setOrderForm({ orderId: o.id, customerName: o.customer, status: o.status, notes: '' });
                                  const formEl = document.getElementById('order-form');
                                  if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="bg-amber-400 hover:bg-amber-500 text-white p-2 rounded-lg transition"
                                title="Edit Status"
                              >
                                <FiEdit className="text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Update Order Status Form (Card matching Image 2 bottom) */}
              <div id="order-form" className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-lg font-bold text-gray-900">Update Order Status</h2>
                
                <form onSubmit={handleUpdateOrderStatus} className="space-y-4">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Order ID"
                      value={orderForm.orderId}
                      onChange={(e) => setOrderForm({ ...orderForm, orderId: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ff7300]"
                    />
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={orderForm.customerName}
                      onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ff7300]"
                    />
                  </div>

                  {/* Row 2 */}
                  <div>
                    <select
                      value={orderForm.status}
                      onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                      className="w-full md:w-1/2 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 bg-gray-100/70 focus:outline-none focus:border-[#ff7300]"
                    >
                      <option value="">Select Status</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Row 3 */}
                  <div>
                    <textarea
                      rows="4"
                      placeholder="Order Notes"
                      value={orderForm.notes}
                      onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ff7300] resize-none"
                    ></textarea>
                  </div>

                  {/* Row 4: File Input */}
                  <div className="w-full max-w-sm">
                    <div className="border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 bg-white flex items-center">
                      <input type="file" className="text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer" />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="bg-[#ff7300] hover:bg-[#e66700] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition shadow-sm"
                    >
                      Update Status
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderForm({ orderId: '', customerName: '', status: '', notes: '' })}
                      className="bg-[#6b7280] hover:bg-[#4b5563] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition shadow-sm"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* VIEW 5: USER FEEDBACK (Matching Image 4) */}
          {activeTab === 'User Feedback' && (
            <div className="space-y-8">
              {/* 3 Summary Cards at Top */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Feedback */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="text-[#ff7300] text-3xl mb-1"><FiMessageSquare /></div>
                  <p className="text-2xl font-extrabold text-gray-900">{feedback.length}</p>
                  <p className="text-xs text-gray-500 font-medium">Total Feedback</p>
                </div>

                {/* Average Rating */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="text-[#ff7300] text-3xl mb-1"><FiStar className="fill-[#ff7300]" /></div>
                  <p className="text-2xl font-extrabold text-gray-900">
                    {feedback.length > 0 ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1) : '0.0'}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">Average Rating</p>
                </div>

                {/* Positive Reviews */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                  <div className="text-[#ff7300] text-3xl mb-1"><FiSmile /></div>
                  <p className="text-2xl font-extrabold text-gray-900">{feedback.filter(f => f.rating >= 4).length}</p>
                  <p className="text-xs text-gray-500 font-medium">Positive Reviews</p>
                </div>
              </div>

              {/* Feedback Table */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#fff2eb]">
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">ID</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Customer</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Product</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Rating</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Feedback</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Date</th>
                        <th className="py-4 px-5 font-bold text-gray-900 text-xs uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {feedback.map((f) => (
                        <tr key={f.id} className="hover:bg-gray-50 transition">
                          <td className="py-4 px-5 text-sm font-semibold text-gray-800">{f.id}</td>
                          <td className="py-4 px-5 text-sm font-medium text-gray-900">{f.customer}</td>
                          <td className="py-4 px-5 text-sm text-gray-600">{f.product}</td>
                          <td className="py-4 px-5 text-sm text-amber-400 font-bold tracking-widest">
                            {'★'.repeat(Math.max(1, Math.min(5, Math.floor(Number(f.rating) || 5))))}{'☆'.repeat(5 - Math.max(1, Math.min(5, Math.floor(Number(f.rating) || 5))))}
                          </td>
                          <td className="py-4 px-5 text-xs text-gray-600 max-w-xs">{f.comment}</td>
                          <td className="py-4 px-5 text-xs text-gray-500 font-medium">{f.date}</td>
                          <td className="py-4 px-5 text-sm">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => {
                                  setFeedbackForm({ customerName: f.customer, productName: f.product, rating: `${f.rating} Stars`, comment: f.comment });
                                  const formEl = document.getElementById('feedback-form');
                                  if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition"
                                title="View Feedback"
                              >
                                <FiEye className="text-sm" />
                              </button>
                              <button 
                                onClick={async () => {
                                  if (f._id) {
                                    try {
                                      await fetch(`http://localhost:5001/api/reviews/${f._id}`, { method: 'DELETE' });
                                    } catch (err) {
                                      console.error('Failed to delete feedback from DB:', err);
                                    }
                                  }
                                  setFeedback(feedback.filter(x => x.id !== f.id));
                                  triggerToast('Feedback entry deleted.');
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition"
                                title="Delete Feedback"
                              >
                                <FiTrash2 className="text-sm" />
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
          )}

          {/* VIEW 6: CUSTOMER LIVE CHAT */}
          {activeTab === 'Customer Live Chat' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex h-[680px]">
              {/* Left Column: Customer Conversations List */}
              <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/50">
                <div className="p-4 border-b border-gray-100 bg-white">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center justify-between">
                    <span>Customer Messages</span>
                    <span className="bg-orange-100 text-[#ff7300] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {Array.isArray(conversations) ? conversations.length : 0}
                    </span>
                  </h3>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {!Array.isArray(conversations) || conversations.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400">
                      No customer messages yet.
                    </div>
                  ) : (
                    conversations.map((c) => {
                      const isSelected = selectedChatEmail === c._id;
                      const formattedTime = c.updatedAt && !isNaN(new Date(c.updatedAt).getTime())
                        ? new Date(c.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '';
                      return (
                        <div
                          key={c._id}
                          onClick={() => setSelectedChatEmail(c._id)}
                          className={`p-4 cursor-pointer transition flex items-start gap-3 ${
                            isSelected ? 'bg-orange-50/80 border-l-4 border-[#ff7300]' : 'hover:bg-gray-100/60 bg-white'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-[#ff7300]/10 text-[#ff7300] font-bold flex items-center justify-center shrink-0 text-sm">
                            {c.userName ? c.userName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <h4 className="font-bold text-xs text-gray-900 truncate">{c.userName || c._id}</h4>
                              <span className="text-[10px] text-gray-400">
                                {formattedTime}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                            <span className="text-[10px] text-gray-400 block truncate mt-0.5">{c._id}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Live Chat Window */}
              <div className="flex-1 flex flex-col justify-between bg-white">
                {selectedChatEmail ? (
                  <>
                    {/* Chat Window Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/40">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#ff7300] text-white font-bold flex items-center justify-center text-sm">
                          {selectedConversation?.userName ? selectedConversation.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-gray-900">{selectedConversation?.userName || selectedChatEmail}</h3>
                          <p className="text-xs text-gray-400">{selectedChatEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200/50">
                          Live Connected
                        </span>
                        <button
                          onClick={handleAdminDeleteChat}
                          title="Delete Chat Thread"
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition border border-red-100 flex items-center gap-1 text-xs font-semibold"
                        >
                          <FiTrash2 className="text-sm" /> Delete Chat
                        </button>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div ref={adminChatContainerRef} className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/30">
                      {!Array.isArray(chatMessages) || chatMessages.length === 0 ? (
                        <div className="text-center py-12 text-xs text-gray-400">
                          No messages yet in this conversation.
                        </div>
                      ) : (
                        chatMessages.map((m, idx) => {
                          const isAdmin = m.sender === 'admin';
                          const msgTime = m.createdAt && !isNaN(new Date(m.createdAt).getTime())
                            ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '';
                          return (
                            <div
                              key={idx}
                              className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                            >
                              <span className="text-[10px] text-gray-400 font-semibold mb-1 px-1">
                                {isAdmin ? 'You (Admin)' : m.userName || 'Customer'} • {msgTime}
                              </span>
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-sm font-medium leading-relaxed ${
                                  isAdmin
                                    ? 'bg-[#ff7300] text-white rounded-br-none'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                }`}
                              >
                                {m.message}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Chat Reply Form */}
                    <form onSubmit={handleAdminSendReply} className="p-4 border-t border-gray-100 flex items-center gap-3">
                      <input
                        type="text"
                        placeholder={`Reply to ${selectedConversation?.userName || selectedChatEmail}...`}
                        value={adminReplyInput}
                        onChange={(e) => setAdminReplyInput(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-xs text-gray-800 focus:outline-none focus:border-[#ff7300]"
                      />
                      <button
                        type="submit"
                        disabled={!adminReplyInput.trim()}
                        className="bg-[#ff7300] hover:bg-[#e06700] disabled:bg-gray-200 text-white px-6 py-3 rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-2"
                      >
                        <FiSend /> Send Reply
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                    <FiMessageSquare className="text-4xl text-gray-300 mb-3" />
                    <p className="text-sm font-semibold text-gray-600">Select a Customer Conversation</p>
                    <p className="text-xs text-gray-400 max-w-xs mt-1">
                      Choose a customer from the left list to view their messages and reply in real time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* --- MODAL 1: LOGOUT CONFIRMATION MODAL (Matching Image 5) --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl relative animate-in fade-in zoom-in duration-200">
            
            {/* Orange Circle Icon */}
            <div className="w-16 h-16 rounded-full bg-orange-100 text-[#ff7300] flex items-center justify-center mx-auto mb-4">
              <FiLogOut className="text-2xl stroke-[2.5]" />
            </div>

            <h3 className="text-xl font-bold text-[#ff7300] mb-2">Logout</h3>
            
            <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed px-2">
              Are you sure you want to logout from the DoggoCare Admin Panel?
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="bg-[#e5e7eb] hover:bg-[#d1d5db] text-[#4b5563] font-bold py-2.5 px-6 rounded-xl text-sm transition duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="bg-[#ff7300] hover:bg-[#e66700] text-white font-bold py-2.5 px-6 rounded-xl text-sm transition duration-150 shadow-md"
              >
                Logout
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 2: ADD USER MODAL --- */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowAddUserModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition"
            >
              <FiX className="text-xl" />
            </button>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New User</h3>
            
            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Silva"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#ff7300]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="john@gmail.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#ff7300]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="0712345678"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#ff7300]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={newUserForm.status}
                  onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#ff7300]"
                >
                  <option value="Active">Active</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="w-1/2 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#ff7300] hover:bg-[#e66700] text-white rounded-xl text-sm font-bold shadow-md transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {viewingOrderDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>Order Details</span>
                  <span className="text-[#ff7300] bg-orange-50 px-2.5 py-0.5 rounded-lg text-sm font-extrabold border border-orange-200/50">
                    #{viewingOrderDetails.id}
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Placed on: {viewingOrderDetails.createdAt ? new Date(viewingOrderDetails.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setViewingOrderDetails(null)}
                className="w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center transition"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Status & Payment Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-gray-500">Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                viewingOrderDetails.status === 'Pending' ? 'bg-amber-100 text-amber-600' :
                viewingOrderDetails.status === 'Processing' ? 'bg-sky-100 text-sky-600' :
                viewingOrderDetails.status === 'Delivered' ? 'bg-emerald-100 text-emerald-600' :
                'bg-rose-100 text-rose-600'
              }`}>
                {viewingOrderDetails.status}
              </span>
              <span className="text-xs font-semibold text-gray-500 ml-4">Payment Method:</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 uppercase">
                {viewingOrderDetails.payment}
              </span>
            </div>

            {/* Customer Info Card */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 text-sm space-y-2">
              <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider text-[#ff7300]">Customer Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">Name:</span> <strong className="text-gray-800">{viewingOrderDetails.customer}</strong></div>
                <div><span className="text-gray-500">Phone:</span> <strong className="text-gray-800">{viewingOrderDetails.customerInfo?.phone || 'N/A'}</strong></div>
                <div><span className="text-gray-500">Email:</span> <strong className="text-gray-800">{viewingOrderDetails.customerInfo?.email || 'N/A'}</strong></div>
                <div>
                  <span className="text-gray-500">Address:</span> <strong className="text-gray-800">
                    {viewingOrderDetails.customerInfo?.address ? `${viewingOrderDetails.customerInfo.address}, ${viewingOrderDetails.customerInfo.city || ''}, ${viewingOrderDetails.customerInfo.province || ''}` : 'N/A'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Ordered Items Table */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3 text-xs uppercase tracking-wider text-[#ff7300]">Ordered Items</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#fff2eb] text-gray-700 font-bold">
                    <tr>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4 text-center">Qty</th>
                      <th className="py-3 px-4 text-right">Price</th>
                      <th className="py-3 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {viewingOrderDetails.items && viewingOrderDetails.items.length > 0 ? (
                      viewingOrderDetails.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-gray-800">{item.name}</td>
                          <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-3 px-4 text-right text-gray-600">Rs. {item.price}</td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">Rs. {item.price * item.quantity}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-gray-400">No items recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Breakdown */}
            <div className="border-t border-gray-100 pt-4 flex flex-col items-end gap-1 text-xs text-gray-600">
              <div>Subtotal: <strong className="text-gray-800">Rs. {viewingOrderDetails.subtotal?.toLocaleString() || 0}</strong></div>
              <div>Delivery Fee: <strong className="text-gray-800">Rs. {viewingOrderDetails.deliveryFee || 0}</strong></div>
              <div className="text-base font-extrabold text-gray-900 mt-2">
                Total: <span className="text-[#ff7300]">{viewingOrderDetails.total}</span>
              </div>
            </div>

            {/* Footer Close Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingOrderDetails(null)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold px-6 py-2.5 rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
