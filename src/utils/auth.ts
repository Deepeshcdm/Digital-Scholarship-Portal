import CryptoJS from 'crypto-js';
import { auth } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

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