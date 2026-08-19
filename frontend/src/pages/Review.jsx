import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className={`text-3xl transition-transform hover:scale-110 focus:outline-none ${
          star <= value ? 'text-[#FA9132]' : 'text-gray-300'
        }`}
      >
        ★
      </button>
    ))}
  </div>
);

const Review = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [state, setState] = useState('loading'); // loading | form | success | error | already_reviewed
  const [errorMsg, setErrorMsg] = useState('');
  const [orderData, setOrderData] = useState(null);

  // ratings and comments keyed by productId
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('No review token found in the link. Please use the link from your delivery email.');
      setState('error');
      return;
    }

    fetch(`http://localhost:5001/api/reviews/order-info?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 409) {
          setState('already_reviewed');
          return;
        }
        if (!res.ok) {
          setErrorMsg(data.message || 'Invalid or expired review link.');
          setState('error');
          return;
        }
        setOrderData(data);
        // Initialise ratings to 5 for each item
        const initRatings = {};
        const initComments = {};
        data.items.forEach((item) => {
          const key = item.productId || item.name;
          initRatings[key] = 5;
          initComments[key] = '';
        });
        setRatings(initRatings);
        setComments(initComments);
        setState('form');
      })
      .catch(() => {
        setErrorMsg('Could not connect to the server. Please try again later.');
        setState('error');
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderData) return;
    setSubmitting(true);

    const reviews = orderData.items.map((item) => {
      const key = item.productId || item.name;
      return {
        productId:   item.productId || 'unknown',
        productName: item.name,
        rating:      ratings[key] || 5,
        comment:     comments[key] || '',
      };
    });

    try {
      const res = await fetch('http://localhost:5001/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reviews }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.message || 'Failed to submit review.');
        setState('error');
        return;
      }
      setState('success');
    } catch {
      setErrorMsg('Could not connect to the server. Please try again later.');
      setState('error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── Screens ─────────────────────────────────────────────────────────── */

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🐾</div>
          <p className="text-gray-500 text-sm">Loading your review form…</p>
        </div>
      </div>
    );
  }

  if (state === 'already_reviewed') {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😊</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Already Reviewed!</h2>
          <p className="text-gray-500 text-sm mb-6">You have already submitted a review for this order. Thank you!</p>
          <Link to="/store" className="inline-block bg-[#FA9132] text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#e07f28] transition-colors">
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
          <Link to="/store" className="inline-block bg-[#FA9132] text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#e07f28] transition-colors">
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-[#FFF8F3] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-500 text-sm mb-2">Your review has been submitted successfully.</p>
          <p className="text-gray-400 text-xs mb-8">It will now appear on the product page in our store.</p>
          <Link
            to="/store"
            className="inline-block bg-[#FA9132] text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-[#e07f28] transition-colors"
          >
            Browse the Store
          </Link>
        </div>
      </div>
    );
  }

  /* ─── Review Form ─────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#FFF8F3] py-12 px-4 font-sans">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐾</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Leave a Review</h1>
          <p className="text-gray-500 text-sm mt-1">
            Hi <strong>{orderData?.customerName}</strong>! How did we do?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {orderData?.items.map((item) => {
            const key = item.productId || item.name;
            return (
              <div
                key={key}
                className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100"
              >
                <h3 className="font-bold text-gray-900 text-base mb-1">{item.name}</h3>
                <p className="text-gray-400 text-xs mb-4">Qty: {item.quantity}</p>

                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                  Your Rating
                </label>
                <StarRating
                  value={ratings[key] || 5}
                  onChange={(val) => setRatings((prev) => ({ ...prev, [key]: val }))}
                />

                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mt-4 mb-2">
                  Your Comment <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={comments[key] || ''}
                  onChange={(e) =>
                    setComments((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder="Tell us what you thought about this product…"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132] resize-none"
                />
              </div>
            );
          })}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold py-4 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : '⭐ Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Review;
