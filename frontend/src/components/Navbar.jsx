import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isStorePage = location.pathname === '/store' || location.pathname === '/cart';

  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleAuthChange = () => checkAuth();
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setDropdownOpen(false);
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    `font-inria text-[16px] px-2 transition-colors duration-200 ${
      isActive ? 'text-[#FA9132] font-semibold' : 'text-[#4A4A4A] hover:text-[#FA9132] font-normal'
    }`;

  const displayName = user?.fullName || user?.username || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <nav className="bg-[#F8F8F8] h-[75px] w-full flex items-center relative z-40 border-b border-gray-100/80">
      <div className="w-full max-w-[1360px] mx-auto px-4 md:px-8 lg:px-12 flex items-center justify-between relative h-full">
        {/* Logo Section - Left Upper */}
        <div className="flex items-center h-full">
          <NavLink to="/" className="flex items-center">
            <Logo className="h-14 md:h-16" />
          </NavLink>
        </div>

        {/* Centered Navigation Links */}
        <div className="hidden md:flex items-center gap-12 absolute left-1/2 transform -translate-x-1/2">
          <NavLink to="/store" className={linkClass}>Store</NavLink>
          <NavLink to="/about" className={linkClass}>About Us</NavLink>
          <NavLink to="/contact" className={linkClass}>Contact Us</NavLink>
        </div>

        {/* Auth & Cart Links */}
        <div className="flex items-center gap-4 md:gap-6">
          {isStorePage && (
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `flex items-center gap-1.5 text-[16px] transition-colors ${
                  isActive ? 'text-[#FA9132] font-semibold' : 'text-[#FA9132] hover:text-[#d3721c] font-normal'
                }`
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span>Cart</span>
            </NavLink>
          )}

          {user ? (
            /* Logged In Profile Menu */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 bg-orange-50/80 hover:bg-orange-100/80 border border-orange-200/60 text-gray-800 font-semibold px-3 py-1.5 rounded-full transition-all duration-200 shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#FA9132] text-white flex items-center justify-center font-bold text-sm shadow-inner">
                  {initial}
                </div>
                <span className="text-xs md:text-sm font-bold text-gray-800 max-w-[120px] truncate">
                  {displayName}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-gray-100 bg-orange-50/30">
                    <p className="text-xs font-semibold text-gray-400">Signed in as</p>
                    <p className="text-sm font-extrabold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>

                  <div className="py-1">
                    <NavLink
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FA9132] font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#FA9132]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </NavLink>

                    <NavLink
                      to="/detect"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FA9132] font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#FA9132]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Disease Detection
                    </NavLink>

                    <NavLink
                      to="/store"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FA9132] font-semibold transition-colors"
                    >
                      <svg className="w-4 h-4 text-[#FA9132]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Medicine Store
                    </NavLink>
                  </div>

                  <div className="border-t border-gray-100 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs md:text-sm text-red-600 hover:bg-red-50 font-bold transition-colors text-left"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged Out - Show Sign In / Sign Up */
            <>
              <NavLink 
                to="/login" 
                className={({ isActive }) =>
                  `font-inria text-[16px] transition-colors ${
                    isActive ? 'text-[#FA9132] font-semibold' : 'text-[#FA9132] hover:text-[#d3721c] font-normal'
                  }`
                }
              >
                Sign In
              </NavLink>

              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `font-inria text-[16px] transition-colors ${
                    isActive ? 'text-[#FA9132] font-semibold' : 'text-[#FA9132] hover:text-[#d3721c] font-normal'
                  }`
                }
              >
                Sign Up
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
