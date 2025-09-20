import React, { useState } from 'react';
import { Upload, X, FileText, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { Layout } from '../Layout';
import { getCurrentUser } from '../../utils/auth';
import { saveApplication, saveNotification } from '../../utils/storage';
import { blockchain } from '../../utils/blockchain';
import { ocrService } from '../../utils/ai';
import { findCollegeByName, getCollegeSuggestions, generateCollegeOfficerEmail } from '../../utils/collegeMapping';
import { Application, Document } from '../../types';
import CryptoJS from 'crypto-js';

interface ApplicationFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    aadhaar: '',
    phone: '',
    email: '',
    college: '',
    course: '',
    semester: 1,
    familyIncome: 0,
    category: 'General',
    bankAccount: '',
    ifscCode: ''
  });

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [collegeSuggestions, setCollegeSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<any>(null);

  const user = getCurrentUser();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Handle college autocomplete
    if (name === 'college') {
      if (value.length > 1) {
        const suggestions = getCollegeSuggestions(value, 8);
        setCollegeSuggestions(suggestions);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const handleCollegeSelect = (college: any) => {
    setFormData(prev => ({
      ...prev,
      college: college.collegeName
    }));
    setSelectedCollege(college);
    setShowSuggestions(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    const fileId = `${docType}-${Date.now()}`;
    setUploadingFiles(prev => new Set(prev).add(fileId));

    try {
      // Simulate file upload and OCR processing
      const fileUrl = URL.createObjectURL(file);
      
      // Run OCR on the file
      const ocrText = await ocrService.extractText(file);
      
      const newDocument: Document = {
        id: fileId,
        name: file.name,
        type: docType,
        url: fileUrl,
        verified: false,
        ocrText,
        size: file.size
      };

      // Validate document based on form data
      if (docType === 'aadhaar' && formData.aadhaar) {
        const validation = ocrService.validateDocument(ocrText, { 
          aadhaar: formData.aadhaar,
          name: formData.studentName 
        });
        newDocument.verified = validation.isValid;
      }

      setDocuments(prev => prev.filter(doc => doc.type !== docType).concat(newDocument));
    } catch (error) {
      alert('Error processing document. Please try again.');
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const calculateScholarshipAmount = (category: string, income: number): number => {
    let baseAmount = 25000;
    
    switch (category) {
      case 'OBC': baseAmount = 30000; break;
      case 'SC': baseAmount = 35000; break;
      case 'ST': baseAmount = 35000; break;
      case 'Differently Abled': baseAmount = 40000; break;
    }
    
    // Income-based adjustment
    if (income < 200000) baseAmount += 5000;
    else if (income < 400000) baseAmount += 2000;
    
    return baseAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    if (documents.length < 3) {
      alert('Please upload at least 3 required documents');
      return;
    }

    setIsSubmitting(true);

    try {
      const applicationId = `APP-${Date.now()}`;
      const amount = calculateScholarshipAmount(formData.category, formData.familyIncome);
      
      // Find college details for routing
      const targetCollege = findCollegeByName(formData.college);
      const collegeOfficerEmail = targetCollege ? generateCollegeOfficerEmail(targetCollege) : null;
      
      // Create blockchain hash
      const dataString = JSON.stringify({ ...formData, documents: documents.map(d => d.id) });
      const dataHash = CryptoJS.SHA256(dataString).toString();
      
      // Add to blockchain
      const blockchainHash = blockchain.addBlock({
        applicationId,
        studentId: user.userId,
        action: 'application_submitted',
        dataHash,
        status: 'submitted'
      });

      const application: Application = {
        id: applicationId,
        studentId: user.userId,
        ...formData,
        documents,
        status: 'submitted',
        amount,
        submittedAt: new Date(),
        blockchainHash,
        targetCollegeEmail: collegeOfficerEmail || undefined,
        collegeDomain: targetCollege?.emailDomain
      };

      saveApplication(application);

      // Create notification for student
      saveNotification({
        id: `notif-${Date.now()}`,
        userId: user.userId,
        title: 'Application Submitted Successfully',
        message: `Your scholarship application ${applicationId} has been submitted to ${formData.college} and is pending verification.`,
        type: 'success',
        read: false,
        createdAt: new Date()
      });

      // Create notification for college officer (if college found)
      if (targetCollege && collegeOfficerEmail) {
        // In a real system, this would be sent via email or push notification
        // For demo, we'll create a system notification
        saveNotification({
          id: `notif-college-${Date.now()}`,
          userId: collegeOfficerEmail, // Using email as userId for college officers
          title: 'New Scholarship Application Received',
          message: `Student ${formData.studentName} from ${formData.course} has submitted a scholarship application (${applicationId}) for ₹${amount.toLocaleString()}. Please review and verify the documents.`,
          type: 'info',
          read: false,
          createdAt: new Date(),
          applicationId: applicationId,
          studentEmail: formData.email
        });
      }

      // Mock DigiLocker integration notification
      setTimeout(() => {
        saveNotification({
          id: `notif-${Date.now() + 1}`,
          userId: user.userId,
          title: 'Documents Fetched from DigiLocker',
          message: 'Your Aadhaar and education certificates have been automatically fetched from DigiLocker.',
          type: 'info',
          read: false,
          createdAt: new Date()
        });
      }, 3000);

      alert(`Application submitted successfully! 
      
Application ID: ${applicationId}
College: ${formData.college}
${targetCollege ? `College Officer: ${collegeOfficerEmail}` : 'College not found in database - manual routing required'}

You will receive notifications about status updates.`);
      onSubmit();
    } catch (error) {
      alert('Error submitting application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="New Scholarship Application" currentUser={null}>
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Scholarship Application Form
                </h3>
                <button
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Personal Information</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="studentName"
                        value={formData.studentName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aadhaar Number *
                      </label>
                      <input
                        type="text"
                        name="aadhaar"
                        value={formData.aadhaar}
                        onChange={handleInputChange}
                        maxLength={12}
                        pattern="[0-9]{12}"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Academic Information</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        College/University *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="college"
                          value={formData.college}
                          onChange={handleInputChange}
                          onFocus={() => formData.college.length > 1 && setShowSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Type your college name..."
                          required
                        />
                        {showSuggestions && collegeSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {collegeSuggestions.map((college, index) => (
                              <div
                                key={index}
                                onClick={() => handleCollegeSelect(college)}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{college.collegeName}</div>
                                <div className="text-sm text-gray-500">{college.location} • {college.type}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {selectedCollege && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center text-sm text-green-700">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {selectedCollege.collegeName} - {selectedCollege.location}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Course *
                      </label>
                      <input
                        type="text"
                        name="course"
                        value={formData.course}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Semester *
                      </label>
                      <select
                        name="semester"
                        value={formData.semester}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                          <option key={sem} value={sem}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="General">General</option>
                        <option value="OBC">OBC</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="Differently Abled">Differently Abled</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Financial Information</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Annual Family Income (₹) *
                      </label>
                      <input
                        type="number"
                        name="familyIncome"
                        value={formData.familyIncome}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Account Number *
                      </label>
                      <input
                        type="text"
                        name="bankAccount"
                        value={formData.bankAccount}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        name="ifscCode"
                        value={formData.ifscCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Required Documents</h4>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      { type: 'aadhaar', label: 'Aadhaar Card', required: true },
                      { type: 'income', label: 'Income Certificate', required: true },
                      { type: 'bank', label: 'Bank Passbook', required: true },
                      { type: 'marksheet', label: 'Previous Marksheet', required: false },
                      { type: 'college_id', label: 'College ID Card', required: false }
                    ].map((docType) => {
                      const existingDoc = documents.find(d => d.type === docType.type);
                      const isUploading = Array.from(uploadingFiles).some(id => id.startsWith(docType.type));

                      return (
                        <div key={docType.type} className="border border-gray-300 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700">
                              {docType.label} {docType.required && '*'}
                            </label>
                            {existingDoc && existingDoc.verified && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          
                          {existingDoc ? (
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center">
                                <FileText className="w-4 h-4 text-gray-500 mr-2" />
                                <span className="text-sm text-gray-700 truncate">
                                  {existingDoc.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDocument(existingDoc.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="file"
                                id={`file-${docType.type}`}
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => handleFileUpload(e, docType.type)}
                                className="hidden"
                                disabled={isUploading}
                              />
                              <label
                                htmlFor={`file-${docType.type}`}
                                className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${
                                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {isUploading ? (
                                  <Loader className="w-6 h-6 text-gray-400 animate-spin" />
                                ) : (
                                  <>
                                    <Upload className="w-6 h-6 text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1">Upload File</span>
                                  </>
                                )}
                              </label>
                            </div>
                          )}
                          
                          {existingDoc && existingDoc.ocrText && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                              <div className="flex items-center">
                                <AlertCircle className="w-3 h-3 text-blue-500 mr-1" />
                                <span className="text-blue-700">OCR Processed</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Estimated Scholarship Amount */}
                {formData.category && formData.familyIncome > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-md font-medium text-green-800 mb-2">Estimated Scholarship Amount</h4>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{calculateScholarshipAmount(formData.category, formData.familyIncome).toLocaleString()}
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Based on your category and family income
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || documents.length < 3}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};