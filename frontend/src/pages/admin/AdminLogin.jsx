import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login failed. Check your credentials.');
        return;
      }
      // Store admin token
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('adminToken', data.token);
      storage.setItem('adminEmail', data.admin.email);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ff7300] flex items-center justify-center p-4 font-sans select-none">
      <div className="bg-white rounded-[32px] shadow-2xl p-8 sm:p-12 w-full max-w-[480px] transition-all">
        {/* Header Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#ff7300] text-center mb-8 tracking-tight">
          DoggoCare Admin
        </h1>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Address */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Email Address
            </label>
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-[#ff7300] focus:ring-1 focus:ring-[#ff7300] pr-12 transition bg-white"
              />
              <FiMail className="absolute right-4 text-gray-400 text-xl pointer-events-none" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:border-[#ff7300] focus:ring-1 focus:ring-[#ff7300] pr-12 transition bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-gray-400 hover:text-gray-600 text-xl focus:outline-none transition"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between pt-1 text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-gray-700 font-medium select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#ff7300] focus:ring-[#ff7300] accent-[#ff7300] cursor-pointer"
              />
              <span>Remember Me</span>
            </label>

            <button
              type="button"
              onClick={() => alert('Password reset link sent to admin email.')}
              className="text-[#ff7300] font-semibold hover:underline text-sm focus:outline-none"
            >
              Forgot Password?
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff7300] hover:bg-[#e56700] active:bg-[#cc5b00] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition duration-200 flex items-center justify-center gap-2 text-base shadow-md hover:shadow-lg mt-4"
          >
            <FiLogIn className="text-xl stroke-[2.5]" />
            <span>{loading ? 'Logging in...' : 'Login'}</span>
          </button>
        </form>

        {/* Footer Text */}
        <p className="text-center text-xs text-gray-400 mt-10 font-normal">
          © 2026 DoggoCare Admin Panel
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
