import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const sentMessage = await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: 'Welcome to ComplianceTracker!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Welcome to ComplianceTracker!</h1>
          </div>
          <h2 style="color: #333;">Welcome, ${name}!</h2>
          <p>Thank you for joining ComplianceTracker! We're excited to have you on our healthcare compliance platform.</p>
          <p>Get started by exploring our features:</p>
          <ul style="line-height: 1.8;">
            <li>📋 Task Management & Tracking</li>
            <li>📄 Document Management</li>
            <li>👥 Staff Collaboration</li>
            <li>📊 Compliance Reporting</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Go to Dashboard
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </div>
      `,
    });

    console.log('Welcome email sent successfully:', sentMessage.toString());
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export async function sendInvitationEmail(email: string, name: string, organizationName: string, role: string, invitedBy: string, invitationLink: string, expiresAt: Date) {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: `You're invited to join ${organizationName} on ComplianceTracker`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">ComplianceTracker</h1>
            <p style="color: #666; margin: 5px 0;">Healthcare Compliance Management</p>
          </div>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">You're Invited!</h2>
            <p><strong>${invitedBy}</strong> has invited you to join <strong>${organizationName}</strong> on ComplianceTracker.</p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Invitation Details:</h3>
            <ul style="line-height: 1.8;">
              <li><strong>Organization:</strong> ${organizationName}</li>
              <li><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</li>
              <li><strong>Invited by:</strong> ${invitedBy}</li>
              <li><strong>Expires:</strong> ${expiresAt.toLocaleDateString()}</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" 
               style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px;">
              Accept Invitation
            </a>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⏰ This invitation expires on ${expiresAt.toLocaleDateString()}</strong><br>
              Please accept it before the expiration date.
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              If you didn't expect this invitation, you can safely ignore this email. 
              If you have any questions, please contact ${invitedBy} or our support team.
            </p>
            <p style="color: #666; font-size: 12px;">
              This link will expire on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw error; // Re-throw so calling code knows the email failed
  }
}

export async function sendTaskAssignmentEmail(email: string, userName: string, taskTitle: string, taskDescription: string, dueDate: Date, assignedBy: string, organizationName: string) {
  try {
    const sentMessage = await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: `New Task Assigned: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">ComplianceTracker</h1>
            <p style="color: #666; margin: 5px 0;">${organizationName}</p>
          </div>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">📋 New Task Assigned</h2>
            <p>Hi ${userName}, you have been assigned a new compliance task.</p>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">${taskTitle}</h3>
            <p style="color: #666; line-height: 1.6;">${taskDescription}</p>
            
            <div style="margin-top: 15px;">
              <p><strong>📅 Due Date:</strong> ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</p>
              <p><strong>👤 Assigned by:</strong> ${assignedBy}</p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tasks" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              View Task
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Login to ComplianceTracker to view full task details and mark it as complete when finished.
            </p>
          </div>
        </div>
      `,
    });

    console.log(`Task email sent successfully to ${email}:`, JSON.stringify(sentMessage));
  } catch (error) {
    console.error('Failed to send task assignment email:', error);
  }
}

