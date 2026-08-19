import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import bannerBg from '../assets/store_banner.png';


const Store = () => {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState('');
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/items');
        if (response.ok) {
          const data = await response.json();
          // Map backend item fields to match frontend expectations (image -> imageUrl)
          const formattedData = data.map((item, idx) => ({
            id: item._id,
            itemId: item.itemId || `ITM_${String(idx).padStart(3, '0')}`,
            name: item.name,
            description: item.description,
            price: `Rs. ${item.price}`,
            image: item.imageUrl || '',
            category: item.category,
            stock: item.stock !== undefined ? item.stock : 10
          }));
          setProducts(formattedData);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Failed to fetch products from backend:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Enforce Sign In before purchasing
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token && !user) {
      setToastMessage('Please Sign In to purchase items!');
      setTimeout(() => {
        navigate('/login');
      }, 1000);
      return;
    }

    if (item.stock <= 0) return; // Prevent adding out of stock items
    
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = cart.findIndex((i) => (i._id && item._id && i._id === item._id) || i.id === item.id || i.name === item.name);
    const numericPrice = parseFloat(item.price.toString().replace(/[^0-9.-]+/g,"")) || 0;
    
    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        _id: item._id,
        id: item.id,
        productId: item._id || item.id,
        name: item.name,
        category: item.category || 'General',
        price: numericPrice,
        image: item.imageUrl || item.image,
        quantity: 1
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));

    let userEmail = '';
    if (user) {
      try { userEmail = JSON.parse(user).email; } catch(e) {}
    }

    if (userEmail) {
      fetch('http://localhost:5001/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          item: {
            _id: item._id || item.id,
            name: item.name,
            price: numericPrice,
            quantity: 1,
            image: item.imageUrl || item.image || '',
            description: item.description || ''
          }
        })
      }).catch(err => console.error('Error saving cart to DB:', err));
    }

    setToastMessage(`Added ${item.name} to cart!`);
    setTimeout(() => {
      navigate('/cart');
    }, 800);
  };

  const filteredProducts = products.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.itemId && item.itemId.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col items-center py-6 px-4">
      
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#FA9132] text-white px-6 py-3 rounded-xl shadow-lg font-medium text-sm transition-all duration-300">
          {toastMessage}
        </div>
      )}

      
      <section className="w-full max-w-[1240px] mb-10">
        <div
          className="w-full min-h-[280px] md:min-h-[320px] rounded-[32px] relative flex flex-col justify-center px-8 md:px-16 py-8 shadow-sm overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: `url(${bannerBg})` }}
        >
        
          <div className="absolute inset-0 bg-gradient-to-r from-orange-200/60 via-orange-100/30 to-transparent z-0"></div>

          <div className="relative z-10 max-w-[460px]">
            <h1 className="text-3xl md:text-4xl lg:text-[40px] font-extrabold text-gray-900 mb-3 tracking-tight">
              Doggocare Store
            </h1>
            <p className="text-gray-800 text-xs md:text-sm font-medium leading-relaxed">
              Your trusted source for all your dog's healthcare needs.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Header Section */}
      <section className="w-full max-w-[1240px] mb-8">
        <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          

          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FA9132] text-base" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 focus:outline-none focus:border-[#FA9132] focus:ring-2 focus:ring-[#FA9132]/20 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm p-1 rounded-full hover:bg-gray-100 transition"
              >
                <FiX />
              </button>
            )}
          </div>
        </div>
      </section>

      {/*============================== Products Grid ======================================*/}
      <section className="w-full max-w-[1240px] mb-16">
        {loading ? (
          <div className="flex justify-center w-full py-20 text-gray-400 font-medium text-xs">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 w-full flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-[#FA9132] flex items-center justify-center text-xl mb-3">
              <FiSearch />
            </div>
            <h3 className="font-bold text-gray-800 text-base mb-1">No products found</h3>
            <p className="text-xs text-gray-400 mb-4 max-w-md">
              We couldn't find any products matching "{searchQuery}". Try searching with a different keyword.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="bg-[#FA9132] hover:bg-[#e07f28] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full">
            {filteredProducts.map((item, index) => (
              <Link
                key={index}
                to={`/product/${item.id}`}
                className="bg-white rounded-2xl md:rounded-[24px] border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden p-6 flex flex-col hover:shadow-md transition-shadow cursor-pointer block relative"
              >
                {item.stock <= 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10 uppercase">
                    Out of Stock
                  </div>
                )}
                {/* =================Product Image Container================================================ */}
                <div className="w-full h-[190px] flex items-center justify-center bg-white rounded-xl mb-4 overflow-hidden p-2">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* ==================Title & Description=========================== */}
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">
                  {item.name}
                </h3>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                  {item.description}
                </p>

                {/* ======================Price & Action Row================================== */}
                <div className="flex items-center justify-between mt-auto pt-2">
                  <span className="text-[#FA9132] font-extrabold text-lg md:text-xl">
                    {item.price}
                  </span>
                  <button
                    disabled={item.stock <= 0}
                    onClick={(e) => handleAddToCart(e, item)}
                    className={`px-6 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all shadow-sm active:scale-95 ${item.stock <= 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#FA9132] hover:bg-[#e07f28] text-white'}`}
                  >
                    {item.stock <= 0 ? 'Sold Out' : 'Add Cart'}
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Store;

