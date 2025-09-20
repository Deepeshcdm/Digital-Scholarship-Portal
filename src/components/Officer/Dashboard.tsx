import React, { useState, useEffect } from 'react';
import { FileText, Users, TrendingUp, AlertTriangle, Eye, Check, X } from 'lucide-react';
import { Layout } from '../Layout';
import { getApplications, saveApplication } from '../../utils/storage';
import { NotificationBackend } from '../../utils/notificationBackend';
import { blockchain } from '../../utils/blockchain';
import { fraudDetection } from '../../utils/ai';
import { getUserCollege } from '../../utils/collegeMapping';
import { Application } from '../../types';
import { OfficerApplicationDetails } from './OfficerApplicationDetails';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { User } from 'firebase/auth';

interface OfficerDashboardProps {
  currentUser: User | null;
  userRole?: string;
}

export const OfficerDashboard: React.FC<OfficerDashboardProps> = ({ currentUser, userRole = 'college_officer' }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [fraudReport, setFraudReport] = useState<{ fraudAttempts: number; suspiciousActivities: string[] }>({ fraudAttempts: 0, suspiciousActivities: [] });
  const [activeTab, setActiveTab] = useState<'pending' | 'all' | 'fraud'>('pending');

  // Use the passed userRole instead of hardcoded value
  const isGovtOfficer = userRole === 'govt_officer';
  const isCollegeOfficer = userRole === 'college_officer';

  useEffect(() => {
    loadApplications();
    runFraudDetection();
  }, [currentUser]);

  const loadApplications = () => {
    let allApplications = getApplications();
    
    if (isCollegeOfficer && currentUser?.email) {
      // Get officer's college from their email domain
      const officerCollege = getUserCollege(currentUser.email);
      
      if (officerCollege) {
        // Filter applications only for this college
        allApplications = allApplications.filter(app => {
          // Check if application's college matches officer's college
          return app.collegeDomain === officerCollege.emailDomain ||
                 app.college.toLowerCase().includes(officerCollege.collegeName.toLowerCase()) ||
                 app.college.toLowerCase().includes(officerCollege.collegeCode.toLowerCase());
        });
      }
      
      // Also filter by status for college officers
      allApplications = allApplications.filter(app => 
        app.status === 'submitted' || app.status === 'college_verified'
      );
    } else if (isGovtOfficer) {
      // Govt officers see college-verified applications
      allApplications = allApplications.filter(app => 
        ['college_verified', 'govt_approved', 'disbursed'].includes(app.status)
      );
    }
    
    setApplications(allApplications);
  };

  const runFraudDetection = () => {
    const allApplications = getApplications();
    const blockchainData = blockchain.getChain();
    const report = fraudDetection.detectAnomalies(allApplications, blockchainData);
    setFraudReport(report);
  };

    const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject' | 'verify', remarks?: string) => {
    const application = applications.find(app => app.id === applicationId);
    if (!application || !currentUser) return;

    let newStatus: Application['status'];

    if (action === 'verify' && isCollegeOfficer) {
      newStatus = 'college_verified';
      application.verifiedAt = new Date();
    } else if (action === 'approve' && isGovtOfficer) {
      newStatus = 'govt_approved';
      application.approvedAt = new Date();
    } else if (action === 'reject') {
      newStatus = 'rejected';
      application.remarks = remarks;
    } else {
      return;
    }

    // Update application
    const updatedApplication = { ...application, status: newStatus };
    saveApplication(updatedApplication);

    // Add blockchain entry
    blockchain.addBlock({
      applicationId: application.id,
      studentId: application.studentId,
      action: `application_${action}ed`,
      dataHash: application.blockchainHash,
      status: newStatus
    });

    // Send notification using the new backend service
    await NotificationBackend.notifyStudentOfCollegeAction(
      application.id,
      application.studentId,
      action === 'verify' ? 'verified' : action === 'approve' ? 'approved' : 'rejected',
      currentUser.email || '',
      remarks
    );

    // Mock UPI transfer for approved applications
    if (action === 'approve') {
      setTimeout(async () => {
        const finalApplication = { ...updatedApplication, status: 'disbursed' as const, disbursedAt: new Date() };
        saveApplication(finalApplication);
        
        // Send disbursement notification
        await NotificationBackend.sendNotification({
          id: `notif-${Date.now()}`,
          userId: application.studentId,
          title: '💰 Scholarship Amount Disbursed',
          message: `₹${application.amount.toLocaleString()} has been successfully transferred to your bank account ${application.bankAccount}.`,
          type: 'success',
          read: false,
          createdAt: new Date(),
          applicationId: application.id,
          studentEmail: application.email
        });

        blockchain.addBlock({
          applicationId: application.id,
          studentId: application.studentId,
          action: 'amount_disbursed',
          dataHash: application.blockchainHash,
          status: 'disbursed'
        });

        loadApplications();
      }, 3000);
    }

    loadApplications();
  };

  const getFilteredApplications = () => {
    switch (activeTab) {
      case 'pending':
        return applications.filter(app => 
          (isCollegeOfficer && app.status === 'submitted') ||
          (isGovtOfficer && app.status === 'college_verified')
        );
      case 'fraud':
        return applications.filter(app => 
          fraudReport.suspiciousActivities.some(activity => 
            activity.includes(app.aadhaar) || activity.includes(app.id)
          )
        );
      default:
        return applications;
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(app => 
      (isCollegeOfficer && app.status === 'submitted') ||
      (isGovtOfficer && app.status === 'college_verified')
    ).length,
    approved: applications.filter(app => ['govt_approved', 'disbursed'].includes(app.status)).length,
    disbursed: applications.filter(app => app.status === 'disbursed').reduce((sum, app) => sum + app.amount, 0)
  };

  if (showAnalytics && isGovtOfficer) {
    return <AnalyticsDashboard onBack={() => setShowAnalytics(false)} />;
  }

  if (selectedApplication) {
    return (
      <OfficerApplicationDetails
        application={selectedApplication}
        onBack={() => setSelectedApplication(null)}
        onAction={handleApplicationAction}
        userRole={userRole}
      />
    );
  }

  return (
    <Layout title={`${isGovtOfficer ? 'Government' : 'College'} Officer Dashboard`} currentUser={currentUser} userRole={userRole}>
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
                    <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Review</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Check className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Approved</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.approved}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow-sm rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Amount Disbursed</dt>
                    <dd className="text-lg font-medium text-gray-900">₹{stats.disbursed.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fraud Alert */}
        {fraudReport.fraudAttempts > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Fraud Alert:</strong> {fraudReport.fraudAttempts} suspicious activities detected.
                </p>
                <div className="mt-2 text-sm text-red-600">
                  <ul className="list-disc list-inside">
                    {fraudReport.suspiciousActivities.slice(0, 3).map((activity, index) => (
                      <li key={index}>{activity}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              All Applications
            </button>
            <button
              onClick={() => setActiveTab('fraud')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'fraud'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Suspicious ({fraudReport.fraudAttempts})
            </button>
          </div>

          {isGovtOfficer && (
            <button
              onClick={() => setShowAnalytics(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Analytics
            </button>
          )}
        </div>

        {/* Applications List */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              {activeTab === 'pending' ? 'Pending Applications' : 
               activeTab === 'fraud' ? 'Suspicious Applications' : 'All Applications'}
            </h3>
            
            {getFilteredApplications().length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {activeTab === 'pending' 
                    ? 'No applications are currently pending your review.' 
                    : 'No applications found matching the current filter.'}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredApplications().map((application) => (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {application.studentName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {application.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{application.course}</div>
                          <div className="text-sm text-gray-500">Semester {application.semester}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{application.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            application.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                            application.status === 'college_verified' ? 'bg-yellow-100 text-yellow-800' :
                            application.status === 'govt_approved' ? 'bg-green-100 text-green-800' :
                            application.status === 'disbursed' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {application.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(application.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setSelectedApplication(application)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {((isCollegeOfficer && application.status === 'submitted') ||
                              (isGovtOfficer && application.status === 'college_verified')) && (
                              <>
                                <button
                                  onClick={() => handleApplicationAction(
                                    application.id, 
                                    isCollegeOfficer ? 'verify' : 'approve'
                                  )}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason) {
                                      handleApplicationAction(application.id, 'reject', reason);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};