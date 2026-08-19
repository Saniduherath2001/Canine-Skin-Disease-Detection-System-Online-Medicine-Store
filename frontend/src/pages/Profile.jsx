import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiShoppingBag, 
  FiLogOut, 
  FiCheck, 
  FiEdit, 
  FiPackage, 
  FiShield,
  FiMapPin,
  FiCreditCard,
  FiHome,
  FiLock,
  FiCheckCircle,
  FiCamera,
  FiUploadCloud,
  FiTrash2,
  FiLoader
} from 'react-icons/fi';

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Form State - Personal
  const [fullName, setFullName] = useState(user?.fullName || user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');

  // Form State - Address
  const [street, setStreet] = useState(user?.address?.street || '');
  const [city, setCity] = useState(user?.address?.city || '');
  const [postalCode, setPostalCode] = useState(user?.address?.postalCode || '');
  const [province, setProvince] = useState(user?.address?.province || '');

  // Form State - Bank Details
  const [accountHolderName, setAccountHolderName] = useState(user?.bankDetails?.accountHolderName || '');
  const [bankName, setBankName] = useState(user?.bankDetails?.bankName || '');
  const [branchName, setBranchName] = useState(user?.bankDetails?.branchName || '');
  const [accountNumber, setAccountNumber] = useState(user?.bankDetails?.accountNumber || '');

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

  const formatProvince = (p) => {
    if (!p) return '';
    const clean = p.replace(/ Province/i, '').trim();
    return clean;
  };

  // Fetch freshest user profile from backend on mount
  useEffect(() => {
    if (!user?.email && !localStorage.getItem('token')) return;

    const fetchLatestProfile = async () => {
      setLoadingProfile(true);
      try {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const url = user?.email 
          ? `http://localhost:5001/api/profile?email=${encodeURIComponent(user.email)}`
          : 'http://localhost:5001/api/profile';

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            const u = data.user;
            setUser(u);
            localStorage.setItem('user', JSON.stringify(u));
            setFullName(u.fullName || u.username || '');
            setPhone(u.phone || '');
            setEmail(u.email || '');
            setProfilePic(u.profilePic || '');
            if (u.address) {
              setStreet(u.address.street || '');
              setCity(u.address.city || '');
              setPostalCode(u.address.postalCode || '');
              setProvince(formatProvince(u.address.province));
            }
            if (u.bankDetails) {
              setAccountHolderName(u.bankDetails.accountHolderName || '');
              setBankName(u.bankDetails.bankName || '');
              setBranchName(u.bankDetails.branchName || '');
              setAccountNumber(u.bankDetails.accountNumber || '');
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile from backend:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchLatestProfile();
  }, []);

  // Sync state if user changes in localStorage
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || user.username || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setProfilePic(user.profilePic || '');
      if (user.address) {
        setStreet(user.address.street || '');
        setCity(user.address.city || '');
        setPostalCode(user.address.postalCode || '');
        setProvince(formatProvince(user.address.province));
      }
      if (user.bankDetails) {
        setAccountHolderName(user.bankDetails.accountHolderName || '');
        setBankName(user.bankDetails.bankName || '');
        setBranchName(user.bankDetails.branchName || '');
        setAccountNumber(user.bankDetails.accountNumber || '');
      }
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
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Upload Profile Picture handler
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type & size (max 5MB)
    if (!file.type.startsWith('image/')) {
      triggerToast('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      triggerToast('Image size exceeds 5MB. Please select a smaller photo.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    if (user?.email) formData.append('email', user.email);

    setUploadingPhoto(true);

    try {
      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5001/api/profile/avatar', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const newPic = data.profilePic || data.user?.profilePic;
        setProfilePic(newPic);
        const updatedUser = {
          ...user,
          ...data.user,
          profilePic: newPic,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('authChange'));
        triggerToast('Profile picture uploaded successfully!');
      } else {
        const errData = await res.json().catch(() => ({}));
        triggerToast(errData.error || 'Failed to upload photo.');
      }
    } catch (err) {
      console.error('Upload avatar error:', err);
      triggerToast('Error uploading photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove Profile Picture handler
  const handleRemovePhoto = async () => {
    if (!profilePic) return;
    setUploadingPhoto(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5001/api/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          email: user?.email || email,
          profilePic: ''
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProfilePic('');
        const updatedUser = {
          ...user,
          profilePic: ''
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('authChange'));
        triggerToast('Profile photo removed.');
      } else {
        triggerToast('Failed to remove photo.');
      }
    } catch (err) {
      console.error('Remove avatar error:', err);
      triggerToast('Error removing photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        email: user?.email || email,
        fullName,
        phone,
        profilePic,
        address: {
          street,
          city,
          postalCode,
          province,
        },
        bankDetails: {
          accountHolderName,
          bankName,
          branchName,
          accountNumber,
        }
      };

      const res = await fetch('http://localhost:5001/api/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = {
          ...user,
          ...data.user,
          name: fullName,
          fullName,
          phone,
          profilePic,
          address: { street, city, postalCode, province },
          bankDetails: { accountHolderName, bankName, branchName, accountNumber }
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        window.dispatchEvent(new Event('authChange'));
        triggerToast('Profile, Address & Bank details updated successfully!');
        setIsEditing(false);
      } else {
        const errData = await res.json().catch(() => ({}));
        triggerToast(errData.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      triggerToast('Error updating profile. Please check your connection.');
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

  const avatarSrc = profilePic
    ? (profilePic.startsWith('http') ? profilePic : `http://localhost:5001${profilePic}`)
    : null;

  return (
    <div className="min-h-screen bg-gray-50/60 font-sans py-10 px-4 flex flex-col items-center">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#FA9132] text-white px-6 py-3.5 rounded-2xl shadow-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2.5 animate-bounce">
          <FiCheckCircle className="text-xl shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Avatar Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handlePhotoUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Main Container */}
      <div className="w-full max-w-[1060px] flex flex-col gap-6">

        {/* User Header Profile Card */}
        <div className="bg-white rounded-[28px] p-6 md:p-8 border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            
            {/* Interactive Avatar Container */}
            <div className="relative group shrink-0">
              <div 
                onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
                className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FA9132] to-[#ff7300] text-white font-extrabold text-3xl flex items-center justify-center shadow-md overflow-hidden relative cursor-pointer border-2 border-orange-200 transition-transform duration-200 ${uploadingPhoto ? 'opacity-75' : 'hover:scale-[1.02]'}`}
                title="Click to change profile picture"
              >
                {avatarSrc ? (
                  <img 
                    src={avatarSrc} 
                    alt="User avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{fullName ? fullName.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}</span>
                )}

                {/* Hover overlay with camera icon */}
                <div className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {uploadingPhoto ? (
                    <FiLoader className="animate-spin text-2xl" />
                  ) : (
                    <>
                      <FiCamera className="text-xl mb-0.5" />
                      <span className="text-[10px] font-bold">Change</span>
                    </>
                  )}
                </div>
              </div>

              {/* Upload Badge Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 bg-white hover:bg-orange-50 text-[#FA9132] border border-orange-200 p-2 rounded-xl shadow-md transition transform hover:scale-110 flex items-center justify-center"
                title="Upload photo"
              >
                {uploadingPhoto ? (
                  <FiLoader className="animate-spin text-xs" />
                ) : (
                  <FiCamera className="text-xs" />
                )}
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold text-gray-900">{fullName || 'DoggoCare Member'}</h1>
                <span className="bg-orange-100 text-[#FA9132] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Active Member
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

              {/* Photo Action Links */}
              <div className="flex items-center gap-3 mt-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-bold text-[#FA9132] hover:underline flex items-center gap-1"
                >
                  <FiUploadCloud /> {avatarSrc ? 'Change Photo' : 'Upload Photo'}
                </button>

                {avatarSrc && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    className="text-[11px] font-semibold text-gray-400 hover:text-red-500 hover:underline flex items-center gap-1 transition"
                  >
                    <FiTrash2 /> Remove Photo
                  </button>
                )}
              </div>
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
          <div className="lg:col-span-1 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-row lg:flex-col gap-2 sticky top-24">
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
                    <h2 className="text-xl font-extrabold text-gray-900">Account & Payment Profile</h2>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Manage your personal info, delivery address, and bank refund details</p>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-[#FA9132] font-bold px-4 py-2 rounded-xl text-xs transition border border-orange-200/60 shadow-sm"
                    >
                      <FiEdit /> Edit Details
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-gray-500 hover:text-gray-800 font-semibold px-3 py-1.5 border border-gray-200 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-8">
                  
                  {/* Section 1: Personal Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FA9132] flex items-center justify-center text-sm font-bold">
                        <FiUser />
                      </div>
                      <h3 className="text-sm font-extrabold text-gray-800">1. Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              ? 'border-gray-300 bg-white focus:outline-none focus:border-[#FA9132] focus:ring-1 focus:ring-[#FA9132]'
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
                          placeholder="e.g. 0771234567"
                          className={`w-full px-4 py-3 rounded-xl border text-xs text-gray-800 transition ${
                            isEditing
                              ? 'border-gray-300 bg-white focus:outline-none focus:border-[#FA9132] focus:ring-1 focus:ring-[#FA9132]'
                              : 'border-gray-100 bg-gray-50/70 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                          <span>Email Address</span>
                          <FiLock className="text-gray-400 text-xs" />
                        </label>
                        <input
                          type="email"
                          disabled
                          value={email}
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/70 text-xs text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Email address is linked to your login identity and cannot be edited directly.</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Delivery Address */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-4 mt-6">
                      <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FA9132] flex items-center justify-center text-sm font-bold">
                        <FiMapPin />
                      </div>
                      <h3 className="text-sm font-extrabold text-gray-800">2. Delivery Address</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Street Address</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={street}
                          onChange={(e) => setStreet(e.target.value)}
                          placeholder="e.g. No 123, Galle Road, Colombo 03"
                          className={`w-full px-4 py-3 rounded-xl border text-xs text-gray-800 transition ${
                            isEditing
                              ? 'border-gray-300 bg-white focus:outline-none focus:border-[#FA9132] focus:ring-1 focus:ring-[#FA9132]'
                              : 'border-gray-100 bg-gray-50/70 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">City / Town</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Colombo, Kandy, Galle"
                          className={`w-full px-4 py-3 rounded-xl border text-xs text-gray-800 transition ${
                            isEditing
                              ? 'border-gray-300 bg-white focus:outline-none focus:border-[#FA9132] focus:ring-1 focus:ring-[#FA9132]'
                              : 'border-gray-100 bg-gray-50/70 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Postal Code</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                          placeholder="e.g. 00300"
                          className={`w-full px-4 py-3 rounded-xl border text-xs text-gray-800 transition ${
                            isEditing
                              ? 'border-gray-300 bg-white focus:outline-none focus:border-[#FA9132] focus:ring-1 focus:ring-[#FA9132]'
                              : 'border-gray-100 bg-gray-50/70 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Province</label>
                        <select
                          disabled={!isEditing}
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border text-xs text-gray-800 transition ${
                            isEditing
                              ? 'border-gray-300 bg-white focus:outline-none focus:border-[#FA9132] focus:ring-1 focus:ring-[#FA9132]'
                              : 'border-gray-100 bg-gray-50/70 cursor-not-allowed text-gray-700'
                          }`}
                        >
                          <option value="">Select Province</option>
                          <option value="Western">Western Province</option>
                          <option value="Central">Central Province</option>
                          <option value="Southern">Southern Province</option>
                          <option value="North Western">North Western Province</option>
                          <option value="North Central">North Central Province</option>
                          <option value="Uva">Uva Province</option>
                          <option value="Sabaragamuwa">Sabaragamuwa Province</option>
                          <option value="Northern">Northern Province</option>
                          <option value="Eastern">Eastern Province</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Bank & Refund Details */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4 mt-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#FA9132] flex items-center justify-center text-sm font-bold">
                          <FiCreditCard />
                        </div>
                        <h3 className="text-sm font-extrabold text-gray-800">3. Bank & Refund Details</h3>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-100">
                        <FiShield className="text-xs" /> Secure Encrypted
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 mb-4 font-normal">
                      Provide your bank account details for fast automated refunds and payout processing.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Account Holder Name</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={accountHolderName}
                          onChange={(e) => setAccountHolderName(e.target.value)}
                          placeholder="Name as per Bank Account"
                          className={`w-full px-4 py-3 rounded-xl border text-xs text-gray-800 transition ${
                            isEditing
                              ? 'border-gray-300 bg-white focus:outline-none focus:border-[#FA9132] focus:ring-1 focus:ring-[#FA9132]'
                              : 'border-gray-100 bg-gray-50/70 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Bank Name</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. Commercial Bank, BOC, Sampath Bank"
                          className={`w-full px-4 py-3 rounded-xl border text-xs text-gray-800 transition ${
                            isEditing
                              ? 'border-gray-300 bg-white focus:outline-none focus:border-[#FA9132] focus:ring-1 focus:ring-[#FA9132]'
                              : 'border-gray-100 bg-gray-50/70 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Branch Name</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value)}
                          placeholder="e.g. Kollupitiya, Kandy Main"
                          className={`w-full px-4 py-3 rounded-xl border text-xs text-gray-800 transition ${
                            isEditing
                              ? 'border-gray-300 bg-white focus:outline-none focus:border-[#FA9132] focus:ring-1 focus:ring-[#FA9132]'
                              : 'border-gray-100 bg-gray-50/70 cursor-not-allowed'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Account Number</label>
                        <input
                          type="text"
                          disabled={!isEditing}
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="e.g. 100012345678"
                          className={`w-full px-4 py-3 rounded-xl border text-xs text-gray-800 transition ${
                            isEditing
                              ? 'border-gray-300 bg-white focus:outline-none focus:border-[#FA9132] focus:ring-1 focus:ring-[#FA9132]'
                              : 'border-gray-100 bg-gray-50/70 cursor-not-allowed'
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#FA9132] hover:bg-[#e07f28] disabled:bg-gray-300 text-white font-bold px-8 py-3 rounded-xl text-xs transition shadow-md flex items-center gap-2"
                      >
                        {saving ? 'Saving Changes...' : 'Save Profile Changes'}
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
                      
                      const statusColor = order.status === 'Completed' || order.status === 'Delivered'
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
