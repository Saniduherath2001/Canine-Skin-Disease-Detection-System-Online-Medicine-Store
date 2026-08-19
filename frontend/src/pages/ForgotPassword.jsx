import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState('');
  const navigate = useNavigate();

  // Step 1: Send Code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset code');

      setSuccess('Verification code sent! Please check your email inbox.');
      if (data.devCode) {
        setDevCode(data.devCode);
        setCode(data.devCode);
      }
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');

      setSuccess('Code verified! Please enter your new password.');
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password reset failed');

      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] bg-white flex items-center justify-center py-12 px-4 font-sans">
      <div className="w-full max-w-[840px] bg-white rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden grid grid-cols-1 md:grid-cols-5 min-h-[380px]">
        
        {/* Left Orange Panel */}
        <div className="md:col-span-2 bg-[#FA9132] p-8 md:p-10 flex flex-col justify-center items-center text-center text-white relative">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight">
            Forgot<br />Password?
          </h2>
          <p className="text-white/90 text-xs md:text-sm font-normal leading-relaxed max-w-[240px]">
            {step === 1 && "Don't worry! Enter your registered email address to receive a 6-digit verification code."}
            {step === 2 && 'Enter the 6-digit verification code sent to your email.'}
            {step === 3 && 'Create a strong new password for your account.'}
          </p>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-3 bg-[#FAFAFA] p-8 md:p-10 flex flex-col justify-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FA9132] mb-1">
            {step === 1 && 'Reset Password'}
            {step === 2 && 'Enter Code'}
            {step === 3 && 'New Password'}
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mb-6">
            {step === 1 && 'Enter your registered email address below.'}
            {step === 2 && `Enter the code sent to ${email}`}
            {step === 3 && 'Set a new password for your account.'}
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

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FA9132] bg-white text-sm text-gray-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm mt-3 flex items-center justify-center gap-2"
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>

              <p className="text-center text-xs md:text-sm text-gray-600 mt-3">
                Remember your password?{' '}
                <Link to="/login" className="font-bold text-[#FA9132] hover:underline">
                  Sign In
                </Link>
              </p>
            </form>
          )}

          {/* STEP 2: Enter Code */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. 123456"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FA9132] bg-white text-center text-lg font-bold tracking-widest text-gray-800"
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
                  className="w-2/3 bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FA9132] bg-white text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FA9132] bg-white text-sm text-gray-800"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm mt-3 flex items-center justify-center gap-2"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;

