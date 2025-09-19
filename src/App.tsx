import { useState, useEffect } from 'react';
import { onAuthStateChange } from './utils/auth';
import { Login } from './components/Auth/Login';
import { SignUp } from './components/Auth/SignUp';
import { StudentDashboard } from './components/Student/Dashboard';
import { OfficerDashboard } from './components/Officer/Dashboard';
import { User } from 'firebase/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChange((user: User | null) => {
      if (user) {
        setIsAuthenticated(true);
        // You can set role based on user data or from Firestore
        // For now, defaulting to student - you can enhance this
        setUserRole('student');
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogin = (userData: any) => {
    setIsAuthenticated(true);
    setUserRole(userData.role || 'student');
    setShowSignUp(false);
  };

  const handleSignUp = (userData: any) => {
    setIsAuthenticated(true);
    setUserRole(userData.role || 'student');
    setShowSignUp(false);
  };

  const switchToSignUp = () => {
    setShowSignUp(true);
  };

  const switchToLogin = () => {
    setShowSignUp(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showSignUp) {
      return <SignUp onSignUp={handleSignUp} onSwitchToLogin={switchToLogin} />;
    }
    return <Login onLogin={handleLogin} onSwitchToSignUp={switchToSignUp} />;
  }

  switch (userRole) {
    case 'student':
      return <StudentDashboard />;
    case 'college_officer':
    case 'govt_officer':
      return <OfficerDashboard />;
    default:
      return <Login onLogin={handleLogin} onSwitchToSignUp={switchToSignUp} />;
  }
}

export default App;