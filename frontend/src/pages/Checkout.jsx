import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CardPaymentModal from '../components/CardPaymentModal';
import amoxicillinImg from '../assets/st1.jpeg';
import shampooImg from '../assets/st4.jpeg';

const removePurchasedItemsFromCart = async (purchasedItems, email) => {
  const isSameItem = (cartItem, bought) => {
    const cId = cartItem.productId || cartItem._id || cartItem.id;
    const bId = bought.productId || bought._id || bought.id;
    if (cId && bId && String(cId) === String(bId)) return true;
    return cartItem.name && bought.name && cartItem.name === bought.name;
  };

  try {
    const fullCart = JSON.parse(localStorage.getItem('cart')) || [];
    const remainingCart = fullCart.filter(
      (cItem) => !purchasedItems.some((bought) => isSameItem(cItem, bought))
    );

    if (remainingCart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(remainingCart));
    } else {
      localStorage.removeItem('cart');
    }
    sessionStorage.removeItem('checkoutItems');

    if (email) {
      if (remainingCart.length > 0) {
        await fetch('http://localhost:5001/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: email, items: remainingCart })
        });
      } else {
        await fetch(`http://localhost:5001/api/cart?email=${encodeURIComponent(email)}`, {
          method: 'DELETE'
        });
      }
    }
  } catch (err) {
    console.error('Failed to update remaining cart items:', err);
  }
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);

  // Auto-fill logged in user info & redirect if not signed in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token && !userStr) {
      navigate('/login');
      return;
    }

    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setFormData((prev) => {
          let first = u.firstName || '';
          let last = u.lastName || '';
          if (!first && (u.fullName || u.name)) {
            const parts = (u.fullName || u.name).trim().split(' ');
            first = parts[0] || '';
            last = parts.slice(1).join(' ') || '';
          }
          return {
            ...prev,
            firstName: prev.firstName || first,
            lastName: prev.lastName || last,
            email: prev.email || u.email || '',
            phone: prev.phone || u.phone || '',
            address: prev.address || u.address?.street || (typeof u.address === 'string' ? u.address : '') || '',
            city: prev.city || u.address?.city || u.city || '',
            postalCode: prev.postalCode || u.address?.postalCode || u.postalCode || '',
            province: prev.province || u.address?.province || u.province || '',
          };
        });
      } catch (e) { }
    }

    // Check for Stripe Checkout redirect parameters
    const queryParams = new URLSearchParams(window.location.search);
    const sessionId = queryParams.get('session_id');
    const orderId = queryParams.get('order_id');
    const isCancelled = queryParams.get('cancel');

    if (isCancelled) {
      showToast('⚠️ Stripe payment was cancelled.');
    }

    if (sessionId && orderId) {
      const verifyStripe = async () => {
        try {
          const res = await fetch('http://localhost:5001/api/orders/verify-stripe-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, orderId }),
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setOrderPlaced(true);
            showToast(`🎉 Payment successful via Stripe! Order ${data.order?.orderCode || ''} confirmed.`);
            const boughtItems = data.order?.items?.length ? data.order.items : JSON.parse(sessionStorage.getItem('checkoutItems') || '[]');
            let emailForCleanup = '';
            if (userStr) {
              try { emailForCleanup = JSON.parse(userStr)?.email || ''; } catch (e) { }
            }
            await removePurchasedItemsFromCart(boughtItems, emailForCleanup);
            setTimeout(() => {
              navigate('/store');
            }, 3500);
          } else {
            showToast(`❌ Stripe verification failed: ${data.message || 'Payment unconfirmed'}`);
          }
        } catch (e) {
          console.error('Error verifying Stripe session:', e);
        }
      };
      verifyStripe();
    }
  }, [navigate]);

  const [formData, setFormData] = useState(() => {
    let initial = {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      postalCode: '',
      province: '',
      paymentMethod: 'cod',
    };
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        let first = u.firstName || '';
        let last = u.lastName || '';
        if (!first && (u.fullName || u.name)) {
          const parts = (u.fullName || u.name).trim().split(' ');
          first = parts[0] || '';
          last = parts.slice(1).join(' ') || '';
        }
        initial.firstName = first;
        initial.lastName = last;
        initial.email = u.email || '';
        initial.phone = u.phone || '';
        initial.address = u.address?.street || (typeof u.address === 'string' ? u.address : '') || '';
        initial.city = u.address?.city || u.city || '';
        initial.postalCode = u.address?.postalCode || u.postalCode || '';
        initial.province = u.address?.province || u.province || '';
      }
    } catch (e) { }
    return initial;
  });

  const [toastMessage, setToastMessage] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [globalDeliveryFee, setGlobalDeliveryFee] = useState(350);

  // Fetch global delivery fee setting
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/settings/delivery-fee');
        if (res.ok) {
          const data = await res.json();
          if (typeof data.deliveryFee === 'number') {
            setGlobalDeliveryFee(data.deliveryFee);
          }
        }
      } catch (err) {
        console.error('Failed to fetch global delivery fee:', err);
      }
    };
    fetchDeliveryFee();
  }, []);

  const [orderItems, setOrderItems] = useState(() => {
    if (location.state?.checkoutItems && Array.isArray(location.state.checkoutItems) && location.state.checkoutItems.length > 0) {
      sessionStorage.setItem('checkoutItems', JSON.stringify(location.state.checkoutItems));
      return location.state.checkoutItems;
    }
    try {
      const savedCheckout = JSON.parse(sessionStorage.getItem('checkoutItems'));
      if (Array.isArray(savedCheckout) && savedCheckout.length > 0) {
        return savedCheckout;
      }
    } catch (e) { }
    return JSON.parse(localStorage.getItem('cart')) || [];
  });

  // Synchronize order items with current database prices
  useEffect(() => {
    const syncWithDb = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/items');
        if (res.ok) {
          const allItems = await res.json();
          if (Array.isArray(allItems) && allItems.length > 0) {
            setOrderItems((prev) => {
              let hasChange = false;
              const synced = prev.map((cItem) => {
                const match = allItems.find(
                  (dbI) => (cItem.productId && dbI._id && String(dbI._id) === String(cItem.productId)) ||
                    (cItem._id && dbI._id && String(dbI._id) === String(cItem._id)) ||
                    (cItem.id && dbI._id && String(dbI._id) === String(cItem.id)) ||
                    dbI.name === cItem.name
                );
                if (match) {
                  const newPrice = typeof match.price === 'number' && match.price > 0 ? match.price : cItem.price;
                  const newDeliveryFee = typeof match.deliveryFee === 'number' ? match.deliveryFee : 0;
                  if (cItem.price !== newPrice || cItem.deliveryFee !== newDeliveryFee) {
                    hasChange = true;
                    return { ...cItem, price: newPrice, deliveryFee: newDeliveryFee };
                  }
                }
                return cItem;
              });
              if (hasChange) {
                sessionStorage.setItem('checkoutItems', JSON.stringify(synced));
                return synced;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.error('Error syncing checkout items with DB:', err);
      }
    };
    syncWithDb();
  }, []);

  const parsePrice = (priceVal) => {
    if (typeof priceVal === 'number') return isNaN(priceVal) ? 0 : priceVal;
    if (!priceVal) return 0;
    const cleaned = String(priceVal).replace(/[^0-9.-]+/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  const parseQty = (qtyVal) => {
    const parsed = parseInt(qtyVal, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  };

  const subtotal = orderItems.reduce((acc, item) => {
    return acc + (parsePrice(item.price) * parseQty(item.quantity));
  }, 0);
  const deliveryFee = orderItems.length > 0 ? globalDeliveryFee : 0;
  const discount = 0;
  const total = orderItems.length > 0 ? Math.max(0, subtotal + deliveryFee - discount) : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone: digitsOnly });
    } else if (name === 'postalCode') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 5);
      setFormData({ ...formData, postalCode: digitsOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      showToast('❌ Your cart is empty.');
      return;
    }

    if (!formData.firstName || !formData.email || !formData.phone || !formData.address || !formData.city) {
      showToast('⚠️ Please fill in all required delivery details.');
      return;
    }

    if (!/^[0-9]{5}$/.test(formData.postalCode || '')) {
      showToast('⚠️ Postal code must be exactly 5 digits (e.g. 10100).');
      return;
    }

    // If card payment, launch Stripe Checkout session
    if (formData.paymentMethod === 'card') {
      try {
        const orderPayload = {
          customerInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            province: formData.province
          },
          items: orderItems.map(item => ({
            productId: item.productId || item._id || item.id,
            name: item.name,
            price: parsePrice(item.price),
            quantity: parseQty(item.quantity)
          })),
          subtotal,
          deliveryFee,
          discount,
          total,
          paymentMethod: 'card',
          paymentStatus: 'Pending'
        };

        const res = await fetch('http://localhost:5001/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });

        if (!res.ok) {
          const errData = await res.json();
          showToast(`❌ Failed to place order: ${errData.message || 'Server error'}`);
          return;
        }

        const savedOrder = await res.json();
        setPendingOrderId(savedOrder._id);

        // Call backend to create Stripe Checkout session
        const stripeRes = await fetch('http://localhost:5001/api/orders/create-stripe-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: savedOrder._id, origin: window.location.origin })
        });

        const stripeData = await stripeRes.json();
        if (stripeRes.ok && stripeData.url) {
          // Redirect to Stripe's official hosted checkout page
          window.location.href = stripeData.url;
          return;
        } else {
          // If Stripe key isn't configured in .env yet, open in-app modal as seamless fallback
          showToast(`ℹ️ ${stripeData.message || 'Opening in-app payment modal...'}`);
          setIsCardModalOpen(true);
          return;
        }
      } catch (err) {
        console.error('Error starting Stripe checkout:', err);
        setIsCardModalOpen(true);
        return;
      }
    }

    // For Cash on Delivery (COD) and Bank Transfer
    try {
      const orderPayload = {
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          province: formData.province
        },
        items: orderItems.map(item => ({
          productId: item.productId || item._id || item.id,
          name: item.name,
          price: parsePrice(item.price),
          quantity: parseQty(item.quantity)
        })),
        subtotal,
        deliveryFee,
        discount,
        total,
        paymentMethod: formData.paymentMethod,
        paymentStatus: 'Pending'
      };

      const res = await fetch('http://localhost:5001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      if (res.ok) {
        const savedOrder = await res.json();
        setOrderPlaced(true);
        showToast(`🎉 Thank you! Order ${savedOrder.orderCode || ''} placed successfully.`);
        await removePurchasedItemsFromCart(orderItems, formData.email);

        setTimeout(() => {
          navigate('/store');
        }, 3500);
      } else {
        const errorData = await res.json();
        showToast(`❌ Failed to place order: ${errorData.message || 'Server error'}`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showToast('❌ Server error while placing order.');
    }
  };

  const handleCardPaymentSuccess = async () => {
    try {
      let res;
      if (pendingOrderId) {
        // Complete payment on the existing pending order instead of duplicating it
        res = await fetch(`http://localhost:5001/api/orders/${pendingOrderId}/payment-complete`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        const orderPayload = {
          customerInfo: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            postalCode: formData.postalCode,
            province: formData.province
          },
          items: orderItems.map(item => ({
            productId: item.productId || item._id || item.id,
            name: item.name,
            price: parsePrice(item.price),
            quantity: parseQty(item.quantity)
          })),
          subtotal,
          deliveryFee,
          discount,
          total,
          paymentMethod: 'card',
          paymentStatus: 'Paid'
        };

        res = await fetch('http://localhost:5001/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });
      }

      if (res.ok) {
        const data = await res.json();
        const savedOrder = data.order || data;
        setPendingOrderId(null);
        setIsCardModalOpen(false);
        setOrderPlaced(true);
        showToast(`🎉 Payment verified! Order ${savedOrder.orderCode || ''} placed successfully.`);
        await removePurchasedItemsFromCart(orderItems, formData.email);

        setTimeout(() => {
          navigate('/store');
        }, 3000);
      } else {
        const errorData = await res.json();
        showToast(`❌ Failed to place order: ${errorData.message || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error in card payment checkout:', err);
      showToast('❌ Server error processing card payment.');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col items-center py-10 px-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#FA9132] text-white px-6 py-3 rounded-xl shadow-lg font-medium text-sm transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-[1200px]">
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Form Fields (7 Columns) */}
          <div className="lg:col-span-7 bg-white rounded-[28px] md:rounded-[32px] p-6 md:p-10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col gap-8">

            {/* 1. Customer Information */}
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#FA9132] mb-5">
                Customer Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs md:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs md:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs md:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter 10-digit phone number (e.g. 0771234567)"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs md:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
                  />
                </div>
              </div>
            </div>

            {/* 2. Delivery Address */}
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#FA9132] mb-5">
                Delivery Address
              </h2>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your delivery address"
                    rows={3}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs md:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs md:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Postal Code (5 digits)
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      inputMode="numeric"
                      maxLength={5}
                      pattern="[0-9]{5}"
                      title="Postal code must be exactly 5 digits"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="Enter 5-digit postal code (e.g. 10100)"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs md:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Province
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs md:text-sm text-gray-800 focus:outline-none focus:border-[#FA9132]"
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

            {/* 3. Payment Method */}
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#FA9132] mb-5">
                Payment Method
              </h2>

              <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white mb-6">
                <label className="flex items-center gap-3 p-4 border-b border-gray-100 cursor-pointer hover:bg-orange-50/30 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={formData.paymentMethod === 'cod'}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#FA9132] accent-[#FA9132]"
                  />
                  <span className="text-xs md:text-sm font-semibold text-gray-800">
                    Cash on Delivery
                  </span>
                </label>

                <div className="border-b border-gray-100">
                  <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-orange-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={formData.paymentMethod === 'card'}
                        onChange={handleChange}
                        className="w-4 h-4 text-[#FA9132] accent-[#FA9132]"
                      />
                      <span className="text-xs md:text-sm font-semibold text-gray-800">
                        Credit / Debit Card (Stripe)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">

                    </div>
                  </label>

                </div>



              </div>

              {/* Security Lock Note */}
              <div className="bg-[#FFF9F3] border border-orange-100 rounded-xl p-3.5 flex items-center gap-2.5 text-[11px] md:text-xs text-gray-500">
                <span className="text-sm">🔒</span>
                <span>
                  Your personal information is securely protected. DoggoCare will only use your information to process and deliver your order.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (5 Columns) */}
          <div className="lg:col-span-5 bg-white rounded-[28px] p-6 md:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col lg:sticky lg:top-24">
            <h2 className="text-xl font-extrabold text-[#FA9132] mb-6">
              Order Summary
            </h2>

            {/* Order Items List */}
            <div className="flex flex-col gap-4 mb-6">
              {orderItems.map((item) => (
                <div key={item.productId || item._id || item.id || item.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-2 shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-extrabold text-gray-900 text-xs md:text-sm">
                        {item.name}
                      </h4>
                      <span className="text-[11px] text-gray-400">
                        Quantity: {parseQty(item.quantity)}
                      </span>
                    </div>
                  </div>
                  <span className="font-extrabold text-xs md:text-sm text-[#FA9132] whitespace-nowrap">
                    Rs. {(parsePrice(item.price) * parseQty(item.quantity)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 mb-4 flex flex-col gap-3 text-xs md:text-sm text-gray-600">
              <div className="flex justify-between items-center font-medium">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center font-medium">
                <span>Delivery Fee</span>
                <span>{deliveryFee > 0 ? `Rs. ${deliveryFee.toLocaleString()}` : 'Free'}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 my-2"></div>

            {/* Total */}
            <div className="flex justify-between items-center my-4">
              <span className="text-base md:text-lg font-extrabold text-gray-900">
                Total
              </span>
              <span className="text-lg md:text-xl font-extrabold text-[#FA9132]">
                Rs. {total.toLocaleString()}
              </span>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              className="w-full bg-[#FA9132] hover:bg-[#e07f28] text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-95 mb-4"
            >
              Place Order
            </button>

            {/* Back to Shopping Cart Link */}
            <Link
              to="/cart"
              className="text-gray-500 hover:text-[#FA9132] font-semibold text-center text-xs md:text-sm transition-colors"
            >
              ← Back to Shopping Cart
            </Link>
          </div>

        </form>
      </div>

      {/* Interactive 3D Secure Card Payment Gateway Modal */}
      <CardPaymentModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        amount={total}
        orderData={{ customerInfo: formData }}
        onPaymentSuccess={handleCardPaymentSuccess}
      />
    </div>
  );
};

export default Checkout;
