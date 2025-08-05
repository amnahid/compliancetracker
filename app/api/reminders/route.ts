import { NextRequest, NextResponse } from 'next/server';
import { ReminderService } from '@/lib/reminder-service';

export async function POST(request: NextRequest) {
  try {
    // Get the action from the request body
    const { action, authToken } = await request.json();
    
    // Basic auth check - you should implement proper authentication
    if (authToken !== process.env.CRON_SECRET_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    switch (action) {
      case 'daily':
        await ReminderService.runAllReminders();
        return NextResponse.json({ 
          success: true, 
          message: 'Daily reminders sent successfully' 
        });
        
      case 'weekly':
        await ReminderService.runWeeklyDigest();
        return NextResponse.json({ 
          success: true, 
          message: 'Weekly digest sent successfully' 
        });
        
      case 'tasks':
        await ReminderService.sendTaskDueReminders();
        return NextResponse.json({ 
          success: true, 
          message: 'Task reminders sent successfully' 
        });
        
      case 'documents':
        await ReminderService.sendDocumentExpirationReminders();
        return NextResponse.json({ 
          success: true, 
          message: 'Document expiration reminders sent successfully' 
        });
        
      case 'urgent':
        await ReminderService.sendUrgentComplianceAlerts();
        return NextResponse.json({ 
          success: true, 
          message: 'Urgent alerts sent successfully' 
        });
        
      default:
        return NextResponse.json({ 
          error: 'Invalid action. Use: daily, weekly, tasks, documents, or urgent' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in reminder API:', error);
    return NextResponse.json({ 
      error: 'Failed to send reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// For manual testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const token = searchParams.get('token');
  
  if (token !== process.env.CRON_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    switch (action) {
      case 'test-task':
        await ReminderService.sendTaskDueReminders([0, 1]); // Test overdue and tomorrow
        return NextResponse.json({ success: true, message: 'Test task reminders sent' });
        
      case 'test-document':
        await ReminderService.sendDocumentExpirationReminders([0, 7]); // Test expired and 7-day warning
        return NextResponse.json({ success: true, message: 'Test document reminders sent' });
        
      default:
        return NextResponse.json({ 
          error: 'Invalid test action. Use: test-task or test-document' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in reminder test:', error);
    return NextResponse.json({ 
      error: 'Failed to send test reminders',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
