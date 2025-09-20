// Demo Script for Testing Complete Notification Workflow
// This simulates the complete flow from student application to college officer action

import { NotificationBackend } from '../utils/notificationBackend';
import { generateEmailDomain } from '../utils/smartEmailGenerator';
import type { Application } from '../types';

/**
 * Demo script that simulates the complete workflow:
 * 1. Student submits application
 * 2. Application is routed to correct college officer
 * 3. College officer takes action (approve/reject/verify)
 * 4. Student receives real-time notification
 */
export class WorkflowDemo {
  
  /**
   * Simulate a student application submission
   */
  static async simulateStudentApplication(collegeName: string, studentEmail: string): Promise<string> {
    console.log('🎓 Student Application Demo Started');
    console.log(`📋 College: ${collegeName}`);
    console.log(`👨‍🎓 Student: ${studentEmail}`);
    
    // Generate college officer email using smart generator
    const { domain, confidence } = generateEmailDomain(collegeName);
    const collegeOfficerEmail = `scholarships@${domain}`;
    
    console.log(`🎯 Target College Officer: ${collegeOfficerEmail} (confidence: ${confidence}%)`);
    
    // Create mock application
    const applicationId = `APP-${Date.now()}`;
    const mockApplication: Partial<Application> = {
      id: applicationId,
      studentName: 'Rajesh Kumar',
      email: studentEmail,
      college: collegeName,
      course: 'Computer Science Engineering',
      semester: 5,
      amount: 50000,
      targetCollegeEmail: collegeOfficerEmail,
      collegeDomain: domain,
      status: 'submitted',
      submittedAt: new Date()
    };
    
    // Notify college officer about new application
    await NotificationBackend.sendNotification({
      id: `notif-officer-${Date.now()}`,
      userId: collegeOfficerEmail,
      title: '📝 New Scholarship Application Received',
      message: `${mockApplication.studentName} has submitted a scholarship application for ${mockApplication.course}. Amount: ₹${mockApplication.amount?.toLocaleString()}`,
      type: 'info',
      read: false,
      createdAt: new Date(),
      applicationId,
      studentEmail
    });
    
    // Notify student about submission
    await NotificationBackend.sendNotification({
      id: `notif-student-${Date.now()}`,
      userId: studentEmail,
      title: '✅ Application Submitted Successfully',
      message: `Your scholarship application has been submitted and forwarded to ${collegeName}. You will be notified once the college reviews your application.`,
      type: 'success',
      read: false,
      createdAt: new Date(),
      applicationId,
      studentEmail
    });
    
    console.log('✅ Application submitted and notifications sent!');
    return applicationId;
  }
  
  /**
   * Simulate college officer action
   */
  static async simulateCollegeOfficerAction(
    applicationId: string,
    studentEmail: string,
    officerEmail: string,
    action: 'approved' | 'rejected' | 'verified',
    remarks?: string
  ): Promise<void> {
    console.log('\n🏛️ College Officer Action Demo');
    console.log(`👔 Officer: ${officerEmail}`);
    console.log(`📋 Application: ${applicationId}`);
    console.log(`🎯 Action: ${action}`);
    
    // Get officer info
    const officerInfo = NotificationBackend.getCollegeOfficerInfo(officerEmail);
    
    if (!officerInfo) {
      console.log('❌ Officer not found in system');
      return;
    }
    
    console.log(`👤 Officer: ${officerInfo.name} - ${officerInfo.department}`);
    
    // Send notification to student
    await NotificationBackend.notifyStudentOfCollegeAction(
      applicationId,
      studentEmail,
      action,
      officerEmail,
      remarks
    );
    
    // If approved by college, simulate government forwarding
    if (action === 'verified') {
      setTimeout(async () => {
        await NotificationBackend.sendNotification({
          id: `notif-govt-${Date.now()}`,
          userId: 'government@tn.gov.in',
          title: '📋 College Verified Application - Government Review Required',
          message: `Application ${applicationId} has been verified by ${officerInfo.college} and requires government approval.`,
          type: 'info',
          read: false,
          createdAt: new Date(),
          applicationId,
          studentEmail
        });
        
        console.log('📤 Application forwarded to government for final approval');
      }, 1000);
    }
    
    console.log(`✅ ${action} notification sent to student!`);
  }
  
