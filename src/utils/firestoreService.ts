import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  increment, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// User Management
export const createUserProfile = async (uid: string, phoneNumber: string, role: 'student' | 'college' | 'govt' = 'student') => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      phoneNumber,
      role,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error };
  }
};

export const getUserProfile = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error };
  }
};

// Application Management
export interface ApplicationData {
  studentId: string;
  studentName: string;
  phoneNumber: string;
  course: string;
  college: string;
  amount: number;
  documents?: string[];
  status: 'Pending' | 'Approved' | 'Declined';
  createdAt: any;
  updatedAt: any;
}

export const submitApplication = async (applicationData: Omit<ApplicationData, 'createdAt' | 'updatedAt'>) => {
  try {
    const batch = writeBatch(db);
    
    // Create application document
    const applicationRef = doc(collection(db, 'applications'));
    const applicationId = applicationRef.id;
    
    const fullApplicationData = {
      ...applicationData,
      applicationId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    batch.set(applicationRef, fullApplicationData);
    
    // Update counters
    const countersRef = doc(db, 'counters', 'applications');
    batch.set(countersRef, {
      totalApplications: increment(1),
      pendingReview: increment(1)
    }, { merge: true });
    
    // Create student application reference
    const studentAppRef = doc(db, 'studentApplications', applicationData.studentId, 'applications', applicationId);
    batch.set(studentAppRef, {
      applicationId,
      status: applicationData.status,
      college: applicationData.college,
      amount: applicationData.amount,
      createdAt: serverTimestamp()
    });
    
    // Create college application reference (assuming college ID is derived from college name)
    const collegeId = applicationData.college.toLowerCase().replace(/\s+/g, '_');
    const collegeAppRef = doc(db, 'collegeApplications', collegeId, 'applications', applicationId);
    batch.set(collegeAppRef, {
      applicationId,
      studentId: applicationData.studentId,
      studentName: applicationData.studentName,
      phoneNumber: applicationData.phoneNumber,
      course: applicationData.course,
      amount: applicationData.amount,
      status: applicationData.status,
      createdAt: serverTimestamp()
    });
    
    await batch.commit();
    
    return { success: true, applicationId };
  } catch (error) {
    console.error('Error submitting application:', error);
    return { success: false, error };
  }
};

export const updateApplicationStatus = async (
  applicationId: string, 
  newStatus: 'Approved' | 'Declined',
  collegeId: string,
  studentId: string
) => {
  try {
    const batch = writeBatch(db);
    
    // Update main application
    const applicationRef = doc(db, 'applications', applicationId);
    batch.update(applicationRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    
    // Update student's application
    const studentAppRef = doc(db, 'studentApplications', studentId, 'applications', applicationId);
    batch.update(studentAppRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    
    // Update college's application
    const collegeAppRef = doc(db, 'collegeApplications', collegeId, 'applications', applicationId);
    batch.update(collegeAppRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
    
    // Update counters
    const countersRef = doc(db, 'counters', 'applications');
    if (newStatus === 'Approved' || newStatus === 'Declined') {
      batch.update(countersRef, {
        pendingReview: increment(-1)
      });
    }
    
    await batch.commit();
    
    return { success: true };
  } catch (error) {
    console.error('Error updating application status:', error);
    return { success: false, error };
  }
};

// Real-time listeners
export const subscribeToStudentApplications = (studentId: string, callback: (applications: any[]) => void) => {
  const q = query(
    collection(db, 'studentApplications', studentId, 'applications'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(applications);
  });
};

export const subscribeToCollegeApplications = (collegeId: string, callback: (applications: any[]) => void) => {
  const q = query(
    collection(db, 'collegeApplications', collegeId, 'applications'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(applications);
  });
};

export const subscribeToCounters = (callback: (counters: any) => void) => {
  const countersRef = doc(db, 'counters', 'applications');
  
  return onSnapshot(countersRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback({ totalApplications: 0, pendingReview: 0 });
    }
  });
};