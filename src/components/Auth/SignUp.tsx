import React, { useState } from 'react';
import { Shield, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { firebaseRegister } from '../../utils/auth';
import { validateEmailDomain, detectRoleFromEmail, getEmailExamples } from '../../utils/emailValidation';

interface SignUpProps {
    onSignUp: (user: any) => void;
    onSwitchToLogin: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSignUp, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        role: 'student',
        phoneNumber: '',
        aadhaarNumber: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailValidation, setEmailValidation] = useState<{
        isValid: boolean;
        message: string;
        suggestedRole?: string;
    }>({ isValid: true, message: '' });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (error) setError('');
        
        // Validate email domain when email or role changes
        if (name === 'email' || name === 'role') {
            const emailToValidate = name === 'email' ? value : formData.email;
            const roleToValidate = name === 'role' ? value : formData.role;
            
            if (emailToValidate && roleToValidate) {
                validateEmailForRole(emailToValidate, roleToValidate);
            } else if (emailToValidate) {
                // Auto-detect role if only email is provided
                const detection = detectRoleFromEmail(emailToValidate);
                if (detection.isValid && detection.detectedRole) {
                    setEmailValidation({
                        isValid: true,
                        message: `✓ ${detection.message || 'Email validated'}`,
                        suggestedRole: detection.detectedRole
                    });
                }
            }
        }
    };

    const validateEmailForRole = (email: string, role: string) => {
        const validation = validateEmailDomain(email, role);
        setEmailValidation({
            isValid: validation.isValid,
            message: validation.message || '',
            suggestedRole: validation.detectedRole
        });
    };

    const validateForm = () => {
        // Email domain validation
        const emailDomainValidation = validateEmailDomain(formData.email, formData.role);
        if (!emailDomainValidation.isValid) {
            setError(emailDomainValidation.message || 'Invalid email domain for selected role');
            return false;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }
        if (formData.aadhaarNumber && formData.aadhaarNumber.length !== 12) {
            setError('Aadhaar number must be 12 digits');
            return false;
        }
        if (formData.phoneNumber && formData.phoneNumber.length !== 10) {
            setError('Phone number must be 10 digits');
            return false;
        }
        return true;
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Create user with Firebase
            const user = await firebaseRegister(formData.email, formData.password);

            // Store additional user data in Firestore (you can expand this)
            const userData = {
                uid: user.uid,
                email: user.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: formData.role,
                phoneNumber: formData.phoneNumber,
                aadhaarNumber: formData.aadhaarNumber,
                createdAt: new Date().toISOString()
            };

            // Call the onSignUp callback with user data
            onSignUp(userData);

        } catch (error: any) {
            console.error('Sign up error:', error);
            setError(error.message || 'Failed to create account. Please try again.');
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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                    <p className="text-gray-600">Join the Digital Scholarship Portal</p>
                </div>

                {/* Sign Up Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSignUp} className="space-y-6">
                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="First name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Last name"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent ${
                                        emailValidation.isValid 
                                            ? 'border-gray-300 focus:ring-blue-500' 
                                            : 'border-red-300 focus:ring-red-500'
                                    }`}
                                    placeholder="Enter your email"
                                    required
                                />
                                {emailValidation.message && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        {emailValidation.isValid ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <AlertCircle className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                )}
                            </div>
                            {emailValidation.message && (
                                <div className={`mt-2 text-sm ${
                                    emailValidation.isValid ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {emailValidation.message}
                                </div>
                            )}
                            {emailValidation.suggestedRole && emailValidation.suggestedRole !== formData.role && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm text-blue-700">
                                        💡 Based on your email domain, we suggest selecting "{emailValidation.suggestedRole.replace('_', ' ')}" as your role.
                                    </p>
                                </div>
                            )}
                            <div className="mt-1 text-xs text-gray-500">
                                Examples: {getEmailExamples(formData.role).join(', ')}
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Role
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                    required
                                >
                                    <option value="student">Student</option>
                                    <option value="college_officer">College Officer</option>
                                    <option value="govt_officer">Government Officer</option>
                                </select>
                            </div>
                        </div>

                        {/* Phone Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setFormData(prev => ({ ...prev, phoneNumber: value }));
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="10-digit phone number"
                                required
                            />
                        </div>

                        {/* Aadhaar Number */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Aadhaar Number
                            </label>
                            <input
                                type="text"
                                name="aadhaarNumber"
                                value={formData.aadhaarNumber}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                                    setFormData(prev => ({ ...prev, aadhaarNumber: value }));
                                }}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="12-digit Aadhaar number"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Create a password"
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Confirm your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Sign in
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};