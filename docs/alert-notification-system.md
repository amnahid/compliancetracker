# 🚨 Alert and Notification System Documentation

## Overview

ComplianceTracker includes a comprehensive alert and notification system designed to keep healthcare organizations on top of their compliance requirements. The system includes automated email reminders, urgent alerts, weekly digests, and user-configurable notification preferences.

## 📧 Email Notification System

### Core Email Types

#### 1. **Account Management Emails**
- **Welcome Email**: Sent to new users upon registration
- **Email Verification**: Account verification with secure token
- **Password Reset**: Secure password reset with 1-hour expiration
- **Invitation Email**: Organization member invitations with role details

#### 2. **Task Management Emails**
- **Task Assignment**: Notification when tasks are assigned
- **Task Due Reminders**: Automated reminders at 0, 1, 3, and 7 days before due date
- **Overdue Alerts**: Immediate notifications for overdue tasks

#### 3. **Document Management Emails**
- **Document Assignment**: Notification when documents are assigned
- **Expiration Reminders**: Automated alerts at 0, 7, 14, and 30 days before expiration
- **Expired Document Alerts**: Immediate notifications for expired compliance documents

#### 4. **Weekly Reports**
- **Compliance Digest**: Weekly summary of organizational compliance status
- **Performance Summary**: Task completion, overdue items, and upcoming deadlines

#### 5. **Urgent Compliance Alerts**
- **Critical Overdue Tasks**: Alert when 3+ high-priority tasks are overdue for 3+ days
- **Multiple Expired Documents**: Alert when 5+ compliance documents have expired
- **Compliance Deadline Warnings**: Critical compliance deadline notifications

## 🔔 Alert System Architecture

### Reminder Service (`lib/reminder-service.ts`)

The core service handles all automated reminder functionality:

```typescript
export class ReminderService {
  // Task due reminders for 0, 1, 3, 7 days
  static async sendTaskDueReminders(daysAhead: number[])
  
  // Document expiration reminders for 0, 7, 14, 30 days
  static async sendDocumentExpirationReminders(daysAhead: number[])
  
  // Weekly compliance digest to all users
  static async sendWeeklyComplianceDigests()
  
  // Urgent alerts for critical compliance issues
  static async sendUrgentComplianceAlerts()
  
  // Run all daily reminders (tasks, documents, urgent)
  static async runAllReminders()
  
  // Run weekly digest
  static async runWeeklyDigest()
}
```

### Email Templates (`lib/email.ts`)

Professional healthcare-themed email templates with:
- Organization branding
- Color-coded urgency indicators
- Clear call-to-action buttons
- Compliance-focused messaging
- Mobile-responsive design

#### Urgency Color Coding
- **🔴 Red (`#ef4444`)**: Critical/Expired/High Priority
- **🟡 Orange (`#f59e0b`)**: Warning/Medium Priority
- **🟢 Green (`#10b981`)**: Normal/Good Status

## 📅 Automated Scheduling

### Vercel Cron Jobs (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/reminders",
      "schedule": "0 9 * * *",
      "description": "Daily compliance reminders at 9 AM"
    },
    {
      "path": "/api/reminders?action=weekly", 
      "schedule": "0 9 * * 1",
      "description": "Weekly compliance digest on Mondays at 9 AM"
    }
  ]
}
```

### Reminder Schedule

#### **Daily Reminders (9:00 AM)**
- **Task Due Reminders**:
  - Overdue tasks (immediate action required)
  - Tasks due tomorrow (1 day warning)
  - Tasks due in 3 days (prepare notification)
  - Tasks due in 7 days (advance warning)

- **Document Expiration Reminders**:
  - Expired documents (immediate action required)
  - Documents expiring in 7 days (urgent renewal)
  - Documents expiring in 14 days (plan renewal)
  - Documents expiring in 30 days (advance notice)

- **Urgent Compliance Alerts**:
  - Critical overdue tasks (3+ high-priority tasks overdue 3+ days)
  - Multiple expired documents (5+ expired compliance documents)

#### **Weekly Digest (Monday 9:00 AM)**
- Summary of overdue tasks
- Upcoming tasks (next 7 days)
- Expiring documents (next 30 days)
- Completed tasks from previous week
- Compliance status overview

## ⚙️ User Notification Preferences

### Configurable Settings

Users can control notification preferences in Dashboard → Settings → Notifications:

```typescript
interface NotificationSettings {
  emailNotifications: boolean;     // Master email toggle
  taskReminders: boolean;          // Task due date reminders
  documentExpiration: boolean;     // Document expiration alerts
  systemUpdates: boolean;          // System announcements
  weeklyReports: boolean;          // Weekly compliance digest
}
```

### Settings Management
- **API Endpoint**: `PUT /api/user/notifications`
- **Real-time Updates**: Immediate preference updates
- **Granular Control**: Individual notification type toggles
- **Organization-wide**: Admin can manage default preferences

## 🚨 Alert Triggering Logic

### Task Due Alerts
```typescript
// Overdue tasks (days = 0)
const query = { 
  status: { $ne: 'completed' }, 
  dueDate: { $lt: startDate } 
}

