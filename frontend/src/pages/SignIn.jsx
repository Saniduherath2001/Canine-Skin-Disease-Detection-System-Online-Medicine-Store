import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setSuccess('Login successful!');
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('authChange'));
      }
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-100px)] bg-white flex items-center justify-center py-12 px-4 font-sans">
      <div className="w-full max-w-[880px] bg-white rounded-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] overflow-hidden grid grid-cols-1 md:grid-cols-5 min-h-[460px]">

        {/* Left Orange Panel */}
        <div className="md:col-span-2 bg-[#FA9132] p-8 md:p-12 flex flex-col justify-center items-center text-center text-white relative">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4 leading-tight">
            Welcome Back!
          </h2>
          <p className="text-white/90 text-xs md:text-sm font-normal leading-relaxed max-w-[240px]">
            Sign in to access your DoggoCare account, disease detection history, and pet care resources.
          </p>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-3 bg-[#FAFAFA] p-8 md:p-10 flex flex-col justify-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FA9132] mb-1">
            Sign In
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mb-6">
            Enter your credentials to access your account.
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FA9132] bg-white text-sm text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-900">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-[#FA9132] hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#FA9132] bg-white text-sm text-gray-800 placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#FA9132] hover:bg-[#e07f28] text-white font-bold py-3 rounded-xl transition-colors shadow-sm text-sm mt-3"
            >
              Sign In
            </button>

            <p className="text-center text-xs md:text-sm text-gray-600 mt-3">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-[#FA9132] hover:underline">
                Sign Up
              </Link>
            </p>
            <p className="text-center text-xs md:text-sm text-gray-600 mt-3">
              Are you an Admin?{' '}
              <Link to="/admin/login" className="font-bold text-[#FA9132] hover:underline">
                Click here to Login
              </Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  );
};

export default SignIn;

