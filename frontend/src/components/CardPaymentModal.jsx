import React, { useState, useEffect } from 'react';
import { FiLock, FiCheckCircle, FiX, FiCreditCard } from 'react-icons/fi';

// Official Stripe test cards that must be declined with realistic bank errors
const STRIPE_DECLINED_CARDS = {
  '4000000000000002': 'Your card was declined.',
  '4000000000009995': 'Your card has insufficient funds.',
  '4000000000000341': 'Your card was declined due to suspected fraud.',
  '4000000000000069': 'Your card has expired.',
  '4000000000000127': "Your card's security code (CVV) is incorrect.",
  '4000000000000119': 'An error occurred while processing your card. Try again.',
  '4000000000000077': 'Your card was declined (lost card).',
  '4000000000000085': 'Your card was declined (stolen card).',
};

// Standard Luhn (Mod-10) algorithm used by all real credit/debit cards and Stripe test cards
const isValidLuhn = (digits) => {
  if (!/^\d+$/.test(digits)) return false;
  if (/^(\d)\1+$/.test(digits)) return false; // Reject repeated digits like 0000... or 4444...

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

// Detect valid card network brand and required length/CVV
const detectCardBrand = (digits) => {
  if (/^4/.test(digits)) {
    return { name: 'VISA', length: 16, cvvLength: 3 };
  }
  if (/^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)/.test(digits)) {
    return { name: 'MASTERCARD', length: 16, cvvLength: 3 };
  }
  if (/^3[47]/.test(digits)) {
    return { name: 'AMEX', length: 15, cvvLength: 4 };
  }
  if (/^(6011|65|64[4-9])/.test(digits)) {
    return { name: 'DISCOVER', length: 16, cvvLength: 3 };
  }
  return null;
};

