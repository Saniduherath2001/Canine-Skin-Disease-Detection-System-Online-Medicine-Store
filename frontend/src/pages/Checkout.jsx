import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import amoxicillinImg from '../assets/st1.jpeg';
import shampooImg from '../assets/st4.jpeg';

const Checkout = () => {
  const navigate = useNavigate();

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
      } catch (e) {}
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
    } catch (e) {}
    return initial;
  });

  const [toastMessage, setToastMessage] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);

  const [orderItems, setOrderItems] = useState(() => {
    return JSON.parse(localStorage.getItem('cart')) || [];
  });

  const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryFee = orderItems.length > 0 ? 350 : 0;
  const discount = 0;
  const total = subtotal + deliveryFee - discount;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone: digitsOnly });
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
          price: item.price,
          quantity: item.quantity
        })),
        subtotal,
        deliveryFee,
        discount,
        total,
        paymentMethod: formData.paymentMethod
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
        localStorage.removeItem('cart'); // Clear local cart

        // Clear cart from MongoDB
        if (formData.email) {
          fetch(`http://localhost:5001/api/cart?email=${encodeURIComponent(formData.email)}`, {
            method: 'DELETE'
          }).catch(err => console.error('Failed to clear cart in DB:', err));
        }

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
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="Enter postal code"
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

                <label className="flex items-center gap-3 p-4 border-b border-gray-100 cursor-pointer hover:bg-orange-50/30 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#FA9132] accent-[#FA9132]"
                  />
                  <span className="text-xs md:text-sm font-semibold text-gray-800">
                    Credit / Debit Card
                  </span>
                </label>

                <label className="flex items-center gap-3 p-4 cursor-pointer hover:bg-orange-50/30 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank"
                    checked={formData.paymentMethod === 'bank'}
                    onChange={handleChange}
                    className="w-4 h-4 text-[#FA9132] accent-[#FA9132]"
                  />
                  <span className="text-xs md:text-sm font-semibold text-gray-800">
                    Bank Transfer
                  </span>
                </label>
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
                <div key={item.id} className="flex items-center justify-between gap-3">
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
                        Quantity: {item.quantity}
                      </span>
                    </div>
                  </div>
                  <span className="font-extrabold text-xs md:text-sm text-[#FA9132] whitespace-nowrap">
                    Rs. {(item.price * item.quantity).toLocaleString()}
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
                <span>Rs. {deliveryFee}</span>
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
    </div>
  );
};

export default Checkout;
