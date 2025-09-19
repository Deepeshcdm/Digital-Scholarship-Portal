import React, { useState, useEffect } from 'react';
import { Plus, FileText, Clock, CheckCircle, XCircle, DollarSign, Eye } from 'lucide-react';
import { Layout } from '../Layout';
import { getApplicationsByStudent } from '../../utils/storage';
import { Application } from '../../types';
import { ApplicationForm } from './ApplicationForm';
import { ApplicationDetails } from './ApplicationDetails';
import { User } from 'firebase/auth';

interface StudentDashboardProps {
  currentUser: User | null;
  userRole?: string;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentUser, userRole = 'student' }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  useEffect(() => {
    if (currentUser) {
      // For now, using email as userId - you can enhance this with proper user mapping
      const userApplications = getApplicationsByStudent(currentUser.uid);
      setApplications(userApplications);
    }
  }, [currentUser]);

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
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'college_verified': return <FileText className="w-4 h-4" />;
      case 'govt_approved': return <CheckCircle className="w-4 h-4" />;
      case 'disbursed': return <DollarSign className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: Application['status']) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'college_verified': return 'College Verified';
      case 'govt_approved': return 'Government Approved';
      case 'disbursed': return 'Amount Disbursed';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const totalDisbursed = applications
    .filter(app => app.status === 'disbursed')
    .reduce((sum, app) => sum + app.amount, 0);

  const handleApplicationSubmitted = () => {
    setShowApplicationForm(false);
    // Refresh applications
    if (currentUser) {
      const userApplications = getApplicationsByStudent(currentUser.uid);
      setApplications(userApplications);
    }
  };

  if (showApplicationForm) {
    return (
      <ApplicationForm 
        onSubmit={handleApplicationSubmitted}
        onCancel={() => setShowApplicationForm(false)}
      />
    );
  }

  if (selectedApplication) {
    return (
      <ApplicationDetails
        application={selectedApplication}
        onBack={() => setSelectedApplication(null)}
      />
    );
  }

  return (
    <Layout title="Student Dashboard" currentUser={currentUser} userRole={userRole}>
      <div className="px-4 py-6 sm:px-0">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                    <dd className="text-lg font-medium text-gray-900">{applications.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.filter(app => ['submitted', 'college_verified'].includes(app.status)).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {applications.filter(app => ['govt_approved', 'disbursed'].includes(app.status)).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Received</dt>
                    <dd className="text-lg font-medium text-gray-900">₹{totalDisbursed.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowApplicationForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </button>
        </div>

        {/* Applications List */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">My Applications</h3>
            
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new scholarship application.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowApplicationForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Application
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {applications.map((application) => (
                    <li key={application.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getStatusIcon(application.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {application.course} - Semester {application.semester}
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                {getStatusText(application.status)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1 flex items-center space-x-4">
                            <p className="text-sm text-gray-500">
                              Amount: ₹{application.amount.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              Applied: {new Date(application.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => setSelectedApplication(application)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};