const CardPaymentModal = ({ isOpen, onClose, amount, orderData, onPaymentSuccess }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(
    orderData?.customerInfo ? `${orderData.customerInfo.firstName} ${orderData.customerInfo.lastName}`.trim() : ''
  );
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  // Reset transient modal state whenever opened & prefill saved profile card details if present
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setError('');
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        const savedCard = storedUser?.cardDetails;
        if (savedCard) {
          if (!cardHolder && savedCard.cardHolderName) setCardHolder(savedCard.cardHolderName);
          if (!cardNumber && savedCard.cardNumber) setCardNumber(savedCard.cardNumber);
          if (!expiry && savedCard.expiryDate) setExpiry(savedCard.expiryDate);
        }
      } catch (e) { }
      if (!cardHolder && orderData?.customerInfo) {
        setCardHolder(`${orderData.customerInfo.firstName || ''} ${orderData.customerInfo.lastName || ''}`.trim());
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cleanCardPreview = cardNumber.replace(/\s/g, '');
  const detectedBrand = detectCardBrand(cleanCardPreview);
  const expectedCvvLen = detectedBrand?.cvvLength || 3;

  // Format Card Number (Amex 4-6-5, others 4-4-4-4)
  const handleCardNumberChange = (e) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    const isAmex = /^3[47]/.test(rawDigits);
    const maxLen = isAmex ? 15 : 16;
    const raw = rawDigits.substring(0, maxLen);

    let formatted = raw;
    if (isAmex) {
      if (raw.length > 10) {
        formatted = `${raw.substring(0, 4)} ${raw.substring(4, 10)} ${raw.substring(10)}`;
      } else if (raw.length > 4) {
        formatted = `${raw.substring(0, 4)} ${raw.substring(4)}`;
      }
    } else {
      formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    setCardNumber(formatted);
    setError('');
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (raw.length > 2) {
      raw = `${raw.substring(0, 2)}/${raw.substring(2)}`;
    }
    setExpiry(raw);
    setError('');
  };

  // Format CVV (4 digits for Amex, 3 for others)
  const handleCvvChange = (e) => {
    setCvv(e.target.value.replace(/\D/g, '').substring(0, expectedCvvLen));
    setError('');
  };

  // One-click autofill with Stripe official test card
  const handleAutofill = () => {
    const futureYear = String((new Date().getFullYear() + 2) % 100).padStart(2, '0');
    setCardNumber('4242 4242 4242 4242');
    setExpiry(`12/${futureYear}`);
    setCvv('424');
    if (!cardHolder) setCardHolder('Test Customer');
    setError('');
  };

  const handlePay = async (e) => {
    e.preventDefault();

    // 1. Validate Cardholder Name
    const trimmedName = cardHolder.trim();
    if (!/^[A-Za-z][A-Za-z\s.'-]{1,60}$/.test(trimmedName)) {
      setError('Please enter a valid cardholder name (letters only).');
      return;
    }

    // 2. Validate Card Network & Length
    const cleanCard = cardNumber.replace(/\s/g, '');
    const brand = detectCardBrand(cleanCard);
    if (!brand) {
      setError('Invalid card number. Only valid Visa, Mastercard, Amex, Discover, or Stripe test cards are accepted.');
      return;
    }
    if (cleanCard.length !== brand.length) {
      setError(`${brand.name} card numbers must be exactly ${brand.length} digits.`);
      return;
    }

    // 3. Reject Official Stripe Declined Test Cards
    if (STRIPE_DECLINED_CARDS[cleanCard]) {
      setError(STRIPE_DECLINED_CARDS[cleanCard]);
      return;
    }

    // 4. Strict Luhn Checksum Validation
    if (!isValidLuhn(cleanCard)) {
      setError('Your card number is invalid. Please check the digits and try again.');
      return;
    }

    // 5. Strict Expiry Date Validation (MM/YY, Month 01-12, Not Expired)
    const expMatch = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
    if (!expMatch) {
      setError('Please enter a valid expiry date in MM/YY format (month 01–12).');
      return;
    }
    const expMonth = parseInt(expMatch[1], 10);
    const expYear = 2000 + parseInt(expMatch[2], 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      setError("Your card's expiration date is in the past. Please use an active card.");
      return;
    }
    if (expYear > currentYear + 20) {
      setError('Please enter a valid card expiration year.');
      return;
    }

    // 6. Strict CVV / CVC Validation
    if (cvv.length !== brand.cvvLength || /^0+$/.test(cvv)) {
      setError(`Please enter a valid ${brand.cvvLength}-digit CVV/CVC security code.`);
      return;
    }

    setError('');
    setStatus('processing');
    setStatusMessage('Connecting to Secure Payment Network...');

    // Simulate realistic 3D Secure Bank processing steps
    setTimeout(() => {
      setStatusMessage('Verifying Card with Bank...');
    }, 1000);

    setTimeout(() => {
      setStatusMessage('Authorizing Transaction...');
    }, 2000);

    setTimeout(async () => {
      setStatus('success');
      setStatusMessage('Payment Authorized Successfully! 🎉');

      setTimeout(async () => {
        await onPaymentSuccess();
      }, 1200);
    }, 3000);
  };

  const brandLabel = detectedBrand ? detectedBrand.name : 'CARD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col transition-all">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[#FA9132]">
              <FiLock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm">Secure Payment Gateway</h3>
              <p className="text-[11px] text-gray-400">256-Bit SSL Encrypted Transaction</p>
            </div>
          </div>
          {status === 'idle' && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {status === 'idle' && (
            <>
              {/* Virtual Card Preview */}
              <div className="w-full h-44 rounded-2xl bg-gradient-to-tr from-gray-900 via-slate-800 to-zinc-900 p-5 text-white flex flex-col justify-between shadow-lg relative overflow-hidden mb-5">
                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="w-9 h-7 rounded-md bg-amber-400/80 flex items-center justify-center shadow-inner">
                    <div className="w-6 h-4 border border-amber-600/40 rounded-sm" />
                  </div>
                  <span className="font-extrabold tracking-wider text-xs uppercase text-gray-300">
                    {brandLabel}
                  </span>
                </div>
                <div className="font-mono text-base md:text-lg tracking-widest text-gray-100">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-300">
                  <div>
                    <span className="block text-[9px] uppercase text-gray-400">Cardholder</span>
                    <span className="font-bold tracking-wider truncate max-w-[170px] block">
                      {cardHolder || 'CARDHOLDER NAME'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-gray-400">Expires</span>
                    <span className="font-mono font-bold tracking-wider">{expiry || 'MM/YY'}</span>
                  </div>
                </div>
              </div>

              {/* Amount Display & Autofill Helper */}
              <div className="flex items-center justify-between mb-4 bg-orange-50/60 p-3 rounded-xl border border-orange-100">
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 block">Total Payable:</span>
                  <span className="text-base font-extrabold text-[#FA9132]">
                    Rs. {Number(amount || 0).toLocaleString()}
                  </span>
                </div>
               
              </div>

              {error && (
                <div className="mb-4 p-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold text-center">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handlePay} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="Enter name on card"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Card Number</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4242 4242 4242 4242"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
                    />
                    <FiCreditCard className="absolute right-3 text-gray-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">CVV / CVC</label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={handleCvvChange}
                      placeholder={expectedCvvLen === 4 ? '••••' : '•••'}
                      maxLength={expectedCvvLen}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FA9132]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/3 py-3 border border-gray-200 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3 bg-[#FA9132] hover:bg-[#e07d24] text-white rounded-xl font-bold text-xs transition shadow-md shadow-orange-200 flex items-center justify-center gap-1.5"
                  >
                    <FiLock className="w-3.5 h-3.5" />
                    Pay Rs. {Number(amount || 0).toLocaleString()}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Processing / Success State */}
          {status !== 'idle' && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              {status === 'processing' ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-orange-200 border-t-[#FA9132] rounded-full animate-spin mb-6" />
                  <h4 className="font-extrabold text-gray-900 text-base mb-1">Processing Payment</h4>
                  <p className="text-xs text-gray-500 animate-pulse">{statusMessage}</p>
                  <div className="mt-6 flex items-center gap-1 text-[11px] text-gray-400">
                    <FiLock className="w-3 h-3 text-green-500" /> Secure 3D Bank Authorization
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-4 shadow-inner">
                    <FiCheckCircle className="w-10 h-10" />
                  </div>
                  <h4 className="font-extrabold text-gray-900 text-lg mb-1">Payment Successful!</h4>
                  <p className="text-xs text-gray-500">{statusMessage}</p>
                  <p className="text-[11px] text-gray-400 mt-3">Finalizing your order...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardPaymentModal;