export async function sendDocumentAssignmentEmail(email: string, userName: string, documentName: string, documentType: string, assignedBy: string, organizationName: string) {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: `Document Assigned: ${documentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">ComplianceTracker</h1>
            <p style="color: #666; margin: 5px 0;">${organizationName}</p>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">📄 Document Assigned</h2>
            <p>Hi ${userName}, a compliance document has been assigned to you for review.</p>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">${documentName}</h3>
            <div style="margin-top: 15px;">
              <p><strong>📁 Document Type:</strong> ${documentType}</p>
              <p><strong>👤 Assigned by:</strong> ${assignedBy}</p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/documents" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              View Document
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Please review the assigned document and take any necessary compliance actions.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send document assignment email:', error);
  }
}

export async function sendVerificationEmail(email: string, name: string, verificationToken: string) {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: 'Verify Your ComplianceTracker Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">ComplianceTracker</h1>
            <p style="color: #666; margin: 5px 0;">Healthcare Compliance Management</p>
          </div>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">✅ Verify Your Email</h2>
            <p>Hi ${name}, please verify your email address to complete your account setup.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}" 
               style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px;">
              Verify Email Address
            </a>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⚠️ Account access is limited until verified</strong><br>
              Some features may not be available until you verify your email.
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              If you didn't create this account, you can safely ignore this email.
            </p>
            <p style="color: #666; font-size: 12px;">
              This verification link will expire in 24 hours.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: 'Reset Your ComplianceTracker Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">ComplianceTracker</h1>
            <p style="color: #666; margin: 5px 0;">Healthcare Compliance Management</p>
          </div>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">🔒 Reset Your Password</h2>
            <p>You requested a password reset for your ComplianceTracker account.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
              Reset Password
            </a>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⏰ This link expires in 1 hour</strong><br>
              For security reasons, please use this link promptly.
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              If you didn't request this password reset, please ignore this email. Your password will not be changed.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
}

// Reminder Email Functions
export async function sendTaskDueReminderEmail(
  email: string, 
  userName: string, 
  taskTitle: string, 
  dueDate: Date, 
  priority: string,
  organizationName: string,
  daysUntilDue: number
) {
  try {
    const urgencyColor = priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981';
    const urgencyText = daysUntilDue <= 0 ? 'OVERDUE' : daysUntilDue === 1 ? 'DUE TOMORROW' : `DUE IN ${daysUntilDue} DAYS`;
    
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: `${urgencyText}: ${taskTitle} - ComplianceTracker`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">ComplianceTracker</h1>
            <p style="color: #666; margin: 5px 0;">${organizationName}</p>
          </div>
          
          <div style="background-color: ${daysUntilDue <= 0 ? '#fef2f2' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${urgencyColor};">
            <h2 style="color: #333; margin-top: 0;">⚠️ Task ${urgencyText}</h2>
            <p>Hi ${userName}, this is a reminder about an important compliance task.</p>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">${taskTitle}</h3>
            <div style="margin-top: 15px;">
              <p><strong>📅 Due Date:</strong> ${dueDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>⚡ Priority:</strong> <span style="color: ${urgencyColor}; font-weight: bold; text-transform: uppercase;">${priority}</span></p>
              <p><strong>⏰ Status:</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${urgencyText}</span></p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tasks" 
               style="background-color: ${urgencyColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px;">
              Complete Task Now
            </a>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>🏥 Compliance Alert</strong><br>
              Timely completion of compliance tasks is crucial for maintaining healthcare standards and avoiding regulatory issues.
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              This is an automated reminder. Please complete this task to maintain compliance standards.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send task due reminder email:', error);
  }
}

export async function sendDocumentExpirationReminderEmail(
  email: string, 
  userName: string, 
  documentName: string, 
  expirationDate: Date, 
  category: string,
  organizationName: string,
  daysUntilExpiration: number
) {
  try {
    const urgencyColor = daysUntilExpiration <= 0 ? '#ef4444' : daysUntilExpiration <= 7 ? '#f59e0b' : '#10b981';
    const urgencyText = daysUntilExpiration <= 0 ? 'EXPIRED' : daysUntilExpiration === 1 ? 'EXPIRES TOMORROW' : `EXPIRES IN ${daysUntilExpiration} DAYS`;
    
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: `${urgencyText}: ${documentName} - ComplianceTracker`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">ComplianceTracker</h1>
            <p style="color: #666; margin: 5px 0;">${organizationName}</p>
          </div>
          
          <div style="background-color: ${daysUntilExpiration <= 0 ? '#fef2f2' : '#fef3c7'}; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${urgencyColor};">
            <h2 style="color: #333; margin-top: 0;">📄 Document ${urgencyText}</h2>
            <p>Hi ${userName}, this is a reminder about an important compliance document.</p>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">${documentName}</h3>
            <div style="margin-top: 15px;">
              <p><strong>📅 Expiration Date:</strong> ${expirationDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>📁 Category:</strong> ${category}</p>
              <p><strong>⚠️ Status:</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${urgencyText}</span></p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/documents" 
               style="background-color: ${urgencyColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px;">
              ${daysUntilExpiration <= 0 ? 'Update Document' : 'Review Document'}
            </a>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>🏥 Compliance Alert</strong><br>
              ${daysUntilExpiration <= 0 ? 
                'This document has expired and may affect your compliance status. Please update or renew immediately.' : 
                'Ensure this document is renewed before expiration to maintain compliance standards.'}
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              This is an automated reminder. Please take action to maintain compliance standards.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send document expiration reminder email:', error);
  }
}

export async function sendWeeklyComplianceDigestEmail(
  email: string, 
  userName: string, 
  organizationName: string,
  summary: {
    overdueTasks: number;
    upcomingTasks: number;
    expiringDocuments: number;
    completedTasks: number;
  }
) {
  try {
    const hasIssues = summary.overdueTasks > 0 || summary.expiringDocuments > 0;
    
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: `Weekly Compliance Summary - ${organizationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">ComplianceTracker</h1>
            <p style="color: #666; margin: 5px 0;">${organizationName}</p>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">📊 Weekly Compliance Summary</h2>
            <p>Hi ${userName}, here's your compliance overview for this week.</p>
          </div>

          <div style="display: grid; gap: 15px; margin: 20px 0;">
            <div style="background-color: ${summary.overdueTasks > 0 ? '#fef2f2' : '#f0fdf4'}; padding: 15px; border-radius: 6px; border-left: 4px solid ${summary.overdueTasks > 0 ? '#ef4444' : '#10b981'};">
              <h3 style="margin: 0; color: #333;">⚠️ Overdue Tasks</h3>
              <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: ${summary.overdueTasks > 0 ? '#ef4444' : '#10b981'};">${summary.overdueTasks}</p>
            </div>
            
            <div style="background-color: ${summary.upcomingTasks > 0 ? '#fef3c7' : '#f9fafb'}; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
              <h3 style="margin: 0; color: #333;">📅 Upcoming Tasks</h3>
              <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #f59e0b;">${summary.upcomingTasks}</p>
            </div>
            
            <div style="background-color: ${summary.expiringDocuments > 0 ? '#fef2f2' : '#f0fdf4'}; padding: 15px; border-radius: 6px; border-left: 4px solid ${summary.expiringDocuments > 0 ? '#ef4444' : '#10b981'};">
              <h3 style="margin: 0; color: #333;">📄 Expiring Documents</h3>
              <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: ${summary.expiringDocuments > 0 ? '#ef4444' : '#10b981'};">${summary.expiringDocuments}</p>
            </div>
            
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
              <h3 style="margin: 0; color: #333;">✅ Completed This Week</h3>
              <p style="margin: 5px 0; font-size: 24px; font-weight: bold; color: #10b981;">${summary.completedTasks}</p>
            </div>
          </div>

          ${hasIssues ? `
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⚠️ Action Required</strong><br>
              You have compliance items that need immediate attention. Please review and complete them promptly.
            </p>
          </div>
          ` : `
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #15803d; font-size: 14px;">
              <strong>✅ Great Job!</strong><br>
              Your compliance status looks good. Keep up the excellent work!
            </p>
          </div>
          `}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px;">
              View Dashboard
            </a>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              This is your automated weekly compliance summary. Stay on top of your healthcare compliance requirements.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send weekly compliance digest email:', error);
  }
}

export async function sendUrgentComplianceAlertEmail(
  email: string, 
  userName: string, 
  organizationName: string,
  alertType: 'critical_overdue' | 'multiple_expired_docs' | 'compliance_deadline',
  details: string
) {
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: `URGENT: Compliance Alert - ${organizationName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">ComplianceTracker</h1>
            <p style="color: #666; margin: 5px 0;">${organizationName}</p>
          </div>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #ef4444;">
            <h2 style="color: #ef4444; margin-top: 0;">🚨 URGENT COMPLIANCE ALERT</h2>
            <p>Hi ${userName}, immediate attention is required for critical compliance items.</p>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Alert Details</h3>
            <p style="color: #ef4444; font-weight: bold;">${details}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500; font-size: 16px;">
              Take Action Now
            </a>
          </div>

          <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #ef4444; font-size: 14px;">
              <strong>⚠️ Critical Action Required</strong><br>
              This alert indicates serious compliance issues that could affect your healthcare practice. Please address immediately to avoid regulatory complications.
            </p>
          </div>

          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              This is an urgent automated alert. Contact your compliance officer if you need assistance.
            </p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send urgent compliance alert email:', error);
  }
}