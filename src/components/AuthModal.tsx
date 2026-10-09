import React, { useState } from 'react';
import { X, Eye, EyeOff, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, AuthUser } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Field errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [displayNameError, setDisplayNameError] = useState('');

  // General messages
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validateSignup = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setDisplayNameError('');

    if (!displayName.trim()) {
      setDisplayNameError('Display name is required');
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one letter and one number');
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');

    if (mode === 'signup') {
      if (!validateSignup()) return;

      setLoading(true);
      try {
        const user = await api.signup(displayName, email, password, confirmPassword);
        onAuthSuccess(user);
        onClose();
      } catch (err: unknown) {
        setGeneralError(err instanceof Error ? err.message : 'Registration failed');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'login') {
      if (!email || !password) {
        setGeneralError('Email or password is wrong.');
        return;
      }

      setLoading(true);
      try {
        const user = await api.login(email, password);
        onAuthSuccess(user);
        onClose();
      } catch (err: unknown) {
        setGeneralError(err instanceof Error ? err.message : 'Email or password is wrong.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'forgot') {
      if (!email) {
        setEmailError('Enter your email');
        return;
      }
      setLoading(true);
      try {
        await api.forgotPassword(email);
        setSuccessMessage('If this email exists, we sent a password reset link.');
      } catch {
        setSuccessMessage('If this email exists, we sent a password reset link.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 pb-4 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setGeneralError('');
              setSuccessMessage('');
            }}
            className={`flex-1 text-center font-bold pb-2 border-b-2 text-base transition-colors ${
              mode === 'login'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Host Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setGeneralError('');
              setSuccessMessage('');
            }}
            className={`flex-1 text-center font-bold pb-2 border-b-2 text-base transition-colors ${
              mode === 'signup'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {generalError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-2 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Display Name (Host / Teacher)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Ms. Davis, Captain Quiz"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              {displayNameError && <p className="text-xs text-rose-400 mt-1">{displayNameError}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            {emailError && <p className="text-xs text-rose-400 mt-1">{emailError}</p>}
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 chars (1 letter + 1 number)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && <p className="text-xs text-rose-400 mt-1">{passwordError}</p>}
            </div>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-type password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              {confirmPasswordError && <p className="text-xs text-rose-400 mt-1">{confirmPasswordError}</p>}
            </div>
          )}

          {mode === 'login' && (
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center space-x-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-950"
                />
                <span>Show password</span>
              </label>
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {loading
              ? 'Please wait...'
              : mode === 'signup'
              ? 'Create Host Account'
              : mode === 'login'
              ? 'Log In to QuizBlast'
              : 'Send Reset Link'}
          </button>
        </form>

      </div>
    </div>
  );
};
