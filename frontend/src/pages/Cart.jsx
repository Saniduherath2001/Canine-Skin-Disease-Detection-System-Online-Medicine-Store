import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Safe parsing helpers for monetary and quantity values
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

const getItemKey = (item) => String(item.productId || item._id || item.id || item.name);

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState(() => {
    return JSON.parse(localStorage.getItem('cart')) || [];
  });
  const [selectedKeys, setSelectedKeys] = useState(() => {
    const initial = JSON.parse(localStorage.getItem('cart')) || [];
    return initial.map(getItemKey);
  });
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

  const [userEmail, setUserEmail] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user'));
      return u?.email || '';
    } catch (e) {
      return '';
    }
  });

  const [toastMessage, setToastMessage] = useState('');
  const [globalDeliveryFee, setGlobalDeliveryFee] = useState(350);
  const discountAmount = 0;

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

  // Fetch cart from MongoDB (if signed in) and synchronize authoritative prices & delivery fees sequentially
  useEffect(() => {
    let isMounted = true;

    const loadAndSyncCart = async () => {
      let baseItems = JSON.parse(localStorage.getItem('cart')) || [];

      if (userEmail) {
        try {
          const cartRes = await fetch(`http://localhost:5001/api/cart?email=${encodeURIComponent(userEmail)}`);
          if (cartRes.ok) {
            const dbCart = await cartRes.json();
            if (dbCart && Array.isArray(dbCart.items)) {
              baseItems = dbCart.items;
            }
          }
        } catch (err) {
          console.error('Failed to fetch cart from DB:', err);
        }
      }

      try {
        const itemsRes = await fetch('http://localhost:5001/api/items');
        if (itemsRes.ok) {
          const allItems = await itemsRes.json();
          if (Array.isArray(allItems) && allItems.length > 0) {
            let hasChange = false;
            const synced = baseItems.map((cItem) => {
              const match = allItems.find(
                (dbI) => (cItem.productId && dbI._id && String(dbI._id) === String(cItem.productId)) ||
                         (cItem._id && dbI._id && String(dbI._id) === String(cItem._id)) ||
                         (cItem.id && dbI._id && String(dbI._id) === String(cItem.id)) ||
                         dbI.name === cItem.name
              );
              if (match) {
                const newPrice = typeof match.price === 'number' && match.price > 0 ? match.price : cItem.price;
                const newDeliveryFee = typeof match.deliveryFee === 'number' ? match.deliveryFee : 0;
                const availableStock = typeof match.stock === 'number' ? match.stock : 0;
                const currentQty = parseQty(cItem.quantity);
                const clampedQty = availableStock > 0 ? Math.min(currentQty, availableStock) : currentQty;
                if (
                  cItem.price !== newPrice ||
                  cItem.deliveryFee !== newDeliveryFee ||
                  cItem.stock !== availableStock ||
                  clampedQty !== currentQty
                ) {
                  hasChange = true;
                  return {
                    ...cItem,
                    price: newPrice,
                    deliveryFee: newDeliveryFee,
                    stock: availableStock,
                    quantity: clampedQty,
                  };
                }
              }
              return cItem;
            });

            if (isMounted) {
              setCartItems(synced);
              setSelectedKeys(synced.map(getItemKey));
              setHasInitializedSelection(true);
              localStorage.setItem('cart', JSON.stringify(synced));
              if (hasChange && userEmail) {
                updateDbCart(synced);
              }
            }
            return;
          }
        }
      } catch (err) {
        console.error('Error syncing cart prices with DB items:', err);
      }

      if (isMounted) {
        setCartItems(baseItems);
        setSelectedKeys(baseItems.map(getItemKey));
        setHasInitializedSelection(true);
        localStorage.setItem('cart', JSON.stringify(baseItems));
      }
    };

    loadAndSyncCart();
    return () => { isMounted = false; };
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
    let limitWarning = '';
    setCartItems((prevItems) => {
      let changed = false;
      const updated = prevItems.map((item) => {
        if (item.id === id || item._id === id || item.productId === id || item.name === id) {
          const currentQty = parseQty(item.quantity);
          if (delta > 0 && typeof item.stock === 'number') {
            if (item.stock <= 0) {
              limitWarning = `❌ "${item.name}" is currently out of stock.`;
              return item;
            }
            if (currentQty >= item.stock) {
              limitWarning = `⚠️ Maximum available stock (${item.stock}) reached for "${item.name}".`;
              return item;
            }
          }
          const maxAllowed = typeof item.stock === 'number' && item.stock > 0 ? item.stock : Infinity;
          const newQty = Math.min(maxAllowed, Math.max(1, currentQty + delta));
          if (newQty !== currentQty) {
            changed = true;
            return { ...item, quantity: newQty };
          }
        }
        return item;
      });
      if (changed) {
        updateDbCart(updated);
      }
      return updated;
    });
    if (limitWarning) {
      showToast(limitWarning);
    }
  };

  const handleRemoveItem = async (targetItem) => {
    const itemName = typeof targetItem === 'object' ? targetItem.name : targetItem;
    const itemId = typeof targetItem === 'object' ? (targetItem._id || targetItem.id) : targetItem;

    const updated = cartItems.filter(
      (item) => item.id !== itemId && item._id !== itemId && item.name !== itemName
    );

    setCartItems(updated);
    setSelectedKeys((prev) => prev.filter((k) => updated.some((u) => getItemKey(u) === k)));
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

  const toggleSelectItem = (key) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const allSelected = cartItems.length > 0 && cartItems.every((item) => selectedKeys.includes(getItemKey(item)));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedKeys([]);
    } else {
      setSelectedKeys(cartItems.map(getItemKey));
    }
  };

  const selectedItems = cartItems.filter((item) => selectedKeys.includes(getItemKey(item)));

  const handleBuySingleItem = (item) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token && !user) {
      showToast('Please Sign In to proceed to checkout!');
      setTimeout(() => navigate('/login'), 1000);
      return;
    }
    const singleCheckout = [item];
    sessionStorage.setItem('checkoutItems', JSON.stringify(singleCheckout));
    navigate('/checkout', { state: { checkoutItems: singleCheckout } });
  };

  const handleProceedToCheckout = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token && !user) {
      showToast('Please Sign In to proceed to checkout!');
      setTimeout(() => navigate('/login'), 1000);
      return;
    }
    if (selectedItems.length === 0) {
      showToast('Please select at least one item to checkout!');
      return;
    }
    sessionStorage.setItem('checkoutItems', JSON.stringify(selectedItems));
    navigate('/checkout', { state: { checkoutItems: selectedItems } });
  };

  const subtotal = selectedItems.reduce(
    (acc, item) => acc + (parsePrice(item.price) * parseQty(item.quantity)),
    0
  );
  
  const activeDeliveryFee = selectedItems.length > 0 ? globalDeliveryFee : 0;
  const displaySubtotal = subtotal;
  const displayTotal = selectedItems.length > 0 ? Math.max(0, displaySubtotal + activeDeliveryFee - discountAmount) : 0;

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
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#FA9132] mb-6 text-left">
          Shopping Cart
        </h1>

        {/* Select All Bar */}
        {cartItems.length > 0 && (
          <div className="w-full bg-white rounded-2xl px-6 py-3.5 mb-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-[#FA9132] rounded cursor-pointer"
              />
              <span className="text-sm font-bold text-gray-800">
                Select All ({selectedItems.length} / {cartItems.length} items)
              </span>
            </label>
            <span className="text-xs text-gray-400 hidden sm:inline">
              Select items to checkout together or click "Buy Now" per item
            </span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="w-full flex flex-col gap-4 mb-12">
          {cartItems.length > 0 ? (
            cartItems.map((item) => {
              const itemKey = getItemKey(item);
              const isSelected = selectedKeys.includes(itemKey);
              return (
              <div
                key={itemKey}
                className={`w-full bg-white rounded-2xl md:rounded-[22px] px-6 py-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isSelected ? 'border-[#FA9132]/40' : 'border-gray-100 opacity-80'
                }`}
              >
                {/* Left Info with Checkbox */}
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectItem(itemKey)}
                    className="w-4 h-4 accent-[#FA9132] rounded cursor-pointer shrink-0"
                    title="Select item for checkout"
                  />
                  <div className="flex flex-col">
                    <h3 className="font-extrabold text-gray-900 text-base md:text-lg mb-0.5">
                      {item.name}
                    </h3>
                    <span className="text-xs text-gray-400 mb-1 font-normal">
                      {item.category}
                    </span>
                    <span className="text-sm font-extrabold text-[#FA9132]">
                      Rs. {parsePrice(item.price).toLocaleString()}
                    </span>
                    {typeof item.stock === 'number' && (
                      <span className={`text-[11px] font-semibold mt-0.5 ${item.stock === 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                        {item.stock === 0 ? 'Out of Stock' : `Available Stock: ${item.stock}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Controls */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-5 self-end sm:self-center">
                  {/* Quantity Selector */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQuantityChange(item._id || item.id || item.name, -1)}
                      disabled={parseQty(item.quantity) <= 1}
                      className={`w-7 h-7 rounded font-bold text-base flex items-center justify-center transition-colors shadow-sm ${
                        parseQty(item.quantity) <= 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[#FA9132] hover:bg-[#e07f28] text-white active:scale-95'
                      }`}
                    >
                      -
                    </button>
                    <div className="w-8 h-7 flex items-center justify-center border border-gray-200 rounded text-xs font-bold text-gray-800 bg-white">
                      {parseQty(item.quantity)}
                    </div>
                    <button
                      onClick={() => handleQuantityChange(item._id || item.id || item.name, 1)}
                      disabled={typeof item.stock === 'number' && parseQty(item.quantity) >= item.stock}
                      title={typeof item.stock === 'number' && parseQty(item.quantity) >= item.stock ? `Max stock (${item.stock}) reached` : 'Increase quantity'}
                      className={`w-7 h-7 rounded font-bold text-base flex items-center justify-center transition-colors shadow-sm ${
                        typeof item.stock === 'number' && parseQty(item.quantity) >= item.stock
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[#FA9132] hover:bg-[#e07f28] text-white active:scale-95'
                      }`}
                    >
                      +
                    </button>
                  </div>

                  {/* Line Price */}
                  <span className="text-sm md:text-base font-extrabold text-[#FA9132] min-w-[70px] text-right">
                    Rs. {(parsePrice(item.price) * parseQty(item.quantity)).toLocaleString()}
                  </span>

                  {/* Individual Buy Now Button */}
                  <button
                    onClick={() => handleBuySingleItem(item)}
                    className="px-3.5 py-2 rounded-lg bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold text-xs transition-colors shadow-sm active:scale-95 whitespace-nowrap"
                    title="Buy only this item"
                  >
                    Buy Now
                  </button>

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
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-500 shadow-sm border border-gray-100">
              Your shopping cart is empty.
            </div>
          )}
        </div>

        {/* Order Summary Card - Centered */}
        <div className="w-full max-w-[520px] mx-auto bg-white rounded-[28px] p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-extrabold text-[#FA9132]">
              Order Summary
            </h2>
            <span className="text-xs font-bold text-gray-500 bg-orange-50 px-3 py-1 rounded-full">
              {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          {/* Pricing Breakdown */}
          <div className="flex flex-col gap-3.5 text-xs md:text-sm mb-4">
            <div className="flex justify-between items-center text-gray-700 font-medium">
              <span>Subtotal</span>
              <span>Rs. {displaySubtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-gray-700 font-medium">
              <span>Delivery</span>
              <span>{activeDeliveryFee > 0 ? `Rs. ${activeDeliveryFee.toLocaleString()}` : 'Free'}</span>
            </div>
          </div>

          <div className="border-t border-gray-300 my-4"></div>

          {/* Total Row */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl md:text-2xl font-extrabold text-gray-900">
              Total
            </span>
            <span className="text-xl md:text-2xl font-extrabold text-[#FA9132]">
              Rs. {displayTotal.toLocaleString()}
            </span>
          </div>

          {/* Proceed to Checkout Button */}
          <button
            onClick={handleProceedToCheckout}
            disabled={selectedItems.length === 0}
            className={`w-full font-extrabold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-95 mb-4 ${
              selectedItems.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                : 'bg-[#FA9132] hover:bg-[#e07f28] text-white'
            }`}
          >
            {selectedItems.length > 0
              ? `Proceed to Checkout (${selectedItems.length} ${selectedItems.length === 1 ? 'Item' : 'Items'})`
              : 'Select Items to Checkout'}
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
