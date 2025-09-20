export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'college_officer' | 'govt_officer';
  aadhaar?: string;
  phone?: string;
  college?: string;
  createdAt: Date;
}

export interface Application {
  id: string;
  studentId: string;
  studentName: string;
  aadhaar: string;
  phone: string;
  email: string;
  college: string;
  course: string;
  semester: number;
  familyIncome: number;
  category: string;
  bankAccount: string;
  ifscCode: string;
  documents: Document[];
  status: 'submitted' | 'college_verified' | 'govt_approved' | 'disbursed' | 'rejected';
  amount: number;
  submittedAt: Date;
  verifiedAt?: Date;
  approvedAt?: Date;
  disbursedAt?: Date;
  remarks?: string;
  blockchainHash: string;
  targetCollegeEmail?: string;
  collegeDomain?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  verified: boolean;
  ocrText?: string;
  size: number;
}

export interface BlockchainBlock {
  index: number;
  timestamp: Date;
  data: {
    applicationId: string;
    studentId: string;
    action: string;
    dataHash: string;
    status: string;
  };
  hash: string;
  previousHash: string;
  nonce: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  read: boolean;
  createdAt: Date;
  applicationId?: string;
  studentEmail?: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
}