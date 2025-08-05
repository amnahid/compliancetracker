# Reminder System Configuration

## Environment Variables

Add these to your `.env.local` file:

```bash
# Email Service (Required)
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# Cron Job Security (Required)
CRON_SECRET_TOKEN=your_secure_random_token_here

# Application URL (Required)
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

## Vercel Cron Jobs Setup

Create or update `vercel.json` in your project root:

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

## Manual Testing

Visit `/debug/reminders` to manually test different reminder types.

## API Endpoints

### POST /api/reminders
```json
{
  "action": "daily|weekly|tasks|documents|urgent",
  "authToken": "your_cron_secret_token"
}
```

### GET /api/reminders
For testing purposes:
- `/api/reminders?action=test-task&token=your_token`
- `/api/reminders?action=test-document&token=your_token`

## Reminder Schedule

### Daily Reminders (9 AM)
- **Task Due Reminders**: 
  - Overdue tasks (immediate)
  - Tasks due tomorrow (1 day)
  - Tasks due in 3 days
  - Tasks due in 7 days

- **Document Expiration Reminders**:
  - Expired documents (immediate)
  - Documents expiring in 7 days
  - Documents expiring in 14 days
  - Documents expiring in 30 days

- **Urgent Compliance Alerts**:
  - Critical overdue tasks (3+ high-priority tasks overdue for 3+ days)
  - Multiple expired documents (5+ expired documents)

### Weekly Digest (Monday 9 AM)
- Summary of overdue tasks
- Upcoming tasks (next 7 days)
- Expiring documents (next 30 days)
- Completed tasks from last week

## Email Templates

All emails include:
- Professional healthcare-themed design
- Organization branding
- Clear call-to-action buttons
- Compliance-focused messaging
- Color-coded urgency indicators

## Production Deployment

1. **Set Environment Variables** in Vercel dashboard
2. **Deploy with vercel.json** cron configuration
3. **Test reminders** using the debug page
4. **Monitor logs** in Vercel function logs
5. **Verify email delivery** in Resend dashboard

## Customization

To customize reminder schedules, edit the arrays in `ReminderService`:
- `sendTaskDueReminders([0, 1, 3, 7])` - Task reminder days
- `sendDocumentExpirationReminders([0, 7, 14, 30])` - Document reminder days

## Troubleshooting

- Check Vercel function logs for cron execution
- Verify environment variables are set
- Test email delivery with manual triggers
- Ensure models are properly registered in serverless environment
