import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { FileText, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { submitApplication, ApplicationData } from '../../utils/firestoreService';

interface ApplicationSubmissionFormProps {
  currentUser: User;
  onSubmissionSuccess: () => void;
}

export const ApplicationSubmissionForm: React.FC<ApplicationSubmissionFormProps> = ({
  currentUser,
  onSubmissionSuccess
}) => {
  const [formData, setFormData] = useState({
    studentName: '',
    course: '',
    college: '',
    amount: 0,
    documents: [] as string[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate form
      if (!formData.studentName || !formData.course || !formData.college || formData.amount <= 0) {
        throw new Error('Please fill in all required fields');
      }

      // Get user's phone number from Firebase
      const phoneNumber = currentUser.phoneNumber || '';

      const applicationData: Omit<ApplicationData, 'createdAt' | 'updatedAt'> = {
        studentId: currentUser.uid,
        studentName: formData.studentName,
        phoneNumber,
        course: formData.course,
        college: formData.college,
        amount: formData.amount,
        documents: formData.documents,
        status: 'Pending'
      };

      const result = await submitApplication(applicationData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSubmissionSuccess();
        }, 2000);
      } else {
        throw new Error('Failed to submit application');
      }

    } catch (error: any) {
      console.error('Error submitting application:', error);
      setError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your scholarship application has been submitted and is now pending review by the college.
          </p>
          <p className="text-sm text-gray-500">
            You will be notified once the college reviews your application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Submit Scholarship Application</h2>
          <p className="text-gray-600 mt-1">Fill in your details to apply for a scholarship</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="studentName"
              value={formData.studentName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Course */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course *
            </label>
            <input
              type="text"
              name="course"
              value={formData.course}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Computer Science Engineering"
              required
            />
          </div>

          {/* College */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              College *
            </label>
            <select
              name="college"
              value={formData.college}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select your college</option>
              <option value="Sri Manakula Vinayagar Engineering College">Sri Manakula Vinayagar Engineering College</option>
              <option value="College of Engineering Guindy">College of Engineering Guindy</option>
              <option value="PSG College of Technology">PSG College of Technology</option>
              <option value="Vellore Institute of Technology">Vellore Institute of Technology</option>
              <option value="Anna University">Anna University</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scholarship Amount Requested (₹) *
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 50000"
              min="1"
              required
            />
          </div>

          {/* Documents Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Documents
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Upload your documents</p>
              <p className="text-sm text-gray-500">
                (This is a demo - file upload functionality would be implemented here)
              </p>
              <button
                type="button"
                className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Choose Files
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationSubmissionForm;