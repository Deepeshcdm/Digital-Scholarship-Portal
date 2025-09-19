// Mock AI utilities for demonstration
export class ChatBot {
  private faqData = [
    {
      keywords: ['apply', 'application', 'how to'],
      response: 'To apply for a scholarship, log in to the student portal, fill out the application form with your details, upload required documents (Aadhaar, income certificate, bank passbook), and submit. You can track your application status in real-time.'
    },
    {
      keywords: ['documents', 'required', 'upload'],
      response: 'Required documents include: 1) Aadhaar Card, 2) Income Certificate, 3) Bank Passbook, 4) College ID Card, 5) Previous semester marksheets. All documents should be in PDF or image format (max 5MB each).'
    },
    {
      keywords: ['status', 'track', 'progress'],
      response: 'You can track your application status in the student dashboard. Status progression: Submitted → College Verified → Government Approved → Amount Disbursed. You\'ll receive notifications at each stage.'
    },
    {
      keywords: ['eligibility', 'eligible', 'criteria'],
      response: 'Eligibility criteria: 1) Family income below ₹8 lakhs annually, 2) Enrolled in recognized college/university, 3) Minimum 60% marks in previous semester, 4) Indian citizen with valid Aadhaar card.'
    },
    {
      keywords: ['amount', 'money', 'scholarship amount'],
      response: 'Scholarship amounts vary by category: General - ₹25,000, OBC - ₹30,000, SC/ST - ₹35,000, Differently Abled - ₹40,000. Amount is directly transferred to your bank account after approval.'
    },
    {
      keywords: ['help', 'support', 'contact'],
      response: 'For technical support, contact our helpdesk at support@scholarship.gov.in or call 1800-XXX-XXXX (Mon-Fri, 9 AM - 6 PM). You can also use this chatbot for quick answers to common questions.'
    }
  ];

  getResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    for (const faq of this.faqData) {
      if (faq.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return faq.response;
      }
    }
    
    return 'I understand you need help. Here are some topics I can assist with: application process, required documents, eligibility criteria, status tracking, and scholarship amounts. Please ask more specifically about any of these topics.';
  }
}

export class OCRService {
  // Mock OCR service - in real implementation, would use Tesseract.js
  async extractText(file: File): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock OCR results based on file name patterns
        const fileName = file.name.toLowerCase();
        
        if (fileName.includes('aadhaar') || fileName.includes('aadhar')) {
          resolve('AADHAAR CARD\nName: RAHUL KUMAR\nAadhaar Number: 1234 5678 9012\nDOB: 15/06/2002\nAddress: 123 Main Street, Delhi 110001');
        } else if (fileName.includes('income')) {
          resolve('INCOME CERTIFICATE\nFamily Annual Income: Rs. 4,50,000\nIssued by: District Collector\nValid until: 31/12/2025');
        } else if (fileName.includes('bank')) {
          resolve('BANK PASSBOOK\nAccount Holder: RAHUL KUMAR\nAccount Number: 123456789012\nIFSC: SBIN0001234\nBank: State Bank of India');
        } else {
          resolve('Document text extracted successfully. Content verified and processed.');
        }
      }, 2000); // Simulate OCR processing time
    });
  }

  validateDocument(extractedText: string, expectedData: any): { isValid: boolean; confidence: number; issues: string[] } {
    const issues: string[] = [];
    let confidence = 0.9;

    // Mock validation logic
    if (expectedData.aadhaar && !extractedText.includes(expectedData.aadhaar.replace(/\s/g, ''))) {
      issues.push('Aadhaar number mismatch detected');
      confidence -= 0.3;
    }

    if (expectedData.name && !extractedText.toUpperCase().includes(expectedData.name.toUpperCase())) {
      issues.push('Name verification failed');
      confidence -= 0.2;
    }

    return {
      isValid: issues.length === 0,
      confidence: Math.max(confidence, 0.1),
      issues
    };
  }
}

export class FraudDetection {
  detectAnomalies(applications: any[], blockchain: any[]): { fraudAttempts: number; suspiciousActivities: string[] } {
    const suspiciousActivities: string[] = [];
    let fraudAttempts = 0;

    // Check for duplicate applications
    const aadhaarMap = new Map();
    applications.forEach(app => {
      if (aadhaarMap.has(app.aadhaar)) {
        suspiciousActivities.push(`Duplicate Aadhaar application detected: ${app.aadhaar}`);
        fraudAttempts++;
      } else {
        aadhaarMap.set(app.aadhaar, app.id);
      }
    });

    // Check blockchain integrity
    if (!this.validateBlockchainIntegrity(blockchain)) {
      suspiciousActivities.push('Blockchain tampering detected - data integrity compromised');
      fraudAttempts++;
    }

    // Check for unusual patterns
    const recentApplications = applications.filter(app => 
      Date.now() - new Date(app.submittedAt).getTime() < 24 * 60 * 60 * 1000
    );
    
    if (recentApplications.length > 50) {
      suspiciousActivities.push('Unusual spike in applications detected');
      fraudAttempts++;
    }

    return { fraudAttempts, suspiciousActivities };
  }

  private validateBlockchainIntegrity(blockchain: any[]): boolean {
    // Mock blockchain validation
    return blockchain.length > 0 && blockchain[0].data.applicationId === 'genesis';
  }
}

export const chatBot = new ChatBot();
export const ocrService = new OCRService();
export const fraudDetection = new FraudDetection();