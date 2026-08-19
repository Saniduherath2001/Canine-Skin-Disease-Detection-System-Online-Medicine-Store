import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(() => {
    return JSON.parse(localStorage.getItem('cart')) || [];
  });

  const [userEmail, setUserEmail] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      return u?.email || '';
    } catch (e) {
      return '';
    }
  });

  const [toastMessage, setToastMessage] = useState('');
  const deliveryFee = 350;
  const discountAmount = 0;

  // Fetch cart from MongoDB database on mount if signed in
  useEffect(() => {
    if (!userEmail) return;

    const fetchDbCart = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/cart?email=${encodeURIComponent(userEmail)}`);
        if (res.ok) {
          const dbCart = await res.json();
          if (dbCart && Array.isArray(dbCart.items)) {
            setCartItems(dbCart.items);
            localStorage.setItem('cart', JSON.stringify(dbCart.items));
          }
        }
      } catch (err) {
        console.error('Failed to fetch cart from DB:', err);
      }
    };

    fetchDbCart();
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const updateDbCart = async (updatedItems) => {
    if (!userEmail) return;
    try {
      await fetch('http://localhost:5001/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, items: updatedItems })
      });
    } catch (err) {
      console.error('Failed to update cart in DB:', err);
    }
  };

  const handleQuantityChange = (id, delta) => {
    setCartItems((prevItems) => {
      const updated = prevItems.map((item) => {
        if (item.id === id || item._id === id || item.name === id) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      });
      updateDbCart(updated);
      return updated;
    });
  };

  const handleRemoveItem = async (targetItem) => {
    const itemName = typeof targetItem === 'object' ? targetItem.name : targetItem;
    const itemId = typeof targetItem === 'object' ? (targetItem._id || targetItem.id) : targetItem;

    const updated = cartItems.filter(
      (item) => item.id !== itemId && item._id !== itemId && item.name !== itemName
    );

    setCartItems(updated);
    localStorage.setItem('cart', JSON.stringify(updated));

    if (userEmail) {
      try {
        await fetch(`http://localhost:5001/api/cart/item?email=${encodeURIComponent(userEmail)}&name=${encodeURIComponent(itemName)}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Failed to delete item from DB:', err);
      }
    }

    showToast('Item removed from cart');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  
  const displaySubtotal = subtotal;
  const displayTotal = displaySubtotal > 0 ? displaySubtotal + deliveryFee - discountAmount : 0;

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col items-center py-10 px-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#FA9132] text-white px-6 py-3 rounded-xl shadow-lg font-medium text-sm transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-[860px] flex flex-col">
        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#FA9132] mb-8 text-left">
          Shopping Cart
        </h1>

        {/* Cart Items List */}
        <div className="w-full flex flex-col gap-4 mb-12">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <div
                key={item._id || item.id || item.name}
                className="w-full bg-white rounded-2xl md:rounded-[22px] px-6 py-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-gray-900 text-base md:text-lg mb-0.5">
                    {item.name}
                  </h3>
                  <span className="text-xs text-gray-400 mb-1 font-normal">
                    {item.category}
                  </span>
                  <span className="text-sm font-extrabold text-[#FA9132]">
                    Rs.{item.price}
                  </span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-center">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQuantityChange(item._id || item.id || item.name, -1)}
                      className="w-7 h-7 rounded bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold text-base flex items-center justify-center transition-colors shadow-sm active:scale-95"
                    >
                      -
                    </button>
                    <div className="w-8 h-7 flex items-center justify-center border border-gray-200 rounded text-xs font-bold text-gray-800 bg-white">
                      {item.quantity}
                    </div>
                    <button
                      onClick={() => handleQuantityChange(item._id || item.id || item.name, 1)}
                      className="w-7 h-7 rounded bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold text-base flex items-center justify-center transition-colors shadow-sm active:scale-95"
                    >
                      +
                    </button>
                  </div>

                  {/* Line Price */}
                  <span className="text-sm md:text-base font-extrabold text-[#FA9132] min-w-[65px] text-right">
                    Rs.{item.price * item.quantity}
                  </span>

                  {/* Delete Trash Button */}
                  <button
                    onClick={() => handleRemoveItem(item)}
                    className="w-8 h-8 rounded-lg bg-[#FA3B3B] hover:bg-[#e02828] text-white flex items-center justify-center transition-colors shadow-sm active:scale-95"
                    title="Remove item"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-500 shadow-sm border border-gray-100">
              Your shopping cart is empty.
            </div>
          )}
        </div>

        {/* Order Summary Card - Centered */}
        <div className="w-full max-w-[520px] mx-auto bg-white rounded-[28px] p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col">
          <h2 className="text-xl md:text-2xl font-extrabold text-[#FA9132] mb-6">
            Order Summary
          </h2>

          {/* Pricing Breakdown */}
          <div className="flex flex-col gap-3.5 text-xs md:text-sm mb-4">
            <div className="flex justify-between items-center text-gray-700 font-medium">
              <span>Subtotal</span>
              <span>Rs.{displaySubtotal}</span>
            </div>
            <div className="flex justify-between items-center text-gray-700 font-medium">
              <span>Delivery</span>
              <span>Rs.{cartItems.length > 0 ? deliveryFee : 0}</span>
            </div>
          </div>

          <div className="border-t border-gray-300 my-4"></div>

          {/* Total Row */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl md:text-2xl font-extrabold text-gray-900">
              Total
            </span>
            <span className="text-xl md:text-2xl font-extrabold text-[#FA9132]">
              Rs.{displayTotal}
            </span>
          </div>

          {/* Proceed to Checkout Button */}
          <button
            onClick={() => {
              const token = localStorage.getItem('token');
              const user = localStorage.getItem('user');
              if (!token && !user) {
                showToast('Please Sign In to proceed to checkout!');
                setTimeout(() => navigate('/login'), 1000);
              } else {
                navigate('/checkout');
              }
            }}
            className="w-full bg-[#FA9132] hover:bg-[#e07f28] text-white font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-95 mb-4"
          >
            Proceed to Checkout
          </button>

          {/* Continue Shopping Link */}
          <Link
            to="/store"
            className="text-[#FA9132] font-bold text-center text-xs md:text-sm hover:underline"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
