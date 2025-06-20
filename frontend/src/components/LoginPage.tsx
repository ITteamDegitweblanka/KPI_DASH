import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_TITLE } from '../../constants';
import { UserCircleIcon, ChartBarIcon, EyeIcon, EyeSlashIcon } from './icons/Icons';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { login, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      // Check for redirect path in location.state or localStorage
      let redirectPath = null;
      if (window.history.state && window.history.state.usr && window.history.state.usr.from) {
        redirectPath = window.history.state.usr.from;
      } else {
        redirectPath = localStorage.getItem('postLoginRedirect');
      }
      if (redirectPath) {
        localStorage.removeItem('postLoginRedirect');
        navigate(redirectPath, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Attempting login...');
      await login({ email, password });
      // Do NOT navigate here! Let the useEffect handle it.
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Set user-friendly error message
      if (err.message.includes('Network Error')) {
        setError('Cannot connect to the server. Please check your internet connection.');
      } else if (err.message.includes('timeout')) {
        setError('Request timed out. Please try again.');
      } else {
        // Use the error message from the server or a default one
        setError(err.message || 'Login failed. Please check your credentials and try again.');
      }
      
      // Clear password field on error for security
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-gray-900 p-4">
      <div className="flex w-full max-w-4xl bg-white dark:bg-gray-800 shadow-2xl rounded-xl overflow-hidden">
        {/* Left Panel - Illustration and Title */}
        <div className="w-1/2 bg-[#FFF5F5] dark:bg-red-900/20 p-12 hidden md:flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-red-600 dark:text-red-400 mb-8">{APP_TITLE}</h1>
          <ChartBarIcon className="w-64 h-64 text-red-400 dark:text-red-500 opacity-75" />
          <p className="mt-8 text-center text-red-700 dark:text-red-300 opacity-90">
            Unlock insights and drive performance with {APP_TITLE}.
          </p>
        </div>
        {/* Right Panel - Login Form */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="text-center mb-8">
            <UserCircleIcon className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-3" />
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Log in</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Enter your email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500 outline-none transition-colors text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                aria-label="Email address"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                Enter your Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500 outline-none transition-colors text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                  aria-label="Password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 text-center" role="alert">
                {error}
              </p>
            )}
            <div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-red-500 dark:bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:outline-none transition-colors text-base"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
          <p className="mt-8 text-xs text-gray-500 dark:text-gray-400 text-center">
            &copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
