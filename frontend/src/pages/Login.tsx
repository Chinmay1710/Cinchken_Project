import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const currentYear = new Date().getFullYear();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanedNumber = mobileNumber.trim();
    if (cleanedNumber.length !== 10 || !/^\d+$/.test(cleanedNumber)) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login/', {
        mobile_number: mobileNumber.trim(),
        password: password.trim()
      });
      const { access, refresh } = response.data;
      
      // Fetch the actual user profile
      const userResponse = await api.get('/users/me/', {
        headers: { Authorization: `Bearer ${access}` }
      });
      const user = userResponse.data;
      
      login({ access, refresh }, user);
    } catch (err: any) {
      console.error("Login Error:", err);
      if (!err.response) {
        setError('Network error. Cannot reach the backend server.');
      } else {
        setError(err.response?.data?.detail || 'Invalid mobile number or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row overflow-hidden bg-background">
      {/* Left Side: Brand & Illustration (Hidden on mobile) */}
      <div className="hidden md:flex md:w-7/12 bg-primary relative flex-col justify-between p-12 overflow-hidden">
        {/* Decorative atmospheric effect */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary-container/30 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-on-primary mb-8 tracking-widest">CK INFRA</h1>
          <div className="max-w-lg">
            <h1 className="font-display text-display text-on-primary mb-4 leading-tight">
              Future-Proof Infrastructure. <br />Built Now.
            </h1>
            <p className="font-body-lg text-body-lg text-on-primary-container opacity-90">
              Building Tomorrow's Infrastructure Today through precision data and intelligent resource management.
            </p>
          </div>
        </div>

        {/* Illustration Area */}
        <div className="relative z-10 flex flex-1 items-center justify-center mt-8">
          <div className="w-full max-w-2xl transform hover:scale-105 transition-transform duration-700 ease-out">
              <img 
              alt="CK Infra Logo" 
              className="w-full h-auto drop-shadow-2xl rounded-xl object-contain mix-blend-multiply" 
              src="/CK_logo.png" 
            />
          </div>
        </div>

        <div className="relative z-10 pt-8">
          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <span className="text-on-primary-container font-label-md text-label-md uppercase tracking-widest">Efficiency</span>
              <span className="text-on-primary font-title-lg text-title-lg">+40%</span>
            </div>
            <div className="w-px h-8 bg-on-primary-container/20"></div>
            <div className="flex flex-col">
              <span className="text-on-primary-container font-label-md text-label-md uppercase tracking-widest">Uptime</span>
              <span className="text-on-primary font-title-lg text-title-lg">99.9%</span>
            </div>
            <div className="w-px h-8 bg-on-primary-container/20"></div>
            <div className="flex flex-col">
              <span className="text-on-primary-container font-label-md text-label-md uppercase tracking-widest">Global Sites</span>
              <span className="text-on-primary font-title-lg text-title-lg">1,200+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full md:w-5/12 bg-background flex flex-col items-center justify-center p-6 md:p-12 relative overflow-y-auto">
        
        {/* Mobile Logo */}
        <div className="md:hidden mb-12 text-center">
          <h2 className="font-headline-md text-headline-md text-primary font-bold">CK INFRA ERP</h2>
        </div>

        <div className="w-full max-w-md bg-surface-container-lowest p-8 md:p-10 rounded-xl shadow-lg border border-border-subtle">
          <div className="mb-10">
            <h2 className="font-headline-lg text-headline-lg text-text-main mb-2">Welcome Back</h2>
            <p className="font-body-md text-body-md text-text-muted">Enter your credentials to access the ERP dashboard.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Mobile Number Field */}
            <div className="space-y-2">
              <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="mobile_number">Mobile Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">phone</span>
                </div>
                <input 
                  className="block w-full pl-11 pr-4 py-3 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-md font-body-md text-text-main focus:ring-primary focus:border-primary transition-all" 
                  id="mobile_number" 
                  name="mobile_number" 
                  placeholder="9999999999" 
                  required 
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block font-label-md text-label-md text-on-surface-variant" htmlFor="password">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted group-focus-within:text-primary transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input 
                  className="block w-full pl-11 pr-12 py-3 bg-surface-container-lowest border border-border-subtle rounded-lg text-body-md font-body-md text-text-main focus:ring-primary focus:border-primary transition-all" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-primary transition-colors" 
                  onClick={() => setShowPassword(!showPassword)} 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  className="h-4 w-4 text-primary focus:ring-primary border-border-subtle rounded" 
                  id="remember-me" 
                  name="remember-me" 
                  type="checkbox" 
                />
                <label className="ml-2 block font-body-md text-body-md text-on-surface-variant" htmlFor="remember-me">
                  Remember Me
                </label>
              </div>
              <a className="font-label-md text-label-md text-secondary hover:text-secondary-container transition-colors" href="#">
                Forgot Password?
              </a>
            </div>

            {error && (
              <div className="p-3 bg-error-container border border-error text-error text-sm rounded-lg">
                {error}
              </div>
            )}

            <div>
              <button 
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-label-md font-label-md font-bold text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 active:scale-[0.98] disabled:opacity-50" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-border-subtle">
            <p className="text-center font-body-md text-body-md text-text-muted">
              Need assistance? <a className="text-primary font-semibold hover:underline" href="#">Contact Support</a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-8 w-full text-center px-6">
          <p className="font-label-sm text-label-sm text-text-muted">
            © {currentYear} Cinch Ken Infrastructure. All rights reserved.
          </p>
          <div className="mt-2 flex justify-center space-x-4">
            <a className="font-label-sm text-label-sm text-text-muted hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <span className="text-border-subtle">•</span>
            <a className="font-label-sm text-label-sm text-text-muted hover:text-primary transition-colors" href="#">Terms of Service</a>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Login;
