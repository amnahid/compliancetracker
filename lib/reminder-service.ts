import { connectDB, ensureModelsRegistered, getModel } from './model-registry';
import { 
  sendTaskDueReminderEmail, 
  sendDocumentExpirationReminderEmail, 
  sendWeeklyComplianceDigestEmail,
  sendUrgentComplianceAlertEmail 
} from './email';

interface TaskWithUser {
  _id: string;
  title: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: string;
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  organization: {
    _id: string;
    name: string;
  };
}

interface DocumentWithUsers {
  _id: string;
  name: string;
  category: string;
  expirationDate: Date;
  assignedTo: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  organization: {
    _id: string;
    name: string;
  };
}

export class ReminderService {
  
  /**
   * Send task due reminders for tasks due in specified days
   */
  static async sendTaskDueReminders(daysAhead: number[] = [0, 1, 3, 7]) {
    try {
      await connectDB();
      await ensureModelsRegistered();
      
      const Task = getModel('Task');
      
      for (const days of daysAhead) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + days);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        
        // For overdue tasks (days = 0), get all overdue tasks
        const query = days === 0 
          ? { 
              status: { $ne: 'completed' }, 
              dueDate: { $lt: startDate } 
            }
          : { 
              status: { $ne: 'completed' }, 
              dueDate: { $gte: startDate, $lte: endDate } 
            };
        
        const tasks = await Task.find(query)
          .populate('assignedTo', 'name email')
          .populate('organization', 'name')
          .lean() as TaskWithUser[];
        
        console.log(`Found ${tasks.length} tasks ${days === 0 ? 'overdue' : `due in ${days} days`}`);
        
        for (const task of tasks) {
          if (task.assignedTo && task.assignedTo.email) {
            const daysUntilDue = days === 0 
              ? Math.floor((startDate.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24)) * -1
              : days;
            
            await sendTaskDueReminderEmail(
              task.assignedTo.email,
              task.assignedTo.name,
              task.title,
              task.dueDate,
              task.priority,
              task.organization.name,
              daysUntilDue
            );
            
            console.log(`Sent task reminder to ${task.assignedTo.email} for task: ${task.title}`);
          }
        }
      }
    } catch (error) {
      console.error('Error sending task due reminders:', error);
      throw error;
    }
  }
  
  /**
   * Send document expiration reminders for documents expiring in specified days
   */
  static async sendDocumentExpirationReminders(daysAhead: number[] = [0, 7, 14, 30]) {
    try {
      await connectDB();
      await ensureModelsRegistered();
      
      const Document = getModel('Document');
      
      for (const days of daysAhead) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + days);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        
        // For expired documents (days = 0), get all expired documents
        const query = days === 0 
          ? { 
              visibility: 'restricted',
              expirationDate: { $lt: startDate } 
            }
          : { 
              visibility: 'restricted',
              expirationDate: { $gte: startDate, $lte: endDate } 
            };
        
        const documents = await Document.find(query)
          .populate('assignedTo', 'name email')
          .populate('organization', 'name')
          .lean() as DocumentWithUsers[];
        
        console.log(`Found ${documents.length} documents ${days === 0 ? 'expired' : `expiring in ${days} days`}`);
        
        for (const document of documents) {
          if (document.assignedTo && document.assignedTo.length > 0) {
            for (const user of document.assignedTo) {
              const daysUntilExpiration = days === 0 
                ? Math.floor((startDate.getTime() - document.expirationDate.getTime()) / (1000 * 60 * 60 * 24)) * -1
                : days;
              
              await sendDocumentExpirationReminderEmail(
                user.email,
                user.name,
                document.name,
                document.expirationDate,
                document.category,
                document.organization.name,
                daysUntilExpiration
              );
              
              console.log(`Sent document expiration reminder to ${user.email} for document: ${document.name}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending document expiration reminders:', error);
      throw error;
    }
  }
  
  /**
   * Send weekly compliance digest to all users
   */
  static async sendWeeklyComplianceDigests() {
    try {
      await connectDB();
      await ensureModelsRegistered();
      
      const User = getModel('User');
      const Task = getModel('Task');
      const Document = getModel('Document');
      
      // Get all users with organizations
      const users = await User.find({ 
        organization: { $exists: true },
        emailVerified: true 
      })
        .populate('organization', 'name')
        .lean();
      
      console.log(`Sending weekly digests to ${users.length} users`);
      
      for (const user of users) {
        try {
          // Calculate summary for this user's organization
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          
          const [
            overdueTasks,
            upcomingTasks,
            expiringDocuments,
            completedTasks
          ] = await Promise.all([
            Task.countDocuments({
              organization: user.organization._id,
              status: { $ne: 'completed' },
              dueDate: { $lt: now }
            }),
            Task.countDocuments({
              organization: user.organization._id,
              status: { $ne: 'completed' },
              dueDate: { 
                $gte: now, 
                $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) 
              }
            }),
            Document.countDocuments({
              organization: user.organization._id,
              visibility: 'restricted',
              expirationDate: { 
                $gte: now, 
                $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) 
              }
            }),
            Task.countDocuments({
              organization: user.organization._id,
              status: 'completed',
              updatedAt: { $gte: weekAgo }
            })
          ]);
          
          await sendWeeklyComplianceDigestEmail(
            user.email,
            user.name,
            user.organization.name,
            {
              overdueTasks,
              upcomingTasks,
              expiringDocuments,
              completedTasks
            }
          );
          
          console.log(`Sent weekly digest to ${user.email}`);
        } catch (userError) {
          console.error(`Error sending digest to ${user.email}:`, userError);
        }
      }
    } catch (error) {
      console.error('Error sending weekly compliance digests:', error);
      throw error;
    }
  }
  
  /**
   * Send urgent alerts for critical compliance issues
   */
  static async sendUrgentComplianceAlerts() {
    try {
      await connectDB();
      await ensureModelsRegistered();
      
      const User = getModel('User');
      const Task = getModel('Task');
      const Document = getModel('Document');
      
      // Get organization admins and managers
      const admins = await User.find({ 
        role: { $in: ['admin', 'manager'] },
        organization: { $exists: true },
        emailVerified: true 
      })
        .populate('organization', 'name')
        .lean();
      
      for (const admin of admins) {
        try {
          const now = new Date();
          const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          
          // Check for critical overdue tasks (3+ days overdue)
          const criticalOverdueTasks = await Task.countDocuments({
            organization: admin.organization._id,
            status: { $ne: 'completed' },
            priority: 'high',
            dueDate: { $lt: threeDaysAgo }
          });
          
          // Check for multiple expired documents
          const expiredDocuments = await Document.countDocuments({
            organization: admin.organization._id,
            visibility: 'restricted',
            expirationDate: { $lt: now }
          });
          
          // Send alerts if thresholds are met
          if (criticalOverdueTasks >= 3) {
            await sendUrgentComplianceAlertEmail(
              admin.email,
              admin.name,
              admin.organization.name,
              'critical_overdue',
              `${criticalOverdueTasks} high-priority tasks are critically overdue (3+ days). Immediate action required to maintain compliance standards.`
            );
            console.log(`Sent critical overdue alert to ${admin.email}`);
          }
          
          if (expiredDocuments >= 5) {
            await sendUrgentComplianceAlertEmail(
              admin.email,
              admin.name,
              admin.organization.name,
              'multiple_expired_docs',
              `${expiredDocuments} compliance documents have expired. Your organization may be at risk of non-compliance. Please update documents immediately.`
            );
            console.log(`Sent expired documents alert to ${admin.email}`);
          }
        } catch (adminError) {
          console.error(`Error checking alerts for ${admin.email}:`, adminError);
        }
      }
    } catch (error) {
      console.error('Error sending urgent compliance alerts:', error);
      throw error;
    }
  }
  
  /**
   * Run all reminder checks - useful for cron jobs
   */
  static async runAllReminders() {
    console.log('Starting reminder service...');
    
    try {
      // Send task reminders
      await this.sendTaskDueReminders();
      
      // Send document expiration reminders  
      await this.sendDocumentExpirationReminders();
      
      // Send urgent alerts
      await this.sendUrgentComplianceAlerts();
      
      console.log('All reminders sent successfully');
    } catch (error) {
      console.error('Error running reminders:', error);
      throw error;
    }
  }
  
  /**
   * Run weekly digest - should be called once per week
   */
  static async runWeeklyDigest() {
    console.log('Starting weekly digest...');
    
    try {
      await this.sendWeeklyComplianceDigests();
      console.log('Weekly digest sent successfully');
    } catch (error) {
      console.error('Error running weekly digest:', error);
      throw error;
    }
  }
}