// Future due dates
const query = { 
  status: { $ne: 'completed' }, 
  dueDate: { $gte: startDate, $lte: endDate } 
}
```

### Document Expiration Alerts
```typescript
// Expired documents (days = 0)
const query = { 
  visibility: 'restricted',
  expirationDate: { $lt: startDate } 
}

// Future expiration dates
const query = { 
  visibility: 'restricted',
  expirationDate: { $gte: startDate, $lte: endDate } 
}
```

### Urgent Alert Thresholds
- **Critical Overdue Tasks**: ≥3 high-priority tasks overdue for ≥3 days
- **Expired Documents**: ≥5 compliance documents expired
- **Target Recipients**: Admins and managers only

## 🛠️ API Endpoints

### Reminder Management
```typescript
// Trigger reminders
POST /api/reminders
{
  "action": "daily|weekly|tasks|documents|urgent",
  "authToken": "secure_token"
}

// Test reminders (development)
GET /api/reminders?action=test-task&token=secure_token
GET /api/reminders?action=test-document&token=secure_token
```

### Notification Settings
```typescript
// Update user preferences
PUT /api/user/notifications
{
  "emailNotifications": true,
  "taskReminders": true,
  "documentExpiration": true,
  "systemUpdates": false,
  "weeklyReports": true
}

// Get current preferences
GET /api/user/notifications
```

## 🔧 Development & Testing

### Debug Interface
- **Location**: `/debug/reminders`
- **Manual Testing**: Trigger individual reminder types
- **Real-time Feedback**: Immediate email delivery status
- **Development Safe**: Uses test tokens in development

### Testing Actions
- **Task Due Reminders**: Test overdue and upcoming task alerts
- **Document Expiration**: Test expired and expiring document alerts
- **Urgent Compliance**: Test critical alert thresholds
- **Weekly Digest**: Test weekly summary generation

## 🌐 Production Setup

### Environment Variables
```bash
# Email Service (Required)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# Cron Job Security (Required)
CRON_SECRET_TOKEN=your_secure_random_token_here

# Application URL (Required)
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### Deployment Checklist
1. ✅ Configure environment variables in production
2. ✅ Deploy with `vercel.json` cron configuration
3. ✅ Test reminders using debug interface
4. ✅ Monitor function logs for cron execution
5. ✅ Verify email delivery in Resend dashboard

## 📊 Monitoring & Analytics

### Email Delivery Tracking
- **Service**: Resend email service
- **Delivery Status**: Real-time delivery confirmations
- **Error Handling**: Comprehensive error logging
- **Retry Logic**: Automatic retry for failed deliveries

### System Logs
- **Cron Execution**: Vercel function logs
- **Email Sending**: Console logging with user details
- **Error Tracking**: Detailed error messages and stack traces
- **Performance**: Execution time and success rates

## 🔒 Security Features

### Authentication & Authorization
- **Cron Security**: Secret token authentication for scheduled jobs
- **User Permissions**: Role-based access to urgent alerts
- **Email Verification**: Secure token-based email verification
- **Session Management**: Secure session handling

### Data Protection
- **No Sensitive Data**: Emails contain minimal sensitive information
- **Secure Links**: All dashboard links require authentication
- **Token Expiration**: Time-limited tokens for password reset
- **GDPR Compliance**: User-controlled notification preferences

## 🎯 Compliance Benefits

### Regulatory Compliance
- **Automated Tracking**: Proactive compliance monitoring
- **Audit Trail**: Email delivery logs for compliance audits
- **Timely Alerts**: Ensures deadlines are never missed
- **Documentation**: Comprehensive compliance documentation

### Healthcare Standards
- **HIPAA Alignment**: Secure email handling practices
- **Professional Communication**: Healthcare-appropriate messaging
- **Quality Assurance**: Systematic compliance monitoring
- **Risk Mitigation**: Early warning system for compliance issues

## 🚀 Future Enhancements

### Planned Features
1. **SMS Notifications**: Text message alerts for critical items
2. **Push Notifications**: Browser push notifications
3. **Slack Integration**: Team collaboration alerts
4. **Custom Schedules**: User-defined reminder schedules
5. **Advanced Analytics**: Detailed notification metrics
6. **Mobile App**: Native mobile notifications
7. **Escalation Rules**: Automatic escalation for ignored alerts
8. **Team Notifications**: Department-specific alerts

### Technical Improvements
1. **Real-time Notifications**: WebSocket-based live updates
2. **Email Templates**: Advanced template customization
3. **Delivery Optimization**: Smart delivery timing
4. **Bounce Handling**: Advanced email deliverability
5. **A/B Testing**: Notification effectiveness testing
6. **Machine Learning**: Intelligent reminder timing
7. **Integration APIs**: Third-party notification services
8. **Performance**: Optimized batch processing

---

## 📞 Support & Troubleshooting

### Common Issues
- **Emails Not Received**: Check spam folder, verify email settings
- **Cron Jobs Not Running**: Verify Vercel deployment and environment variables
- **Permission Errors**: Check user roles and organization membership
- **Database Errors**: Monitor MongoDB connection and model registration

### Debug Steps
1. Test using `/debug/reminders` interface
2. Check Vercel function logs for errors
3. Verify environment variables are set
4. Test email delivery with manual triggers
5. Ensure models are properly registered

### Contact Support
For technical issues or feature requests, contact the development team through the appropriate support channels.
