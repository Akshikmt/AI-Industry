import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, KeyRound, Mail, ArrowRight, Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Email Validation on Change
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!val.trim()) {
      setEmailError(null);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        setEmailError('Please enter a valid enterprise email.');
      } else {
        setEmailError(null);
      }
    }
  };

  const handleRoleToggle = (selectedRole: 'admin' | 'employee') => {
    setRole(selectedRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (emailError) {
      setError('Please resolve input errors before logging in.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Typography Constants
  const headingStyle = { fontFamily: "'Outfit', sans-serif" };
  const bodyStyle = { fontFamily: "'Inter', sans-serif" };

  return (
    <div 
      className="min-h-screen bg-[#1e4e7c]/3 text-slate-900 flex flex-col justify-center items-center p-6 relative"
      style={bodyStyle}
    >
      
      {/* Absolute Back to Home Button (Top Left) */}
      <div className="absolute top-8 left-8">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-xs font-bold text-[#1e4e7c] hover:text-[#153a5c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8">
        
        {/* Header Block */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex items-center gap-2.5 mb-2">
            <img src="/logo.webp" alt="SamiQ Logo" className="w-8.5 h-8.5 object-contain rounded-lg shadow-glow-teal" />
            <span className="font-extrabold text-xl tracking-tight text-[#1e4e7c]" style={headingStyle}>
              SamiQ
            </span>
          </Link>
        </div>

        {/* Card Body - Static, no hover translate animations */}
        <div className="bg-[#ffffff] border border-[#1e4e7c]/10 p-8 rounded-3xl shadow-xl w-full">
          
          <h2 className="text-xl font-extrabold text-[#1e4e7c] mb-6 text-center" style={headingStyle}>
            Access Workspace Portal
          </h2>

          {/* Toggle Role Pill (Admin vs Employee) */}
          <div className="flex bg-[#1e4e7c]/5 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => handleRoleToggle('admin')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                role === 'admin' 
                  ? 'bg-[#1e4e7c] text-[#ffffff] shadow-sm' 
                  : 'text-slate-500 hover:text-[#1e4e7c]'
              }`}
            >
              Administrator
            </button>
            <button
              type="button"
              onClick={() => handleRoleToggle('employee')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                role === 'employee' 
                  ? 'bg-[#1e4e7c] text-[#ffffff] shadow-sm' 
                  : 'text-slate-500 hover:text-[#1e4e7c]'
              }`}
            >
              Operator
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Enterprise Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  disabled={loading}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border bg-slate-50 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors ${
                    emailError 
                      ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-[#1e4e7c]/15 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c]'
                  }`}
                />
              </div>
              {emailError && (
                <p className="text-[10px] text-red-600 font-semibold mt-1">{emailError}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Password
                </label>
                <a href="#forgot" className="text-xs font-semibold text-[#1e4e7c] hover:underline">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#1e4e7c]/15 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:border-[#1e4e7c] focus:ring-1 focus:ring-[#1e4e7c] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#1e4e7c] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !!emailError}
              className="w-full py-3 rounded-lg bg-[#1e4e7c] hover:bg-[#153a5c] text-[#ffffff] font-extrabold shadow-md shadow-[#1e4e7c]/10 hover:shadow-[#1e4e7c]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Log In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Direct to Sign Up */}
          <div className="mt-6 text-center text-xs text-slate-500 font-semibold">
            Don't have a workspace?{' '}
            <Link to="/signup" className="text-[#1e4e7c] hover:underline font-bold">
              Sign Up
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
