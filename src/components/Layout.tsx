import React, { useState, useEffect } from 'react';
import { User, LogOut, Bell, MessageCircle } from 'lucide-react';
import { firebaseLogout } from '../utils/auth';
import { getNotificationsByUser } from '../utils/storage';
import { ChatBot } from './ChatBot';
import { User as FirebaseUser } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  currentUser: FirebaseUser | null;
  userRole?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, currentUser, userRole = 'student' }) => {
  const [showChatBot, setShowChatBot] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (currentUser) {
      const notifications = getNotificationsByUser(currentUser.uid);
      setUnreadNotifications(notifications.filter(n => !n.read).length);
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await firebaseLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'student': return 'Student';
      case 'college_officer': return 'College Officer';
      case 'govt_officer': return 'Government Officer';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-blue-100 text-blue-800';
      case 'college_officer': return 'bg-teal-100 text-teal-800';
      case 'govt_officer': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  Digital Scholarship Portal
                </h1>
              </div>
              <div className="ml-4">
                <span className="text-sm text-gray-500">{title}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* ChatBot Toggle */}
              <button
                onClick={() => setShowChatBot(!showChatBot)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              {/* User Info */}
              {currentUser && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {currentUser.email}
                    </div>
                    <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userRole)}`}>
                      {getRoleDisplayName(userRole)}
                    </div>
                  </div>
                  <User className="w-8 h-8 text-gray-600" />
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* ChatBot Modal */}
      {showChatBot && (
        <ChatBot onClose={() => setShowChatBot(false)} />
      )}
    </div>
  );
};