import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Phone, Shield, Smartphone } from 'lucide-react';
import { 
  firebaseLogin, 
  initializeRecaptcha, 
  sendPhoneOTP, 
  verifyPhoneOTP, 
  getUserByPhoneNumber,
  getUserData,
  cleanupRecaptcha 
} from '../../utils/auth';
import { initializeDemoData } from '../../utils/storage';
import { detectRoleFromEmail } from '../../utils/emailValidation';

interface LoginProps {
  onLogin: (user: any) => void;
  onSwitchToSignUp: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToSignUp }) => {
  const [isMobileLogin, setIsMobileLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Initialize demo data
  React.useEffect(() => {
    initializeDemoData();
  }, []);

  // Initialize recaptcha when mobile login is selected
  React.useEffect(() => {
    if (isMobileLogin) {
      setTimeout(() => {
        initializeRecaptcha('recaptcha-container');
      }, 100);
    }
    
    return () => {
      cleanupRecaptcha();
    };
  }, [isMobileLogin]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use Firebase authentication
      const user = await firebaseLogin(email, password);

      // Auto-detect role based on email domain
      const roleDetection = detectRoleFromEmail(email);
      const detectedRole = roleDetection.detectedRole || 'student';

      // Create user data object
      const userData = {
        uid: user.uid,
        email: user.email,
        role: detectedRole,
        displayName: user.displayName || 'User'
      };

      onLogin(userData);
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle specific Firebase auth errors
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMobileLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpSent) {
      // Validate mobile number format
      if (mobile.length !== 10) {
        setError('Please enter a valid 10-digit mobile number');
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        // Check if user exists with this mobile number
        const existingUser = await getUserByPhoneNumber(mobile);
        if (!existingUser) {
          setError('No account found with this mobile number. Please register first.');
          setIsLoading(false);
          return;
        }

        // Send real OTP using Firebase
        await sendPhoneOTP(mobile);
        setOtpSent(true);
        setError('');
        alert(`OTP sent to +91-${mobile.slice(0, 2)}XXXXXX${mobile.slice(-2)}`);
      } catch (error: any) {
        console.error('Error sending OTP:', error);
        setError('Failed to send OTP. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Verify OTP
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Verify OTP using Firebase
      const firebaseUser = await verifyPhoneOTP(otp);
      
      // Get user data from Firestore
      const userData = await getUserData(firebaseUser.uid);
      
      if (userData) {
        onLogin({
          uid: firebaseUser.uid,
          email: userData.email,
          role: userData.role,
          firstName: userData.firstName,
          lastName: userData.lastName,
          mobile: userData.phoneNumber
        });
      } else {
        // If no user data in Firestore, create basic user profile
        const basicUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || `user_${mobile}@mobile.auth`,
          mobile: mobile,
          role: 'student' // Default role
        };
        onLogin(basicUser);
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      setError('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Scholarship Portal</h1>
          <p className="text-gray-600">Secure, Transparent, Efficient</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Login Method Toggle */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsMobileLogin(false)}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${!isMobileLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email Login
            </button>
            <button
              onClick={() => setIsMobileLogin(true)}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${isMobileLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Phone className="w-4 h-4 mr-2" />
              Mobile
            </button>
          </div>

          {!isMobileLogin ? (
            /* Email Login Form */
            <form onSubmit={handleEmailLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          ) : (
            /* Mobile + OTP Login Form */
            <form onSubmit={handleMobileLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter 10-digit mobile number"
                    required
                    disabled={otpSent}
                  />
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OTP
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter 6-digit OTP"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (!otpSent && mobile.length !== 10) || (otpSent && otp.length !== 6)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? 'Processing...' : otpSent ? 'Verify OTP' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Recaptcha Container (invisible) */}
          <div id="recaptcha-container"></div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToSignUp}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create account
              </button>
            </p>
          </div>

          {/* Demo Note */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Authentication Info:</p>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Email: Use Firebase registered email and password</div>
              <div>• Mobile: Real-time OTP via Firebase (register first)</div>
              <div>• Students: Use personal emails (gmail.com, yahoo.com, etc.)</div>
              <div>• Officers: Use institutional/government emails</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};