import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import type { User as UserType } from '../App';
import { apiRegister, apiVerifyOtp, apiResendOtp, apiLogin, setToken, getOAuthAuthorizationUrl } from '../lib/api';

interface SignUpProps {
  onSignup: (user: UserType) => void;
  onNavigateToLogin: () => void;
}

export function SignUp({ onSignup, onNavigateToLogin }: SignUpProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string; email?: string; password?: string; confirmPassword?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // OTP verification state
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const validateForm = () => {
    const newErrors: {
      fullName?: string; email?: string; password?: string; confirmPassword?: string;
    } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    try {
      await apiRegister(fullName, email, password);
      toast.success('Account created! Please check your email for the OTP.');
      setShowOtpScreen(true);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.error('Please enter the OTP');
      return;
    }
    setIsVerifying(true);
    try {
      await apiVerifyOtp(email, otp);
      toast.success('Email verified! Logging you in...');

      // Auto-login after verification
      const response = await apiLogin(email, password);
      setToken(response.token);

      const user: UserType = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role,
      };
      onSignup(user);
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await apiResendOtp(email);
      toast.success('OTP resent to your email!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend OTP');
    }
  };

  // ── OTP Verification Screen ──
  if (showOtpScreen) {
    return (
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-eco-bg-alt pt-20 pb-10">
        <div className="relative z-10 w-full max-w-md mx-auto px-4">
          <div className="eco-card p-8 animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-eco-green/10 rounded-full mb-4">
                <Mail className="w-8 h-8 text-eco-green" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-eco-forest">Verify Email</h1>
              <p className="text-sm text-eco-sage mt-1">
                We've sent a 6-digit OTP to <strong>{email}</strong>
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-eco-forest mb-2">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="eco-input text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={isVerifying}
                className="eco-button w-full justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : 'Verify OTP'}
              </button>

              <p className="text-center text-sm text-eco-sage">
                Didn't receive the code?{' '}
                <button
                  onClick={handleResendOtp}
                  className="font-semibold text-eco-green hover:text-eco-forest transition-colors"
                >
                  Resend OTP
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Sign Up Form ──
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-eco-bg-alt pt-20 pb-10">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-[10%] w-32 h-16 bg-white/40 rounded-full blur-xl" />
        <div className="absolute top-20 right-[15%] w-40 h-20 bg-white/30 rounded-full blur-xl" />
      </div>

      {/* Hills at bottom */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 1440 200" className="w-full h-auto" preserveAspectRatio="none">
          <defs>
            <linearGradient id="signupHillGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7BC88D" />
              <stop offset="100%" stopColor="#3D8B5D" />
            </linearGradient>
          </defs>
          <path
            fill="url(#signupHillGradient)"
            fillOpacity="0.5"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,200L1392,200C1344,200,1248,200,1152,200C1056,200,960,200,864,200C768,200,672,200,576,200C480,200,384,200,288,200C192,200,96,200,48,200L0,200Z"
          />
        </svg>

        <div className="absolute bottom-6 left-[15%]">
          <svg className="w-14 h-14 text-eco-green/40" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M6 8h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2zM6 12h2v2H6zm4 0h2v2h-2zm4 0h2v2h-2zm4 0h2v2h-2z" fill="white" fillOpacity="0.3" />
          </svg>
        </div>
        <div className="absolute bottom-10 right-[20%]">
          <svg className="w-10 h-10 text-eco-green/30" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 22h20L12 2zm0 3.5L18.5 20h-13L12 5.5z" />
          </svg>
        </div>
      </div>

      {/* Sign Up Card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="eco-card p-8 animate-fade-in-up">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-eco-green/10 rounded-full mb-4">
              <Leaf className="w-8 h-8 text-eco-green" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-eco-forest">CarbonCalc</h1>
            <p className="text-sm text-eco-sage mt-1">Join & Start Reducing Your Emissions</p>
          </div>

          {/* Title */}
          <h2 className="text-xl font-heading font-bold text-eco-forest text-center mb-6">
            Create Your Account
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-medium text-eco-forest mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-eco-sage pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors({ ...errors, fullName: undefined }); }}
                  placeholder="Your Name"
                  className={`eco-input !pl-12 ${errors.fullName ? 'border-eco-error focus:ring-eco-error' : ''}`}
                />
              </div>
              {errors.fullName && <p className="mt-1 text-sm text-eco-error">{errors.fullName}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-eco-forest mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-eco-sage pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }}
                  placeholder="you@email.com"
                  className={`eco-input !pl-12 ${errors.email ? 'border-eco-error focus:ring-eco-error' : ''}`}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-eco-error">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-eco-forest mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-eco-sage pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }}
                  placeholder="••••••••"
                  className={`eco-input !pl-12 !pr-12 ${errors.password ? 'border-eco-error focus:ring-eco-error' : ''}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-eco-sage hover:text-eco-forest transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-eco-error">{errors.password}</p>}
              <p className="mt-1 text-xs text-eco-sage">Must be at least 6 characters with uppercase, lowercase, and number</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-eco-forest mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-eco-sage pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined }); }}
                  placeholder="••••••••"
                  className={`eco-input !pl-12 !pr-12 ${errors.confirmPassword ? 'border-eco-error focus:ring-eco-error' : ''}`}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-eco-sage hover:text-eco-forest transition-colors">
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-eco-error">{errors.confirmPassword}</p>}
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={isLoading} className="eco-button w-full justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-6">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Sign Up'}
            </button>
          </form>

          {/* OAuth Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[rgba(61,139,93,0.15)]" />
            <span className="text-xs text-eco-sage font-medium">OR SIGN UP WITH</span>
            <div className="flex-1 h-px bg-[rgba(61,139,93,0.15)]" />
          </div>

          {/* OAuth Buttons */}
          <div className="flex gap-3">
            <button type="button" onClick={() => { window.location.href = getOAuthAuthorizationUrl('google'); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[rgba(61,139,93,0.15)] bg-white hover:bg-eco-bg-alt transition-colors text-sm font-medium text-eco-forest">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button type="button" onClick={() => { window.location.href = getOAuthAuthorizationUrl('github'); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[rgba(61,139,93,0.15)] bg-white hover:bg-eco-bg-alt transition-colors text-sm font-medium text-eco-forest">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-eco-sage">
            Already have an account?{' '}
            <button onClick={onNavigateToLogin} className="font-semibold text-eco-green hover:text-eco-forest transition-colors">
              Login
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
