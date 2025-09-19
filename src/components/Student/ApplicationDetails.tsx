import React from 'react';
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, DollarSign, Download } from 'lucide-react';
import { Layout } from '../Layout';
import { Application } from '../../types';

interface ApplicationDetailsProps {
  application: Application;
  onBack: () => void;
}

export const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({ application, onBack }) => {
  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'college_verified': return 'bg-yellow-100 text-yellow-800';
      case 'govt_approved': return 'bg-green-100 text-green-800';
      case 'disbursed': return 'bg-emerald-100 text-emerald-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'submitted': return <Clock className="w-5 h-5" />;
      case 'college_verified': return <FileText className="w-5 h-5" />;
      case 'govt_approved': return <CheckCircle className="w-5 h-5" />;
      case 'disbursed': return <DollarSign className="w-5 h-5" />;
      case 'rejected': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const statusSteps = [
    { key: 'submitted', label: 'Submitted', date: application.submittedAt },
    { key: 'college_verified', label: 'College Verified', date: application.verifiedAt },
    { key: 'govt_approved', label: 'Government Approved', date: application.approvedAt },
    { key: 'disbursed', label: 'Amount Disbursed', date: application.disbursedAt }
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.key === application.status);
  const isRejected = application.status === 'rejected';

  return (
    <Layout title="Application Details">
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-4xl mx-auto">
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
                <h1 className="text-2xl font-bold text-gray-900">Application {application.id}</h1>
                <p className="text-sm text-gray-500">
                  Submitted on {new Date(application.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className={`flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
              {getStatusIcon(application.status)}
              <span className="ml-2">{application.status.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Application Progress</h3>
              
              {!isRejected ? (
                <div className="relative">
                  <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-200"></div>
                  <div className="space-y-6">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      
                      return (
                        <div key={step.key} className="relative flex items-center">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                            isCompleted 
                              ? 'bg-blue-600 border-blue-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                            )}
                          </div>
                          <div className="ml-4">
                            <p className={`text-sm font-medium ${
                              isCompleted ? 'text-gray-900' : 'text-gray-500'
                            }`}>
                              {step.label}
                            </p>
                            {step.date && (
                              <p className="text-xs text-gray-500">
                                {new Date(step.date).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center p-4 bg-red-50 rounded-lg">
                  <XCircle className="w-8 h-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-red-800 font-medium">Application Rejected</p>
                    {application.remarks && (
                      <p className="text-red-600 text-sm mt-1">{application.remarks}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Application Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="text-sm text-gray-900">{application.studentName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Aadhaar Number</dt>
                    <dd className="text-sm text-gray-900">{application.aadhaar}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-sm text-gray-900">{application.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{application.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Category</dt>
                    <dd className="text-sm text-gray-900">{application.category}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">College</dt>
                    <dd className="text-sm text-gray-900">{application.college}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Course</dt>
                    <dd className="text-sm text-gray-900">{application.course}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Semester</dt>
                    <dd className="text-sm text-gray-900">{application.semester}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Family Income</dt>
                    <dd className="text-sm text-gray-900">₹{application.familyIncome.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Scholarship Amount</dt>
                    <dd className="text-sm font-bold text-green-600">₹{application.amount.toLocaleString()}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg shadow-sm mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Uploaded Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {application.documents.map((document) => (
                  <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{document.type}</span>
                      </div>
                      {document.verified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2 truncate">{document.name}</p>
                    <p className="text-xs text-gray-400">Size: {(document.size / 1024).toFixed(1)} KB</p>
                    <button className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-800">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Blockchain Verification */}
          <div className="bg-white rounded-lg shadow-sm mt-6">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Blockchain Verification</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Blockchain Hash</p>
                    <p className="text-xs text-gray-500 font-mono mt-1 break-all">
                      {application.blockchainHash}
                    </p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  This application is secured on the blockchain and cannot be tampered with.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};