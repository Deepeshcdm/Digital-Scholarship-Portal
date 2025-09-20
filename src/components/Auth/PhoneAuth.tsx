import React, { useEffect, useRef, useState } from 'react';
import { Shield, Phone, Smartphone, CheckCircle2, Loader2 } from 'lucide-react';
import { initializeRecaptcha, sendPhoneOTP, verifyPhoneOTP, getUserByPhoneNumber, storeUserData, getUserData, cleanupRecaptcha } from '../../utils/auth';
import { User } from 'firebase/auth';

// Contract
// Inputs: none
// Outputs: on successful verification, ensures user doc exists in Firestore with phoneNumber, role, createdAt
// Error modes: invalid phone, send OTP fail, invalid/expired OTP, recaptcha not loaded
// Success: component calls ensureUserRole and shows success state; parent can optionally read firebase auth state

export const PhoneAuth: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'enter-phone' | 'enter-otp' | 'success'>('enter-phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [role, setRole] = useState<'student' | 'college' | 'govt'>('student'); // default role
  const confirmationPhoneRef = useRef<string | null>(null);

  // Initialize invisible reCAPTCHA once this component is mounted
  useEffect(() => {
    initializeRecaptcha('recaptcha-container');
    return () => {
      cleanupRecaptcha();
    };
  }, []);

  const formatPhone = (value: string) => value.replace(/\D/g, '').slice(0, 10);

  const handleSendOtp = async () => {
    setError(null);
    setInfo(null);

    const raw = formatPhone(phone);
    if (raw.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      // Ensure user exists or guide to role selection
      const existing: any = await getUserByPhoneNumber(raw);
      if (!existing) {
        // If no existing user, we will create one after OTP verification using selected role
        setInfo('No account found. After verifying OTP, a new account will be created.');
      } else if (existing.role) {
        setRole((existing.role as 'student' | 'college' | 'govt') || 'student');
      }

      await sendPhoneOTP(raw);
      confirmationPhoneRef.current = raw;
      setStep('enter-otp');
      setInfo(`OTP sent to +91-${raw.slice(0,2)}XXXXXX${raw.slice(-2)}`);
    } catch (e: any) {
      const code = e?.code || '';
      if (code.includes('too-many-requests')) setError('Too many attempts. Please try again later.');
      else if (code.includes('invalid-phone-number')) setError('Invalid phone number.');
      else setError('Failed to send OTP. Please try again.');
      console.error('send otp error:', e);
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
      const user: User = await verifyPhoneOTP(otp);

      // Ensure Firestore user doc exists with role mapping
      const existing = await getUserData(user.uid);
      const normalizedPhone = confirmationPhoneRef.current || phone.replace(/\D/g, '').slice(0,10);

      if (!existing) {
        // Create new user document
        await storeUserData({
          uid: user.uid,
          phoneNumber: normalizedPhone,
          role, // default or pre-selected if found earlier
          createdAt: new Date().toISOString()
        });
      } else {
        // Load existing role
        setRole((existing.role as 'student' | 'college' | 'govt') || 'student');
      }

      setStep('success');
      setInfo('Phone verified and user logged in.');
    } catch (e: any) {
      const code = e?.code || '';
      if (code.includes('code-expired')) setError('OTP expired. Please request a new one.');
      else if (code.includes('invalid-verification-code')) setError('Incorrect OTP. Please try again.');
      else setError('Failed to verify OTP. Please try again.');
      console.error('verify otp error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Quickly switch reCAPTCHA mode
  // To use visible reCAPTCHA instead of invisible:
  // - In utils/auth.ts, change RecaptchaVerifier option `size: 'invisible'` to `size: 'normal'`
  // - And optionally position the container div

  // Helper: Manually change user role after verification
  // After a user is verified, you can update their role in Firestore by calling storeUserData with the new role.
  // Example (admin only): await storeUserData({ uid, phoneNumber, role: 'college', createdAt })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Phone OTP Login</h1>
          <p className="text-gray-600">Secure login with Firebase</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
          {step === 'enter-phone' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="10-digit mobile number"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {/* Optional role selector pre-login if creating new user */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Role (for new account)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'student' | 'college' | 'govt')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  disabled={loading}
                >
                  <option value="student">Student</option>
                  <option value="college">College Officer</option>
                  <option value="govt">Government Officer</option>
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}
              {info && !error && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">{info}</div>
              )}

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending OTP...</>) : 'Send OTP'}
              </button>
            </div>
          )}

          {step === 'enter-otp' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit OTP"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
              )}
              {info && !error && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">{info}</div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('enter-phone')}
                  disabled={loading}
                  className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length !== 6}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying...</>) : 'Verify OTP'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-3">
              <div className="mx-auto w-14 h-14 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold">Logged in successfully</h2>
              <p className="text-sm text-gray-600">Role: <span className="font-medium capitalize">{role}</span></p>
              <p className="text-sm text-gray-500">You can now continue to the dashboard.</p>
            </div>
          )}

          {/* Required by Firebase reCAPTCHA */}
          <div id="recaptcha-container" />
        </div>
      </div>
    </div>
  );
};

export default PhoneAuth;
