// Backend Simulation for Notification System
import type { Notification } from '../types';

// Simulated backend storage for notifications
let notificationStorage: Notification[] = JSON.parse(localStorage.getItem('notifications') || '[]');

// Simulated college officer accounts (in real system, this would be in database)
const collegeOfficerAccounts: { [email: string]: any } = {
  'scholarships@smvec.ac.in': {
    name: 'Dr. Rajesh Kumar',
    role: 'college_officer',
    college: 'Sri Manakula Vinayagar Engineering College',
    department: 'Student Affairs'
  },
  'scholarships@ceg.ac.in': {
    name: 'Prof. Priya Sharma',
    role: 'college_officer',
    college: 'College of Engineering Guindy',
    department: 'Academic Affairs'
  },
  'scholarships@psg.ac.in': {
    name: 'Dr. Suresh Babu',
    role: 'college_officer',
    college: 'PSG College of Technology',
    department: 'Student Welfare'
  },
  'scholarships@vit.ac.in': {
    name: 'Ms. Kavitha Reddy',
    role: 'college_officer',
    college: 'Vellore Institute of Technology',
    department: 'Scholarships Office'
  }
};

/**
 * Backend Service for Notification Management
 */
export class NotificationBackend {
  /**
   * Send notification to specific user
   */
  static async sendNotification(notification: Notification): Promise<boolean> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add to storage
      notificationStorage.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notificationStorage));
      
      // Simulate real-time push notification
      if (typeof window !== 'undefined') {
        this.showPushNotification(notification);
      }
      
      console.log(`📧 Notification sent to ${notification.userId}: ${notification.title}`);
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  /**
   * Get notifications for a specific user
   */
  static getNotificationsForUser(userId: string): Notification[] {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications.filter((notif: Notification) => notif.userId === userId);
  }

  /**
   * Mark notification as read
   */
  static markAsRead(notificationId: string): void {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updated = notifications.map((notif: Notification) => 
      notif.id === notificationId ? { ...notif, read: true } : notif
    );
    localStorage.setItem('notifications', JSON.stringify(updated));
  }

  /**
   * Simulate push notification in browser
   */
  static showPushNotification(notification: Notification): void {
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    } else {
      // Fallback to in-app notification
      this.showInAppNotification(notification);
    }
  }

  /**
   * Show in-app notification
   */
  static showInAppNotification(notification: Notification): void {
    // Create notification element
    const notifElement = document.createElement('div');
    notifElement.className = `
      fixed top-4 right-4 z-50 max-w-sm w-full bg-white border border-gray-200 rounded-lg shadow-lg
      transform transition-all duration-300 ease-in-out translate-x-full
    `;
    
    const typeColors = {
      success: 'border-green-400 bg-green-50',
      error: 'border-red-400 bg-red-50',
      warning: 'border-yellow-400 bg-yellow-50',
      info: 'border-blue-400 bg-blue-50'
    };

    notifElement.innerHTML = `
      <div class="p-4 ${typeColors[notification.type] || typeColors.info}">
        <div class="flex items-start">
          <div class="flex-1">
            <h4 class="text-sm font-medium text-gray-900">${notification.title}</h4>
            <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
          </div>
          <button class="ml-4 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(notifElement);

    // Animate in
    setTimeout(() => {
      notifElement.classList.remove('translate-x-full');
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      notifElement.classList.add('translate-x-full');
      setTimeout(() => {
        if (notifElement.parentNode) {
          notifElement.parentNode.removeChild(notifElement);
        }
      }, 300);
    }, 5000);
  }

  /**
   * Request notification permission
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Simulate college officer action notification to student
   */
  static async notifyStudentOfCollegeAction(
    applicationId: string,
    studentId: string,
    action: 'approved' | 'rejected' | 'verified',
    officerEmail: string,
    remarks?: string
  ): Promise<void> {
    const officer = collegeOfficerAccounts[officerEmail];
    
    let title = '';
    let message = '';
    let type: Notification['type'] = 'info';

    switch (action) {
      case 'verified':
        title = '✅ Application Verified by College';
        message = `Your application ${applicationId} has been verified by ${officer?.name || 'College Officer'} at ${officer?.college || 'your college'}. It will now be forwarded for government approval.`;
        type = 'success';
        break;
      case 'approved':
        title = '🎉 Application Approved!';
        message = `Congratulations! Your application ${applicationId} has been approved by ${officer?.name || 'College Officer'} at ${officer?.college || 'your college'}.`;
        type = 'success';
        break;
      case 'rejected':
        title = '❌ Application Rejected';
        message = `Your application ${applicationId} has been rejected by ${officer?.name || 'College Officer'} at ${officer?.college || 'your college'}. ${remarks ? `Reason: ${remarks}` : 'Please contact the college for more information.'}`;
        type = 'error';
        break;
    }

    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: studentId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
      applicationId,
      studentEmail: studentId // In real system, this would be different
    };

    await this.sendNotification(notification);
  }

  /**
   * Get college officer info by email
   */
  static getCollegeOfficerInfo(email: string) {
    return collegeOfficerAccounts[email] || null;
  }

  /**
   * Simulate real-time notification updates
   */
  static startNotificationPolling(userId: string, callback: (notifications: Notification[]) => void): () => void {
    const poll = () => {
      const notifications = this.getNotificationsForUser(userId);
      callback(notifications);
    };

    // Initial call
    poll();

    // Poll every 5 seconds (in real app, this would be WebSocket or Server-Sent Events)
    const interval = setInterval(poll, 5000);

    // Cleanup function
    return () => clearInterval(interval);
  }
}

// Initialize notification permission request
if (typeof window !== 'undefined') {
  NotificationBackend.requestNotificationPermission();
}