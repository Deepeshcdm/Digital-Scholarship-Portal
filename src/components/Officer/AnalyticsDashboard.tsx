import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Users, DollarSign, AlertTriangle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Layout } from '../Layout';
import { getApplications } from '../../utils/storage';
import { blockchain } from '../../utils/blockchain';
import { fraudDetection } from '../../utils/ai';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsDashboardProps {
  onBack: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onBack }) => {
  const [applications, setApplications] = useState(getApplications());
  const [fraudReport, setFraudReport] = useState({ fraudAttempts: 0, suspiciousActivities: [] });

  useEffect(() => {
    const report = fraudDetection.detectAnomalies(applications, blockchain.getChain());
    setFraudReport(report);
  }, [applications]);

  // Calculate metrics
  const totalApplications = applications.length;
  const totalApproved = applications.filter(app => ['govt_approved', 'disbursed'].includes(app.status)).length;
  const totalDisbursed = applications.filter(app => app.status === 'disbursed').reduce((sum, app) => sum + app.amount, 0);
  const approvalRate = totalApplications > 0 ? (totalApproved / totalApplications * 100).toFixed(1) : '0';

  // Application status distribution
  const statusDistribution = {
    labels: ['Submitted', 'College Verified', 'Govt Approved', 'Disbursed', 'Rejected'],
    datasets: [
      {
        data: [
          applications.filter(app => app.status === 'submitted').length,
          applications.filter(app => app.status === 'college_verified').length,
          applications.filter(app => app.status === 'govt_approved').length,
          applications.filter(app => app.status === 'disbursed').length,
          applications.filter(app => app.status === 'rejected').length,
        ],
        backgroundColor: [
          '#3B82F6',
          '#F59E0B',
          '#10B981',
          '#059669',
          '#EF4444'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  };

  // Monthly trends
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }).reverse();

  const monthlyData = {
    labels: last6Months,
    datasets: [
      {
        label: 'Applications',
        data: last6Months.map(() => Math.floor(Math.random() * 50) + 10),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Disbursals',
        data: last6Months.map(() => Math.floor(Math.random() * 30) + 5),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      }
    ]
  };

  // Category-wise distribution
  const categoryData = {
    labels: ['General', 'OBC', 'SC', 'ST', 'Differently Abled'],
    datasets: [
      {
        label: 'Applications',
        data: [
          applications.filter(app => app.category === 'General').length || 15,
          applications.filter(app => app.category === 'OBC').length || 12,
          applications.filter(app => app.category === 'SC').length || 8,
          applications.filter(app => app.category === 'ST').length || 6,
          applications.filter(app => app.category === 'Differently Abled').length || 3,
        ],
        backgroundColor: [
          '#3B82F6',
          '#8B5CF6',
          '#F59E0B',
          '#EF4444',
          '#10B981'
        ]
      }
    ]
  };

  // Amount disbursed by month
  const disbursalData = {
    labels: last6Months,
    datasets: [
      {
        label: 'Amount Disbursed (₹ Lakhs)',
        data: last6Months.map(() => Math.floor(Math.random() * 50) + 20),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  return (
    <Layout title="Analytics Dashboard">
      <div className="px-4 py-6 sm:px-0">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-500">Comprehensive insights and trends</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Applications</dt>
                      <dd className="text-lg font-medium text-gray-900">{totalApplications}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Approval Rate</dt>
                      <dd className="text-lg font-medium text-gray-900">{approvalRate}%</dd>
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
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Disbursed</dt>
                      <dd className="text-lg font-medium text-gray-900">₹{totalDisbursed.toLocaleString()}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Fraud Attempts</dt>
                      <dd className="text-lg font-medium text-gray-900">{fraudReport.fraudAttempts}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Application Status Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Application Status Distribution</h3>
              <div className="h-64">
                <Doughnut data={statusDistribution} options={doughnutOptions} />
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h3>
              <div className="h-64">
                <Line data={monthlyData} options={chartOptions} />
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Applications by Category</h3>
              <div className="h-64">
                <Bar data={categoryData} options={chartOptions} />
              </div>
            </div>

            {/* Disbursal Trends */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Disbursals</h3>
              <div className="h-64">
                <Bar data={disbursalData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* Fraud Detection Report */}
          {fraudReport.fraudAttempts > 0 && (
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  Fraud Detection Report
                </h3>
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        <strong>{fraudReport.fraudAttempts}</strong> suspicious activities detected
                      </p>
                      <div className="mt-2 text-sm text-red-600">
                        <ul className="list-disc list-inside space-y-1">
                          {fraudReport.suspiciousActivities.map((activity, index) => (
                            <li key={index}>{activity}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Statistics */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Processing Times</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Average College Verification:</span>
                      <span className="font-medium">2.3 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Govt Approval:</span>
                      <span className="font-medium">4.1 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Disbursement:</span>
                      <span className="font-medium">1.2 days</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Success Rates</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>College Verification Rate:</span>
                      <span className="font-medium text-green-600">94.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Government Approval Rate:</span>
                      <span className="font-medium text-green-600">89.6%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Disbursement Success Rate:</span>
                      <span className="font-medium text-green-600">99.8%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Blockchain Stats</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Blocks:</span>
                      <span className="font-medium">{blockchain.getChain().length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Chain Integrity:</span>
                      <span className="font-medium text-green-600">
                        {blockchain.isChainValid() ? 'Valid' : 'Invalid'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Block Time:</span>
                      <span className="font-medium">
                        {new Date(blockchain.getLatestBlock().timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};