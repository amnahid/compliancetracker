'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bell, Clock, Mail, AlertTriangle, Calendar, Send } from 'lucide-react';

export default function RemindersTestPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const triggerReminder = async (action: string, description: string) => {
    setLoading(action);
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          authToken: process.env.NEXT_PUBLIC_CRON_SECRET_TOKEN || 'development-token'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: result.message,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send reminders',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  const reminderTypes = [
    {
      action: 'tasks',
      title: 'Task Due Reminders',
      description: 'Send reminders for overdue and upcoming tasks (0, 1, 3, 7 days)',
      icon: Clock,
      color: 'bg-blue-500',
    },
    {
      action: 'documents',
      title: 'Document Expiration Reminders',
      description: 'Send reminders for expired and expiring documents (0, 7, 14, 30 days)',
      icon: Mail,
      color: 'bg-green-500',
    },
    {
      action: 'urgent',
      title: 'Urgent Compliance Alerts',
      description: 'Send urgent alerts for critical compliance issues',
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      action: 'weekly',
      title: 'Weekly Compliance Digest',
      description: 'Send weekly summary to all users',
      icon: Calendar,
      color: 'bg-purple-500',
    },
    {
      action: 'daily',
      title: 'Run All Daily Reminders',
      description: 'Execute all reminder types (except weekly digest)',
      icon: Bell,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Reminder System Test Panel
        </h1>
        <p className="text-gray-600">
          Manually trigger different types of reminder emails for testing purposes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reminderTypes.map((reminder) => {
          const Icon = reminder.icon;
          return (
            <Card key={reminder.action} className="relative">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${reminder.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{reminder.title}</CardTitle>
                </div>
                <CardDescription>{reminder.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => triggerReminder(reminder.action, reminder.title)}
                  disabled={loading === reminder.action}
                  className="w-full"
                  variant={reminder.action === 'urgent' ? 'destructive' : 'default'}
                >
                  {loading === reminder.action ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send {reminder.title}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">
          ⚠️ Important Setup Notes
        </h2>
        <div className="text-yellow-700 space-y-2">
          <p>
            <strong>1. Environment Variables Required:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li><code>RESEND_API_KEY</code> - Your Resend API key</li>
            <li><code>FROM_EMAIL</code> - Verified sender email address</li>
            <li><code>CRON_SECRET_TOKEN</code> - Secret token for cron job authentication</li>
            <li><code>NEXT_PUBLIC_APP_URL</code> - Your application URL</li>
          </ul>
          
          <p className="mt-4">
            <strong>2. Production Cron Jobs:</strong>
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Daily reminders: <code>0 9 * * *</code> (9 AM daily)</li>
            <li>Weekly digest: <code>0 9 * * 1</code> (9 AM Monday)</li>
          </ul>
          
          <p className="mt-4">
            <strong>3. Vercel Cron Setup:</strong>
          </p>
          <pre className="bg-yellow-100 p-2 rounded text-sm mt-2">
{`// vercel.json
{
  "crons": [
    {
      "path": "/api/reminders",
      "schedule": "0 9 * * *"
    }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
