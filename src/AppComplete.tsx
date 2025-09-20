import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './utils/firebase';
import { getUserProfile } from './utils/firestoreService';
import { PhoneAuthComplete } from './components/Auth/PhoneAuthComplete';
import { StudentDashboardNew } from './components/Student/StudentDashboardNew';
import { CollegeDashboard } from './components/College/CollegeDashboard';

function AppComplete() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        
        // Get user role from Firestore
        const profile = await getUserProfile(user.uid);
        if (profile.success) {
          setUserRole(profile.data.role);
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (user: User, role: string) => {
    setUser(user);
    setUserRole(role);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <PhoneAuthComplete onAuthSuccess={handleAuthSuccess} />;
  }

  // Route based on user role
  switch (userRole) {
    case 'student':
      return <StudentDashboardNew currentUser={user} onLogout={handleLogout} />;
    case 'college':
      return <CollegeDashboard currentUser={user} onLogout={handleLogout} />;
    case 'govt':
      // Government dashboard would go here
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Government Dashboard</h1>
            <p className="text-gray-600 mb-4">Coming soon...</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Logout
            </button>
          </div>
        </div>
      );
    default:
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Role</h1>
            <p className="text-gray-600 mb-4">Your account role is not recognized.</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Logout
            </button>
          </div>
        </div>
      );
  }
}

export default AppComplete;