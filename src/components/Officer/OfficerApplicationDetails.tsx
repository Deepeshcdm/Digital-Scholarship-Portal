import React, { useState } from 'react';
import { ArrowLeft, FileText, Check, X, AlertTriangle, Download, Eye } from 'lucide-react';
import { Layout } from '../Layout';
import { Application } from '../../types';

interface OfficerApplicationDetailsProps {
  application: Application;
  onBack: () => void;
  onAction: (applicationId: string, action: 'verify' | 'approve' | 'reject', remarks?: string) => void;
  userRole: string;
}

export const OfficerApplicationDetails: React.FC<OfficerApplicationDetailsProps> = ({
  application,
  onBack,
  onAction,
  userRole
}) => {
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const isCollegeOfficer = userRole === 'college_officer';
  const isGovtOfficer = userRole === 'govt_officer';

  const canVerify = isCollegeOfficer && application.status === 'submitted';
  const canApprove = isGovtOfficer && application.status === 'college_verified';
  const canReject = (isCollegeOfficer && application.status === 'submitted') || 
                   (isGovtOfficer && application.status === 'college_verified');

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onAction(application.id, 'reject', rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
    }
  };

  return (
    <Layout title="Application Review">
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Review Application: {application.id}
                </h1>
                <p className="text-sm text-gray-500">
                  Student: {application.studentName} • Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {canVerify && (
                <button
                  onClick={() => onAction(application.id, 'verify')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Verify & Forward
                </button>
              )}
              {canApprove && (
                <button
                  onClick={() => onAction(application.id, 'approve')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve & Disburse
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Application Summary */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Application Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">Scholarship Amount</p>
                      <p className="text-2xl font-bold text-blue-600">₹{application.amount.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-800">Family Income</p>
                      <p className="text-lg font-semibold text-gray-600">₹{application.familyIncome.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Information */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Full Name</label>
                        <p className="text-sm text-gray-900 mt-1">{application.studentName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Aadhaar Number</label>
                        <p className="text-sm text-gray-900 mt-1 font-mono">{application.aadhaar}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone Number</label>
                        <p className="text-sm text-gray-900 mt-1">{application.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email Address</label>
                        <p className="text-sm text-gray-900 mt-1">{application.email}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">College</label>
                        <p className="text-sm text-gray-900 mt-1">{application.college}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Course</label>
                        <p className="text-sm text-gray-900 mt-1">{application.course}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Semester</label>
                        <p className="text-sm text-gray-900 mt-1">{application.semester}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Category</label>
                        <p className="text-sm text-gray-900 mt-1">{application.category}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Account Number</label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{application.bankAccount}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">IFSC Code</label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{application.ifscCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
                  <div className="space-y-4">
                    {application.documents.map((document) => (
                      <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-8 h-8 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {document.type.toUpperCase()} - {document.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Size: {(document.size / 1024).toFixed(1)} KB
                              </p>
                              {document.verified && (
                                <div className="flex items-center mt-1">
                                  <Check className="w-3 h-3 text-green-500 mr-1" />
                                  <span className="text-xs text-green-600">OCR Verified</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {document.ocrText && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
                            <p className="font-medium text-gray-700 mb-1">OCR Extracted Text:</p>
                            <p className="text-gray-600">{document.ocrText.substring(0, 150)}...</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Verification Checklist */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Checklist</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Aadhaar Document', verified: application.documents.find(d => d.type === 'aadhaar')?.verified },
                      { label: 'Income Certificate', verified: application.documents.find(d => d.type === 'income')?.verified },
                      { label: 'Bank Details', verified: application.bankAccount && application.ifscCode },
                      { label: 'Academic Records', verified: application.course && application.semester },
                      { label: 'Eligibility Criteria', verified: application.familyIncome < 800000 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{item.label}</span>
                        {item.verified ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">AI Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <Check className="w-5 h-5 text-green-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Document Authenticity</p>
                        <p className="text-xs text-green-600">OCR validation passed</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Fraud Risk Score</p>
                        <p className="text-xs text-blue-600">Low (12/100)</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                      <FileText className="w-5 h-5 text-yellow-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Data Consistency</p>
                        <p className="text-xs text-yellow-600">95% match across documents</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Blockchain Verification */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Blockchain Verification</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">Block Hash:</p>
                    <p className="text-xs font-mono text-gray-500 break-all bg-gray-50 p-2 rounded">
                      {application.blockchainHash}
                    </p>
                    <div className="flex items-center mt-2">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-xs text-green-600">Verified on blockchain</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Application</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting this application:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
                placeholder="Enter rejection reason..."
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};