  /**
   * Simulate government officer final approval
   */
  static async simulateGovernmentAction(
    applicationId: string,
    studentEmail: string,
    action: 'approved' | 'rejected'
  ): Promise<void> {
    console.log('\n🏛️ Government Officer Action Demo');
    console.log(`📋 Application: ${applicationId}`);
    console.log(`🎯 Final Action: ${action}`);
    
    if (action === 'approved') {
      // Send approval notification
      await NotificationBackend.sendNotification({
        id: `notif-final-${Date.now()}`,
        userId: studentEmail,
        title: '🎉 Scholarship Approved by Government!',
        message: `Congratulations! Your scholarship application ${applicationId} has been approved by the Tamil Nadu Government. Amount will be disbursed within 7 working days.`,
        type: 'success',
        read: false,
        createdAt: new Date(),
        applicationId,
        studentEmail
      });
      
      // Simulate disbursement after 3 seconds
      setTimeout(async () => {
        await NotificationBackend.sendNotification({
          id: `notif-disbursed-${Date.now()}`,
          userId: studentEmail,
          title: '💰 Scholarship Amount Disbursed!',
          message: `₹50,000 has been successfully transferred to your registered bank account. Transaction ID: TXN${Date.now()}`,
          type: 'success',
          read: false,
          createdAt: new Date(),
          applicationId,
          studentEmail
        });
        
        console.log('💰 Amount disbursed to student account!');
      }, 3000);
      
    } else {
      await NotificationBackend.sendNotification({
        id: `notif-final-reject-${Date.now()}`,
        userId: studentEmail,
        title: '❌ Application Rejected by Government',
        message: `Unfortunately, your scholarship application ${applicationId} has been rejected by the government review board. Please contact support for more details.`,
        type: 'error',
        read: false,
        createdAt: new Date(),
        applicationId,
        studentEmail
      });
    }
    
    console.log(`✅ Government ${action} notification sent!`);
  }
  
  /**
   * Run complete demo workflow
   */
  static async runCompleteDemo(): Promise<void> {
    console.log('🚀 Starting Complete Workflow Demo\n');
    
    try {
      // Step 1: Student submits application
      const applicationId = await this.simulateStudentApplication(
        'Sri Manakula Vinayagar Engineering College',
        'rajesh.kumar@student.smvec.ac.in'
      );
      
      // Wait 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: College officer verifies application
      await this.simulateCollegeOfficerAction(
        applicationId,
        'rajesh.kumar@student.smvec.ac.in',
        'scholarships@smvec.ac.in',
        'verified',
        'All documents verified. Student is eligible for scholarship.'
      );
      
      // Wait 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 3: Government officer approves
      await this.simulateGovernmentAction(
        applicationId,
        'rajesh.kumar@student.smvec.ac.in',
        'approved'
      );
      
      console.log('\n🎉 Complete workflow demo finished!');
      console.log('📱 Check notifications in the student portal to see real-time updates');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }
  
  /**
   * Demo with rejection scenario
   */
  static async runRejectionDemo(): Promise<void> {
    console.log('🚀 Starting Rejection Workflow Demo\n');
    
    try {
      // Student submits application
      const applicationId = await this.simulateStudentApplication(
        'PSG College of Technology',
        'priya.sharma@student.psg.ac.in'
      );
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // College officer rejects application
      await this.simulateCollegeOfficerAction(
        applicationId,
        'priya.sharma@student.psg.ac.in',
        'scholarships@psg.ac.in',
        'rejected',
        'Income certificate is invalid. Please submit updated documents.'
      );
      
      console.log('\n❌ Rejection workflow demo finished');
      
    } catch (error) {
      console.error('❌ Rejection demo failed:', error);
    }
  }
}

// Export demo functions for easy testing
export const {
  simulateStudentApplication,
  simulateCollegeOfficerAction,
  simulateGovernmentAction,
  runCompleteDemo,
  runRejectionDemo
} = WorkflowDemo;