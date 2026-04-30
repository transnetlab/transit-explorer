import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, AlertCircle, CheckCircle, X } from 'lucide-react';
import { API_2_BASES } from '../config';
import { fetchWithFallback } from '../http';

export function SignUp() {
  const navigate = useNavigate();
  React.useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const isGuest = (localStorage.getItem('isGuest') || 'false') === 'true';
    if (isAuthenticated && !isGuest) {
      navigate('/city-selection', { replace: true });
    }
  }, [navigate]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });

  const PolicyModal = ({
    open,
    title,
    children,
    onClose,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
  }) => {
    if (!open) return null;
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl border border-gray-200 dark:border-gray-700 max-h-[85vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Last updated: {new Date().toISOString().slice(0, 10)}</p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-200 space-y-3">{children}</div>
        </div>
      </div>
    );
  };

  const validatePassword = (password: string) => {
    let score = 0;
    let feedback = '';

    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 2) feedback = 'Very weak';
    else if (score < 3) feedback = 'Weak';
    else if (score < 4) feedback = 'Fair';
    else if (score < 5) feedback = 'Good';
    else feedback = 'Strong';

    return { score, feedback };
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength.score < 3) {
      newErrors.password = 'Password is too weak';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // After successful signup, we redirect to Sign In (no auto-login)
    e.preventDefault();
    setServerError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Fire both signups in parallel: Firebase email signup and local signup (returns api_key)
      const firebaseSignupPromise = fetchWithFallback(API_2_BASES, '/api/auth/firebase/signup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword
        })
      });

      const localSignupPromise = fetchWithFallback(API_2_BASES, '/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword
        })
      });

      const [firebaseRes, localRes] = await Promise.all([firebaseSignupPromise, localSignupPromise]);

      if (!firebaseRes.ok) {
        const text = await firebaseRes.text().catch(() => '');
        throw new Error(text || 'Firebase signup failed');
      }
      if (!localRes.ok) {
        const text = await localRes.text().catch(() => '');
        throw new Error(text || 'Local signup failed');
      }

      // Parse local signup (api_key required)
      const localData = await localRes.json().catch(() => ({}));
      console.log('[Signup] Local response', localData);
      const user = localData?.data?.user || localData?.user;
      const apiKey = localData?.data?.api_key || localData?.api_key;
      if (!user?.id || !apiKey) {
        throw new Error('Signup did not return required api_key or user id. Please retry.');
      }

      // Persist api_key and userId for subsequent operations
      try {
        localStorage.setItem('api_key', String(apiKey));
        localStorage.setItem('userId', String(user.id));
      } catch {}

      // Optionally cache name by username for nicer sign-in experience
      try {
        const cacheUser = user || localData?.data;
        if (cacheUser?.username) {
          const cacheRaw = localStorage.getItem('fullNameByUsername') || '{}';
          const cache = JSON.parse(cacheRaw);
          cache[cacheUser.username] = `${cacheUser.first_name || ''} ${cacheUser.last_name || ''}`.trim();
          localStorage.setItem('fullNameByUsername', JSON.stringify(cache));
        }
      } catch {}

      // Mark this email as pending verification to gate login only for new signups (Firebase path)
      try {
        if (formData.email) {
          localStorage.setItem('pendingEmail', formData.email);
        }
      } catch {}

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/signin', { replace: true, state: { showVerifyNotice: true, email: formData.email } });
      }, 1200);
    } catch (err: any) {
      setServerError(err?.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'password') {
      setPasswordStrength(validatePassword(value));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-blue-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-6">
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h2>
          <p className="text-gray-600">Join Transit Explorer to explore public transportation networks</p>
        </div>

        {showSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
              <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-gray-900">Account created!</h3>
              <p className="text-gray-600 mt-1">Redirecting to sign in...</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {serverError && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
              {serverError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`
                      block w-full pl-10 pr-3 py-3 border rounded-lg text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      transition-colors duration-200
                      ${errors.firstName 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text sm font-medium text-gray-700 mb-2">
                  Last name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`
                      block w-full pl-10 pr-3 py-3 border rounded-lg text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      transition-colors duration-200
                      ${errors.lastName 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300 hover:border-gray-400'
                      }
                    `}
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
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
                  placeholder="Choose a username"
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

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`
                    block w-full pl-10 pr-3 py-3 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors duration-200
                    ${errors.email 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email}
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
                  autoComplete="new-password"
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
                  placeholder="Create a password"
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
              </div>
              
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score >= 4 ? 'text-green-600' :
                      passwordStrength.score >= 3 ? 'text-blue-600' :
                      passwordStrength.score >= 2 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {passwordStrength.feedback}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`
                    block w-full pl-10 pr-12 py-3 border rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-colors duration-200
                    ${errors.confirmPassword 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-700">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setShowPrivacy(true)}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Privacy Policy
                  </button>
                </label>
              </div>
            </div>

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
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

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
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link 
              to="/signin" 
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
    <PolicyModal open={showTerms} title="Terms of Service" onClose={() => setShowTerms(false)}>
      <p>
        These Terms of Service ("Terms") govern your access to and use of the TransitXplorer application (the "Service").
        By creating an account or using the Service, you agree to these Terms.
      </p>
      <p className="font-medium">1) Accounts and access</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
        <li>You must provide accurate information and keep it up to date.</li>
        <li>We may suspend or terminate access if we believe the Service is being misused.</li>
      </ul>
      <p className="font-medium">2) Acceptable use</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Use the Service only for lawful purposes and in line with your organization’s policies.</li>
        <li>Do not attempt to disrupt, overload, probe, or reverse-engineer the Service.</li>
        <li>Do not upload content you do not have permission to use (including GTFS or other datasets).</li>
      </ul>
      <p className="font-medium">3) Data and outputs</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>You retain rights to datasets you upload; you grant us permission to process them to provide the Service.</li>
        <li>Routing results, analytics, and visualizations are provided “as-is” and may be incomplete or inaccurate.</li>
      </ul>
      <p className="font-medium">4) Availability and changes</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>We may modify, suspend, or discontinue parts of the Service at any time.</li>
        <li>We may update these Terms; continued use after updates means you accept the changes.</li>
      </ul>
      <p className="font-medium">5) Disclaimers and limitation of liability</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>The Service is provided without warranties of any kind, express or implied.</li>
        <li>To the extent permitted by law, we are not liable for indirect or consequential damages.</li>
      </ul>
      <p className="font-medium">6) Contact</p>
      <p>
        For questions about these Terms, contact your system administrator or the team that provided access to this Service.
      </p>
    </PolicyModal>

    <PolicyModal open={showPrivacy} title="Privacy Policy" onClose={() => setShowPrivacy(false)}>
      <p>
        This Privacy Policy explains how the Service collects, uses, and shares information when you use TransitXplorer.
      </p>
      <p className="font-medium">1) Information we collect</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Account information (e.g., username, email) used to create and manage your account.</li>
        <li>Usage and technical data (e.g., pages used, device/browser details, error logs) to maintain reliability.</li>
        <li>Uploaded files and inputs you provide (e.g., city transit datasets) to perform preprocessing and analysis.</li>
        <li>
          City uploads and derived outputs may be stored in our database so we can run preprocessing, enable analysis features,
          and provide support.
        </li>
      </ul>
      <p className="font-medium">2) How we use information</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>Provide core features (visualization, preprocessing, routing, optimization).</li>
        <li>Maintain security, prevent abuse, and troubleshoot issues.</li>
        <li>Improve performance and user experience.</li>
      </ul>
      <p className="font-medium">3) Sharing</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>With service providers/hosting used to operate the Service (only as needed to provide functionality).</li>
        <li>
          With the Service operators/administrators (including our team managing the deployment) to store, process, and support
          city uploads and related datasets.
        </li>
        <li>With your organization’s administrators where applicable for support and compliance.</li>
        <li>When required by law or to protect rights, safety, and security.</li>
      </ul>
      <p className="font-medium">4) Retention</p>
      <p>
        We retain information for as long as needed to provide the Service and meet operational, security, and legal requirements.
        Retention may depend on your organization’s configuration.
      </p>
      <p className="font-medium">5) Security</p>
      <p>
        We use reasonable technical and organizational measures to protect data. No method of transmission or storage is 100% secure.
      </p>
      <p className="font-medium">6) Your choices</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>You may be able to access, correct, or delete certain account data through the Service or by contacting admins.</li>
        <li>You can sign out and clear local browser storage to remove locally cached values on your device.</li>
      </ul>
      <p className="font-medium">7) Contact</p>
      <p>
        For privacy questions or requests, contact your system administrator or the team managing the Service deployment.
      </p>
    </PolicyModal>
    </>
  );
} 