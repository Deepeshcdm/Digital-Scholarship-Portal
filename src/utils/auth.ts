import CryptoJS from 'crypto-js';
import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';

const SECRET_KEY = 'scholarship-secret-key-2025';

export interface AuthToken {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

export const generateToken = (user: any): string => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };

  return CryptoJS.AES.encrypt(JSON.stringify(payload), SECRET_KEY).toString();
};

export const verifyToken = (token: string): AuthToken | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(token, SECRET_KEY);
    const payload = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

export const getCurrentUser = (): AuthToken | null => {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  return verifyToken(token);
};

export const logout = () => {
  localStorage.removeItem('auth_token');
  window.location.reload();
};

// Firebase Authentication Functions
export const firebaseLogin = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase login error:', error);
    throw error;
  }
};

export const firebaseRegister = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase register error:', error);
    throw error;
  }
};

export const firebaseLogout = async () => {
  try {
    await firebaseSignOut(auth);
    localStorage.removeItem('auth_token');
    window.location.reload();
  } catch (error) {
    console.error('Firebase logout error:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Phone Authentication Functions
let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

export const initializeRecaptcha = (containerId: string) => {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('Recaptcha verified');
      },
      'expired-callback': () => {
        console.log('Recaptcha expired');
      }
    });
  }
  return recaptchaVerifier;
};

export const sendPhoneOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
  try {
    if (!recaptchaVerifier) {
      throw new Error('Recaptcha not initialized');
    }

    // Format phone number for India (+91)
    const formattedNumber = phoneNumber.startsWith('+91') ? phoneNumber : `+91${phoneNumber}`;
    
    confirmationResult = await signInWithPhoneNumber(auth, formattedNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }
};

export const verifyPhoneOTP = async (otp: string): Promise<User> => {
  try {
    if (!confirmationResult) {
      throw new Error('No confirmation result available');
    }

    const result = await confirmationResult.confirm(otp);
    return result.user;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// User Management Functions
export const storeUserData = async (userData: any) => {
  try {
    await setDoc(doc(db, 'users', userData.uid), userData);
  } catch (error) {
    console.error('Error storing user data:', error);
    throw error;
  }
};

export const getUserData = async (uid: string) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

export const getUserByPhoneNumber = async (phoneNumber: string) => {
  try {
    const q = query(collection(db, 'users'), where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error finding user by phone:', error);
    throw error;
  }
};

export const cleanupRecaptcha = () => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  confirmationResult = null;
};