import React, { useEffect, useRef, useState } from 'react';
import { Shield, Phone, Smartphone, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  User
} from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { createUserProfile, getUserProfile } from '../../utils/firestoreService';

interface PhoneAuthCompleteProps {
  onAuthSuccess: (user: User, role: string) => void;
}

export const PhoneAuthComplete: React.FC<PhoneAuthCompleteProps> = ({ onAuthSuccess }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enter-phone' | 'enter-otp' | 'success'>('enter-phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [role, setRole] = useState<'student' | 'college' | 'govt'>('student');
  
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  // Initialize reCAPTCHA
  useEffect(() => {
    initializeRecaptcha();
    return () => {
      cleanupRecaptcha();
    };
  }, []);

  const initializeRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible', // Change to 'normal' for visible reCAPTCHA
          callback: () => {
            console.log('reCAPTCHA verified');
          },
          'expired-callback': () => {
            setError('reCAPTCHA expired. Please try again.');
          }
        });
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        setError('Failed to initialize reCAPTCHA');
      }
    }
  };

  const cleanupRecaptcha = () => {
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }
  };

  const formatPhone = (value: string) => value.replace(/\D/g, '').slice(0, 10);

  const handleSendOtp = async () => {
    setError(null);
    setInfo(null);

    const formattedPhone = formatPhone(phone);
    if (formattedPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      if (!recaptchaVerifierRef.current) {
        initializeRecaptcha();
      }

      const phoneNumber = `+91${formattedPhone}`;
      confirmationResultRef.current = await signInWithPhoneNumber(
        auth, 
        phoneNumber, 
        recaptchaVerifierRef.current!
      );
      
      setStep('enter-otp');
      setInfo(`OTP sent to +91-${formattedPhone.slice(0,2)}XXXXXX${formattedPhone.slice(-2)}`);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else if (error.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format.');
      } else {
        setError('Failed to send OTP. Please try again.');
      }
      
      // Reset reCAPTCHA on error
      cleanupRecaptcha();
      setTimeout(initializeRecaptcha, 1000);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setInfo(null);

    if (otp.replace(/\D/g, '').length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      if (!confirmationResultRef.current) {
        setError('No confirmation result available. Please request OTP again.');
        return;
      }

      const result = await confirmationResultRef.current.confirm(otp);
      const user = result.user;

      // Check if user exists in Firestore
      const userProfile = await getUserProfile(user.uid);
      
      let userRole = role;
      
      if (userProfile.success) {
        // Existing user - use their stored role
        userRole = userProfile.data.role;
        setInfo(`Welcome back! Logged in as ${userRole}`);
      } else {
        // New user - create profile with selected role
        const createResult = await createUserProfile(user.uid, formatPhone(phone), role);
        if (!createResult.success) {
          throw new Error('Failed to create user profile');
        }
        setInfo(`Account created successfully as ${role}`);
      }

      setStep('success');
      
      // Call success callback after a brief delay to show success state
      setTimeout(() => {
        onAuthSuccess(user, userRole);
      }, 1500);

    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      
      if (error.code === 'auth/code-expired') {
        setError('OTP expired. Please request a new one.');
        setStep('enter-phone');
      } else if (error.code === 'auth/invalid-verification-code') {
        setError('Incorrect OTP. Please try again.');
      } else {
        setError('Failed to verify OTP. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('enter-phone');
    setOtp('');
    setError(null);
    setInfo(null);
    confirmationResultRef.current = null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Phone Authentication</h1>
          <p className="text-gray-600">Secure login with Firebase OTP</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
          {step === 'enter-phone' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="10-digit mobile number"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role (for new accounts)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'student' | 'college' | 'govt')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="student">Student</option>
                  <option value="college">College Officer</option>
                  <option value="govt">Government Officer</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Existing users will use their previously assigned role
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {info && !error && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-700">{info}</span>
                </div>
              )}

              <button
                onClick={handleSendOtp}
                disabled={loading || phone.length !== 10}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
          )}

          {step === 'enter-otp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest text-center"
                    disabled={loading}
                    maxLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {info && !error && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-700">{info}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Authentication Successful!</h2>
              <p className="text-sm text-gray-600">
                {info || 'Redirecting to dashboard...'}
              </p>
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            </div>
          )}

          {/* Required reCAPTCHA container - invisible by default */}
          <div id="recaptcha-container" />
          
          {/* Development note */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Development Notes:</p>
            <ul className="space-y-1">
              <li>• reCAPTCHA is set to invisible mode</li>
              <li>• Change size to 'normal' in RecaptchaVerifier for visible reCAPTCHA</li>
              <li>• Role can be manually updated in Firestore after verification</li>
              <li>• Phone format: +91XXXXXXXXXX (Indian numbers)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneAuthComplete;