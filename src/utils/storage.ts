import { User, Application, Notification } from '../types';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'scholarship-encryption-2025';

// Encrypt sensitive data
export const encryptData = (data: any): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

// Decrypt sensitive data
export const decryptData = (encryptedData: string): any => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

// User management
export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem('users', encryptData(users));
};

export const getUsers = (): User[] => {
  const stored = localStorage.getItem('users');
  if (!stored) return [];
  
  try {
    return decryptData(stored);
  } catch {
    return [];
  }
};

export const getUserByEmail = (email: string): User | null => {
  const users = getUsers();
  return users.find(u => u.email === email) || null;
};

export const getUserById = (id: string): User | null => {
  const users = getUsers();
  return users.find(u => u.id === id) || null;
};

// Application management
export const saveApplication = (application: Application): void => {
  const applications = getApplications();
  const existingIndex = applications.findIndex(a => a.id === application.id);
  
  if (existingIndex >= 0) {
    applications[existingIndex] = application;
  } else {
    applications.push(application);
  }
  
  localStorage.setItem('applications', encryptData(applications));
};

export const getApplications = (): Application[] => {
  const stored = localStorage.getItem('applications');
  if (!stored) return [];
  
  try {
    return decryptData(stored);
  } catch {
    return [];
  }
};

export const getApplicationsByStudent = (studentId: string): Application[] => {
  return getApplications().filter(a => a.studentId === studentId);
};

export const getApplicationsByStatus = (status: Application['status']): Application[] => {
  return getApplications().filter(a => a.status === status);
};

// Notification management
export const saveNotification = (notification: Notification): void => {
  const notifications = getNotifications();
  notifications.unshift(notification);
  localStorage.setItem('notifications', encryptData(notifications.slice(0, 100))); // Keep last 100
};

export const getNotifications = (): Notification[] => {
  const stored = localStorage.getItem('notifications');
  if (!stored) return [];
  
  try {
    return decryptData(stored);
  } catch {
    return [];
  }
};

export const getNotificationsByUser = (userId: string): Notification[] => {
  return getNotifications().filter(n => n.userId === userId);
};

export const markNotificationRead = (notificationId: string): void => {
  const notifications = getNotifications();
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    localStorage.setItem('notifications', encryptData(notifications));
  }
};

// Initialize demo data
export const initializeDemoData = (): void => {
  if (getUsers().length === 0) {
    const demoUsers: User[] = [
      {
        id: '1',
        email: 'student@demo.com',
        name: 'Rahul Kumar',
        role: 'student',
        aadhaar: '123456789012',
        phone: '+91-9876543210',
        college: 'ABC Engineering College',
        createdAt: new Date()
      },
      {
        id: '2',
        email: 'college@demo.com',
        name: 'Dr. Priya Sharma',
        role: 'college_officer',
        college: 'ABC Engineering College',
        createdAt: new Date()
      },
      {
        id: '3',
        email: 'govt@demo.com',
        name: 'Amit Singh',
        role: 'govt_officer',
        createdAt: new Date()
      }
    ];
    
    demoUsers.forEach(saveUser);
  }
};