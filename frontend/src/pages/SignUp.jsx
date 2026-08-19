import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [step, setStep] = useState(1); // 1: Info Form, 2: OTP Verification
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone: digitsOnly });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Step 1: Submit info and request OTP code
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits (e.g. 0771234567)');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/send-register-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setSuccess('Verification code sent to your email!');
      if (data.devCode) {
        setDevCode(data.devCode);
        setOtpCode(data.devCode);
      }
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP code & Complete Registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          code: otpCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Account verified and created successfully! Redirecting...');
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('authChange'));
      }
      setTimeout(() => {
        navigate('/detect');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] bg-white flex items-center justify-center py-12 px-4 font-sans">
      <div className="w-full max-w-[920px] bg-white rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden grid grid-cols-1 md:grid-cols-5 min-h-[540px]">
        
        {/* Left Orange Panel */}
        <div className="md:col-span-2 bg-[#FA9132] p-8 md:p-12 flex flex-col justify-center items-center text-center text-white relative">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight">
            Welcome to<br />DoggoCare
          </h2>
          <p className="text-white/90 text-xs md:text-sm font-normal leading-relaxed max-w-[240px]">
            {step === 1
              ? 'Create your account to explore dog disease detection, medicine recommendations, and veterinary care resources.'
              : `We sent a 6-digit verification code to ${formData.email}.`}
          </p>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-3 bg-[#FAFAFA] p-8 md:p-10 flex flex-col justify-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FA9132] mb-1">
            {step === 1 ? 'Create Account' : 'Verify Your Email'}
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mb-6">
            {step === 1
              ? 'Fill in your details below to get started.'
              : 'Enter the 6-digit OTP verification code.'}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl mb-4 font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded-xl mb-4 font-semibold">
              {success}
            </div>
          )}

          {devCode && step === 2 && (
            <div className="bg-orange-50 border border-orange-200 text-orange-800 text-xs p-3 rounded-xl mb-4 font-mono">
              ⚡ Dev Mode Code: <strong>{devCode}</strong>
            </div>
          )}

          {/* STEP 1: Registration Form */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FA9132] bg-white text-sm text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FA9132] bg-white text-sm text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FA9132] bg-white text-sm text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min 8 chars, 1 uppercase, 1 symbol)"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FA9132] bg-white text-sm text-gray-800 placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FA9132] bg-white text-sm text-gray-800 placeholder-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm mt-2 flex items-center justify-center gap-2"
              >
                {loading ? 'Sending Verification Code...' : 'Get Verification Code'}
              </button>

              <p className="text-center text-xs md:text-sm text-gray-600 mt-2">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#FA9132] hover:underline">
                  Sign In
                </Link>
              </p>
            </form>
          )}

          {/* STEP 2: OTP Verification Form */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndRegister} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  Enter 6-Digit Email Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 123456"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FA9132] bg-white text-center text-xl font-bold tracking-widest text-gray-800"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying & Creating...' : 'Verify & Create Account'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default SignUp;


