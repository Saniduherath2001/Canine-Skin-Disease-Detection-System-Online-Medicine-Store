import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';


const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState('5');
  const [name, setName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        // Try fetching from database if it looks like a MongoDB ObjectId (24 hex chars)
        // or otherwise check if it fails, fallback to static products
        const response = await fetch(`http://localhost:5001/api/items/${id}`);
        if (response.ok) {
          const item = await response.json();
          const formatted = {
            id: item._id,
            itemId: item.itemId || `ITM_000`,
            name: item.name,
            description: item.description,
            price: `$${item.price}`,
            image: item.imageUrl || '',
            additionalImages: item.additionalImages || [],
            category: item.category,
            stock: item.stock !== undefined ? item.stock : 10,
            rating: 5,
            reviewsCount: 120,
            benefits: ['High quality pet care item.', 'Safe and veterinarian recommended.']
          };
          setProduct(formatted);
          setActiveImage(formatted.image);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  // Fetch real reviews for this product
  useEffect(() => {
    if (!id && !product) return;
    setReviewsLoading(true);

    const params = new URLSearchParams();
    if (id) params.append('productId', id);
    if (product?.id && product.id !== id) params.append('productId', product.id);
    if (product?.itemId) params.append('itemId', product.itemId);
    if (product?.name) params.append('name', product.name);

    fetch(`http://localhost:5001/api/reviews?${params.toString()}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setReviewsList(Array.isArray(data) ? data : []))
      .catch(() => setReviewsList([]))
      .finally(() => setReviewsLoading(false));
  }, [id, product?.id, product?.itemId, product?.name]);

  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleIncrease = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleAddToCart = async () => {
    if (!product) return;

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

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = cart.findIndex(
      (i) => (i._id && product.id && i._id === product.id) || i.id === product.id || i.name === product.name
    );
    const numericPrice = parseFloat(product.price.toString().replace(/[^0-9.-]+/g, '')) || 0;

    if (existingIndex > -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        _id: product.id,
        id: product.id,
        productId: product.id,
        name: product.name,
        category: product.category || 'General',
        price: numericPrice,
        image: product.image,
        quantity: quantity,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    // Sync with MongoDB database cart if signed in
    let userEmail = '';
    if (user) {
      try {
        const u = JSON.parse(user);
        userEmail = u?.email || '';
      } catch (e) { }
    }

    if (userEmail) {
      try {
        await fetch('http://localhost:5001/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail,
            item: {
              _id: product.id,
              name: product.name,
              price: numericPrice,
              quantity: quantity,
              image: product.image || '',
              description: product.description || '',
            },
          }),
        });
      } catch (err) {
        console.error('Failed to sync DB cart:', err);
      }
    }

    showToast(`Added ${quantity} ${product.name} to cart!`);
    setTimeout(() => {
      navigate('/cart');
    }, 800);
  };

  const handleBuyNow = () => {
    showToast('Proceeding to checkout...');
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!name.trim() || !reviewText.trim()) {
      showToast('Please enter your name and review text!');
      return;
    }
    try {
      const res = await fetch('http://localhost:5001/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product?.id || product?._id || id || product?.itemId,
          productName: product?.name || 'Product Review',
          customerName: name,
          rating: Number(rating) || 5,
          comment: reviewText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast('Review submitted successfully!');
        setName('');
        setReviewText('');
        if (data.review) {
          setReviewsList((prev) => [data.review, ...prev]);
        }
      } else {
        showToast('Failed to submit review.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast('Error submitting review.');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  const renderStars = (num) => {
    return (
      <div className="flex text-[#FA9132] text-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i}>{i < Math.round(num) ? '★' : '☆'}</span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center font-sans text-gray-500">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center font-sans text-gray-500">
        Product not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col items-center py-10 px-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#FA9132] text-white px-6 py-3 rounded-xl shadow-lg font-medium text-sm transition-all duration-300">
          {toastMessage}
        </div>
      )}

      {/* 1. Main Product Card */}
      <div className="w-full max-w-[980px] bg-white rounded-[28px] md:rounded-[32px] p-6 md:p-10 shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-gray-100 mb-8 flex flex-col relative">
        {/* Close (Back to Store) Button */}
        <button
          onClick={() => navigate('/store')}
          title="Back to Store"
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-gray-100 hover:bg-[#FA9132] text-gray-500 hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm border border-gray-200/60 group z-10"
        >
          <FiX className="text-xl group-hover:scale-110 transition-transform" />
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
          {/* Product Image Frame with Gallery */}
          <div className="w-full md:w-1/2 flex flex-col items-center gap-4">
            <div className="w-full max-w-[340px] aspect-square bg-white rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-gray-100 flex items-center justify-center p-6">
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition-all duration-350"
              />
            </div>
            {/* Additional Images Gallery */}
            {((product.additionalImages && product.additionalImages.length > 0) || product.image) && (
              <div className="flex flex-wrap gap-2.5 justify-center mt-2">
                {/* Main image thumbnail */}
                {product.image && (
                  <button
                    onClick={() => setActiveImage(product.image)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 bg-white flex items-center justify-center p-1 transition ${activeImage === product.image ? 'border-[#FA9132] scale-105' : 'border-gray-200 opacity-70 hover:opacity-100'}`}
                  >
                    <img src={product.image} alt="thumbnail" className="max-h-full max-w-full object-contain" />
                  </button>
                )}
                {/* Additional image thumbnails */}
                {product.additionalImages && product.additionalImages.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 bg-white flex items-center justify-center p-1 transition ${activeImage === imgUrl ? 'border-[#FA9132] scale-105' : 'border-gray-200 opacity-70 hover:opacity-100'}`}
                  >
                    <img src={imgUrl} alt={`thumbnail-${index}`} className="max-h-full max-w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details Info */}
          <div className="w-full md:w-1/2 flex flex-col justify-start">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              {renderStars(product.rating || 5)}
              <span className="text-xs text-gray-500 font-medium">
                ({product.rating || 5}/5 | {product.reviewsCount || 100} Reviews)
              </span>
            </div>

            {/* Price */}
            <div className="text-2xl md:text-3xl font-extrabold text-[#FA9132] mb-2">
              {product.price}
            </div>

            {/* Stock */}
            <div className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${product.stock === 0 ? 'text-rose-500' :
              product.stock < 10 ? 'text-amber-500' :
                'text-emerald-600'
              }`}>
              {product.stock === 0 ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  Out of Stock
                </>
              ) : product.stock < 10 ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Low Stock ({product.stock} left)
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  In Stock ({product.stock} available)
                </>
              )}
            </div>

            {/* ==============================Item Code & Category ================================*/}
            <p className="text-xs text-gray-500 mb-6">

              Category : {product.category}
            </p>

            {/* ============================== Buttons ================================*/}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <button
                disabled={product.stock === 0}
                onClick={handleAddToCart}
                className="bg-[#FA9132] hover:bg-[#e07f28] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Add To Cart
              </button>

            </div>

            {/* ============================== Info Checklist ================================*/}
            <div className="flex flex-col gap-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span>🚚</span> Free Delivery
              </div>
              <div className="flex items-center gap-2">
                <span>🔒</span> Secure Payment
              </div>
              {product.stock > 0 && (
                <div className="flex items-center gap-2">
                  <span>🎁</span> {product.stock < 10 ? `Only ${product.stock} items left` : `${product.stock} items available`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================== Description Section ================================*/}
        <div className="mt-4 pt-6 border-t border-gray-100">
          <h2 className="text-lg md:text-xl font-bold text-[#FA9132] mb-2">
            Description
          </h2>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed mb-6">
            {product.description}
          </p>



        </div>
      </div>

      {/* 2. Customer Reviews Card */}
      <div className="w-full max-w-[980px] bg-white rounded-[28px] md:rounded-[32px] p-6 md:p-10 shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-gray-100 mb-8 flex flex-col">
        <h2 className="text-xl md:text-2xl font-bold text-[#FA9132] mb-6">
          Customer Reviews
        </h2>



        {reviewsLoading ? (
          <p className="text-gray-400 text-sm">Loading reviews…</p>
        ) : reviewsList.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-400 text-sm">No reviews yet for this product.</p>
            <p className="text-gray-300 text-xs mt-1">Be the first to leave a review above! 🐾</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {reviewsList.map((rev) => (
              <div key={rev._id || rev.id} className="flex flex-col border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
                <span className="font-bold text-gray-900 text-sm mb-1">
                  {rev.customerName || rev.author}
                </span>
                <div className="mb-2">{renderStars(rev.rating)}</div>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed italic">
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ProductDetails;
