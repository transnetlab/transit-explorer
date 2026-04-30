import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import { API_2_BASES } from '../config';
import { fetchWithFallback } from '../http';

export function SignIn() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const isGuest = (localStorage.getItem('isGuest') || 'false') === 'true';
    if (isAuthenticated && !isGuest) {
      navigate('/city-selection', { replace: true });
    }
  }, [navigate]);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const [showVerifyBanner, setShowVerifyBanner] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    const state = location.state as any;
    if (state?.showVerifyNotice) {
      setShowVerifyBanner(true);
      setVerifyEmail(state?.email);
      // clear the state so it doesn't persist if user navigates back
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const identifier = formData.username.trim();
      const isEmail = identifier.includes('@');

      // Build payloads
      const localPayload: any = { password: formData.password };
      if (isEmail) localPayload.email = identifier; else localPayload.username = identifier;

      const firebasePayload: any = isEmail ? { email: identifier, password: formData.password } : null;

      // Fire requests in parallel (Firebase optional if email provided)
      const localLoginPromise = fetchWithFallback(API_2_BASES, '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localPayload)
      });

      const firebaseLoginPromise = isEmail ? fetchWithFallback(API_2_BASES, '/api/auth/firebase/login-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firebasePayload)
      }) : null;

      const results = await Promise.allSettled([localLoginPromise, ...(firebaseLoginPromise ? [firebaseLoginPromise] : [])]);

      // Handle local login result first (must succeed)
      const localResult = results[0];
      if (localResult.status !== 'fulfilled') {
        throw new Error('Local login failed');
      }
      const localRes = localResult.value as Response;
      if (!localRes.ok) {
        let msg = 'Invalid credentials';
        try { const j = await localRes.json(); msg = j?.message || msg; } catch { const t = await localRes.text().catch(() => ''); msg = t || msg; }
        throw new Error(msg || 'Local login failed');
      }
      const localData = await localRes.json().catch(() => ({}));
      console.log('[Login] local response', localData);
      const localUser = localData?.data?.user || localData?.user || localData?.data;
      const localApiKey = (localData?.data?.api_key ?? localData?.api_key) as string | undefined;
      if (!localUser?.id || !localApiKey) {
        throw new Error('Login did not return required api_key or user id.');
      }

      // Persist from local login
      localStorage.setItem('userId', String(localUser.id));
      localStorage.setItem('user', JSON.stringify(localUser));
      localStorage.setItem('isAuthenticated', 'true');
      try { localStorage.removeItem('isGuest'); } catch {}
      if (localUser.username) localStorage.setItem('username', localUser.username);
      if (localUser.email) localStorage.setItem('email', localUser.email); else if (isEmail) localStorage.setItem('email', identifier);
      if (localUser.first_name) localStorage.setItem('first_name', localUser.first_name);
      if (localUser.last_name) localStorage.setItem('last_name', localUser.last_name);
      localStorage.setItem('api_key', localApiKey);
      const localToken = localData.token || localData.accessToken || localData.jwt;
      if (localToken) localStorage.setItem('authToken', localToken);

      // If Firebase login also ran, handle verification banner gracefully (do not block)
      if (firebaseLoginPromise) {
        const fbResult = results[1];
        if (fbResult.status === 'fulfilled') {
          const fbRes = fbResult.value as Response;
          if (!fbRes.ok) {
            try {
              const errJson = await fbRes.json();
              const message = errJson?.message || '';
              if (String(message).toLowerCase().includes('verify')) {
                setShowVerifyBanner(true);
                setVerifyEmail(identifier);
              }
            } catch {
              const text = await fbRes.text().catch(() => '');
              if (String(text).toLowerCase().includes('verify')) {
                setShowVerifyBanner(true);
                setVerifyEmail(identifier);
              }
            }
          } else {
            const fbData = await fbRes.json().catch(() => ({}));
            const fbUser = fbData?.data?.user || fbData?.user || fbData?.data;
            const verifiedFlag = (fbUser && (fbUser.email_verified ?? fbUser.emailVerified ?? fbUser.is_email_verified)) ?? (fbData?.emailVerified ?? fbData?.data?.emailVerified);
            let enforceVerification = false;
            try { const pendingEmail = localStorage.getItem('pendingEmail'); enforceVerification = Boolean(pendingEmail); } catch {}
            if (verifiedFlag === false && enforceVerification) {
              setShowVerifyBanner(true);
              setVerifyEmail(fbUser?.email || identifier);
            }
          }
        }
      }

      // Clear pendingEmail if present; login succeeded
      try { localStorage.removeItem('pendingEmail'); } catch {}
      navigate('/city-selection', { replace: true });
    } catch (err: any) {
      setErrors(prev => ({ ...prev, password: err?.message || 'Login failed' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setErrors({});
    try {
      const existingApiKey = localStorage.getItem('api_key');
      const res = await fetchWithFallback(API_2_BASES, '/api/auth/firebase/login-anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existingApiKey ? { api_key: existingApiKey } : {})
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => 'Guest login failed');
        throw new Error(txt || 'Guest login failed');
      }
      const data = await res.json().catch(() => ({}));
      console.log('[GuestLogin] raw response', data);
      const user = data?.data?.user || data?.user || data?.data;
      const apiKey = (data?.data?.api_key ?? data?.api_key) as string | undefined;
      // Mark as guest; limited capabilities (e.g., cannot add city)
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('isGuest', 'true');
      if (apiKey) localStorage.setItem('api_key', apiKey);
      if (user?.id) localStorage.setItem('userId', String(user.id));
      if (user?.username) localStorage.setItem('username', user.username);
      if (user?.first_name) localStorage.setItem('first_name', user.first_name);
      if (user?.last_name) localStorage.setItem('last_name', user.last_name);
      if (user?.email) localStorage.setItem('email', user.email);
      const token = data.token || data.accessToken || data.jwt;
      if (token) localStorage.setItem('authToken', token);
      navigate('/city-selection', { replace: true });
    } catch (err: any) {
      setErrors(prev => ({ ...prev, username: err?.message || 'Guest login failed' }));
    } finally {
      setGuestLoading(false);
    }
  };

  const openReset = () => {
    setResetError('');
    setResetSuccess('');
    // If user typed an email in username field, prefill
    if (formData.username.includes('@')) {
      setResetEmail(formData.username);
    }
    setShowResetModal(true);
  };

  const validateEmail = (email: string) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');
    if (!resetEmail.trim()) {
      setResetError('Email is required');
      return;
    }
    if (!validateEmail(resetEmail.trim())) {
      setResetError('Invalid email format');
      return;
    }
    setResetLoading(true);
    try {
      const existingApiKey = localStorage.getItem('api_key');
      const res = await fetchWithFallback(API_2_BASES, '/api/auth/firebase/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(existingApiKey ? { email: resetEmail.trim(), api_key: existingApiKey } : { email: resetEmail.trim() })
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => 'Failed to send reset email');
        throw new Error(msg || 'Failed to send reset email');
      }
      const data = await res.json().catch(() => ({}));
      console.log('[PasswordReset] raw response', data);
      setResetSuccess('Password reset email sent. Check your inbox.');
      setTimeout(() => {
        setShowResetModal(false);
      }, 1800);
    } catch (err: any) {
      setResetError(err?.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="relative text-center">
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Back to landing"
            className="absolute left-0 top-0 p-2 rounded-lg hover:bg-white/70 transition-colors"
          >
            <ArrowLeft size={22} className="text-blue-600" />
          </button>
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-600">Sign in to your Transit Explorer account</p>
        </div>

        {/* Verify email notice */}
        {showVerifyBanner && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-4 text-sm">
            <p className="font-medium">Verify your email</p>
            <p className="mt-1">We've sent a verification link to {verifyEmail || 'your email'}. Please check your inbox and spam folder before signing in.</p>
            <button onClick={() => setShowVerifyBanner(false)} className="mt-2 text-xs text-blue-700 underline">Dismiss</button>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`
                    block w-full pl-10 pr-3 py-3 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors duration-200
                    ${errors.username 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                  placeholder="Enter your username or email"
                />
                {errors.username && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`
                    block w-full pl-10 pr-12 py-3 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors duration-200
                    ${errors.password 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
                {errors.password && (
                  <div className="absolute inset-y-0 right-0 pr-12 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <button type="button" onClick={openReset} className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Forgot password?
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`
                group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg
                text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 transform hover:scale-[1.02]
              `}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              {/* <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div> */}
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            {/* <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="ml-2">Google</span>
            </button> */}
            {/* <button className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors">
              <Mail className="h-5 w-5" />
              <span className="ml-2">Outlook</span>
            </button> */}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={guestLoading}
              className="w-full inline-flex justify-center py-2 px-4 border border-dashed border-blue-400 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {guestLoading && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></span>}
              Continue as Guest
            </button>
            <p className="mt-2 text-xs text-gray-500 text-center">Guest mode: limited features</p>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative border border-gray-100 animate-fade-in">
            <button
              type="button"
              onClick={() => setShowResetModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              aria-label="Close password reset dialog"
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Reset your password</h3>
            <p className="text-sm text-gray-600 mb-4">Enter the email associated with your account. We'll send you a reset link.</p>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="resetEmail">Email</label>
                <input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${resetError ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              {resetError && <p className="text-sm text-red-600 flex items-center">{resetError}</p>}
              {resetSuccess && <p className="text-sm text-green-600 flex items-center">{resetSuccess}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {resetLoading && <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>}
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 