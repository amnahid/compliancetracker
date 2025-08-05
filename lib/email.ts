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