import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { FileText, Clock, CheckCircle, XCircle, Eye, Check, X } from 'lucide-react';
import { subscribeToCollegeApplications, updateApplicationStatus, subscribeToCounters } from '../../utils/firestoreService';

interface CollegeDashboardProps {
  currentUser: User;
  onLogout: () => void;
}

export const CollegeDashboard: React.FC<CollegeDashboardProps> = ({
  currentUser,
  onLogout
}) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [counters, setCounters] = useState({ totalApplications: 0, pendingReview: 0 });
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // For demo purposes, using a fixed college ID
  // In production, this would be derived from the user's profile
  const collegeId = 'sri_manakula_vinayagar_engineering_college';

  useEffect(() => {
    // Subscribe to college applications
    const unsubscribeApps = subscribeToCollegeApplications(collegeId, (apps) => {
      setApplications(apps);
      setLoading(false);
    });

    // Subscribe to counters
    const unsubscribeCounters = subscribeToCounters((counters) => {
      setCounters(counters);
    });

    return () => {
      unsubscribeApps();
      unsubscribeCounters();
    };
  }, [collegeId]);

  const handleApplicationAction = async (applicationId: string, action: 'Approved' | 'Declined', studentId: string) => {
    setActionLoading(applicationId);
    
    try {
      const result = await updateApplicationStatus(applicationId, action, collegeId, studentId);
      
      if (result.success) {
        // Close modal if open
        if (selectedApplication?.applicationId === applicationId) {
          setSelectedApplication(null);
        }
      } else {
        alert('Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application status');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'Approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Declined':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingApplications = applications.filter(app => app.status === 'Pending');
  const approvedApplications = applications.filter(app => app.status === 'Approved');
  const declinedApplications = applications.filter(app => app.status === 'Declined');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">College Dashboard</h1>
              <p className="text-sm text-gray-500">Sri Manakula Vinayagar Engineering College</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{pendingApplications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{approvedApplications.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Declined</p>
                <p className="text-2xl font-bold text-gray-900">{declinedApplications.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Scholarship Applications</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-500">Applications will appear here when students submit them.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(application.status)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {application.studentName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Course: {application.course} • Amount: ₹{application.amount?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          Phone: {application.phoneNumber} • Applied: {application.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                        {application.status}
                      </span>
                      
                      {application.status === 'Pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApplicationAction(application.applicationId, 'Approved', application.studentId)}
                            disabled={actionLoading === application.applicationId}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleApplicationAction(application.applicationId, 'Declined', application.studentId)}
                            disabled={actionLoading === application.applicationId}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Decline"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={() => setSelectedApplication(application)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Stats */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Platform Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-700">Total Applications (All Colleges)</p>
              <p className="text-2xl font-bold text-blue-900">{counters.totalApplications}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Pending Review (All Colleges)</p>
              <p className="text-2xl font-bold text-blue-900">{counters.pendingReview}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Student Name</p>
                  <p className="text-gray-900">{selectedApplication.studentName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="text-gray-900">{selectedApplication.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Course</p>
                  <p className="text-gray-900">{selectedApplication.course}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Amount Requested</p>
                  <p className="text-gray-900">₹{selectedApplication.amount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                    {selectedApplication.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Applied Date</p>
                  <p className="text-gray-900">
                    {selectedApplication.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Application ID</p>
                <p className="text-gray-900 font-mono text-sm">{selectedApplication.applicationId}</p>
              </div>
              
              {selectedApplication.status === 'Pending' && (
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleApplicationAction(selectedApplication.applicationId, 'Approved', selectedApplication.studentId)}
                    disabled={actionLoading === selectedApplication.applicationId}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === selectedApplication.applicationId ? 'Processing...' : 'Approve Application'}
                  </button>
                  <button
                    onClick={() => handleApplicationAction(selectedApplication.applicationId, 'Declined', selectedApplication.studentId)}
                    disabled={actionLoading === selectedApplication.applicationId}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-200 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === selectedApplication.applicationId ? 'Processing...' : 'Decline Application'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeDashboard;