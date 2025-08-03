'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Calendar,
  TrendingUp,
  Shield,
  Plus,
  Building2
} from 'lucide-react';
import Link from 'next/link';
import { getOrganizationDisplayName } from '@/lib/organization-client-utils';

interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completedTasks: number;
  totalDocuments: number;
  expiredDocuments: number;
  expiringDocuments: number;
  complianceScore: number;
}

interface RecentActivity {
  id: string;
  type: 'completed' | 'created' | 'warning' | 'error' | 'info';
  description: string;
  timestamp: string;
  userId?: string;
}

interface UserData {
  subscription?: {
    status: string;
    plan: string;
    trialEnd?: string;
  };
  trialEndsAt?: string;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completedTasks: 0,
    totalDocuments: 0,
    expiredDocuments: 0,
    expiringDocuments: 0,
    complianceScore: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixingOrganization, setFixingOrganization] = useState(false);

  useEffect(() => {
    console.log('Dashboard useEffect - Status:', status, 'Session:', session);
    if (status === 'authenticated') {
      console.log('User is authenticated, fetching real data...');
      fetchDashboardStats();
      fetchUserData();
      fetchRecentActivity();
    } else if (status === 'unauthenticated') {
      console.log('User is unauthenticated, using mock data');
      setStats({
        totalTasks: 12,
        pendingTasks: 4,
        overdueTasks: 2,
        completedTasks: 6,
        totalDocuments: 25,
        expiredDocuments: 1,
        expiringDocuments: 3,
        complianceScore: 78
      });
      setRecentActivity([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true') {
      window.location.href = '/dashboard/billing?success=true';
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else if (response.status === 400) {
        console.log('User profile call failed with 400, organization may need fixing');
        // Organization issue will be handled by fetchDashboardStats
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/admin/activity');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities || []);
      } else {
        // No fallback mock data - just empty array
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // No fallback mock data - just empty array
      setRecentActivity([]);
    }
  };

  const calculateTrialDaysLeft = () => {
    if (!userData?.trialEndsAt) return 0;
    const trialEnd = new Date(userData.trialEndsAt);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isOnTrial = userData?.subscription?.status === 'trialing' || (!userData?.subscription && userData?.trialEndsAt);
  const trialDaysLeft = calculateTrialDaysLeft();

  const fetchDashboardStats = async () => {
    console.log('Fetching dashboard stats...');
    try {
      const [tasksResponse, documentsResponse] = await Promise.all([
        fetch('/api/tasks', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }),
        fetch('/api/documents', {
          method: 'GET', 
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        })
      ]);

      console.log('API Response Status:', {
        tasks: tasksResponse.status,
        documents: documentsResponse.status
      });

      if (tasksResponse.ok && documentsResponse.ok) {
        console.log('API calls successful, processing data...');
        const tasks = await tasksResponse.json();
        const documents = await documentsResponse.json();

        console.log('Received data:', { 
          tasksCount: tasks.length, 
          documentsCount: documents.length 
        });

        const now = new Date();
        const overdueTasks = tasks.filter((task: any) => 
          task.status !== 'completed' && new Date(task.dueDate) < now
        ).length;

        const expiredDocs = documents.filter((doc: any) => 
          doc.status === 'expired'
        ).length;

        const expiringDocs = documents.filter((doc: any) => 
          doc.status === 'expiring-soon'
        ).length;

        const completedTasks = tasks.filter((task: any) => 
          task.status === 'completed'
        ).length;

        const totalItems = tasks.length + documents.length;
        const compliantItems = completedTasks + (documents.length - expiredDocs);
        const complianceScore = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 100;

        const newStats = {
          totalTasks: tasks.length,
          pendingTasks: tasks.filter((task: any) => task.status === 'pending').length,
          overdueTasks,
          completedTasks,
          totalDocuments: documents.length,
          expiredDocuments: expiredDocs,
          expiringDocuments: expiringDocs,
          complianceScore
        };

        console.log('Setting real stats:', newStats);
        setStats(newStats);
      } else {
        console.warn('API calls failed, checking if organization issue. Status:', {
          tasks: tasksResponse.status,
          documents: documentsResponse.status
        });
        
        // Check if this is an organization issue (400 errors)
        if ((tasksResponse.status === 400 || documentsResponse.status === 400) && !fixingOrganization) {
          console.log('Detected organization issue, attempting to fix...');
          setFixingOrganization(true);
          try {
            const fixResponse = await fetch('/api/auth/fix-organization', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include'
            });
            
            if (fixResponse.ok) {
              const fixResult = await fixResponse.json();
              console.log('Organization fixed successfully:', fixResult);
              // Retry the API calls after fixing organization
              setTimeout(() => {
                console.log('Retrying API calls after organization fix...');
                setFixingOrganization(false);
                fetchDashboardStats();
                fetchUserData();
                fetchRecentActivity();
              }, 1000);
              return;
            } else {
              console.error('Failed to fix organization:', await fixResponse.text());
            }
          } catch (fixError) {
            console.error('Error attempting to fix organization:', fixError);
          } finally {
            setFixingOrganization(false);
          }
        }
        
        const mockStats = {
          totalTasks: 12,
          pendingTasks: 4,
          overdueTasks: 2,
          completedTasks: 6,
          totalDocuments: 25,
          expiredDocuments: 1,
          expiringDocuments: 3,
          complianceScore: 78
        };
        console.log('Setting mock stats:', mockStats);
        setStats(mockStats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats({
        totalTasks: 12,
        pendingTasks: 4,
        overdueTasks: 2,
        completedTasks: 6,
        totalDocuments: 25,
        expiredDocuments: 1,
        expiringDocuments: 3,
        complianceScore: 78
      });
    } finally {
      setLoading(false);
    }
  };

  const getComplianceScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-destructive';
  };

  const getComplianceScoreBadge = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Attention';
    return 'Critical';
  };

  if (loading || status === 'loading' || fixingOrganization) {
    return (
      <div className="flex justify-center items-center min-h-96 space-x-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-lg text-muted-foreground">
          {fixingOrganization ? 'Setting up your organization...' : 'Loading dashboard...'}
        </span>
      </div>
    );
  }

  return (
    <div className="hds-container hds-spacing-lg space-y-6">
      {/* Header Section */}
      <header className="hds-header-section">
        <div>
          <h1 className="hds-heading-3xl font-semibold text-foreground">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}!
          </h1>
          <p className="hds-text-muted text-hds-lg mt-2">
            Here&apos;s your healthcare compliance overview for today.
          </p>
          {session?.user?.organization && (
            <div className="mt-3 flex items-center space-x-2">
              <Badge variant="outline" className="text-primary border-primary">
                <Building2 className="h-3 w-3 mr-1" />
                {getOrganizationDisplayName(session.user.organization)}
              </Badge>
              {session?.user?.role === 'admin' && (
                <Badge variant="secondary">Administrator</Badge>
              )}
            </div>
          )}
        </div>
        
        {/* Debug Section - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={async () => {
                const response = await fetch('/api/debug/database');
                const data = await response.json();
                console.log('Debug data:', data);
                alert('Check console for debug information');
              }}
              variant="outline"
              size="sm"
            >
              Debug DB
            </Button>
            <Button 
              onClick={async () => {
                const response = await fetch('/api/debug/seed', { method: 'POST' });
                const data = await response.json();
                console.log('Seed result:', data);
                alert(data.message);
                if (data.created) {
                  fetchDashboardStats();
                }
              }}
              variant="outline"
              size="sm"
            >
              Create Sample Data
            </Button>
            <Button 
              onClick={() => {
                fetchDashboardStats();
              }}
              variant="outline"
              size="sm"
            >
              Refresh Data
            </Button>
          </div>
        )}
      </header>

      {/* Trial Status Banner */}
      {isOnTrial && trialDaysLeft > 0 && (
        <Card className="hds-card-info border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="hds-text-semibold text-blue-900 dark:text-blue-100">Free Trial Active</h3>
                  <p className="text-hds-sm text-blue-700 dark:text-blue-300">
                    {trialDaysLeft} days left in your trial period
                  </p>
                </div>
              </div>
              <Button asChild className="hds-btn-primary">
                <Link href="/dashboard/billing">
                  Upgrade Now
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Expired */}
      {isOnTrial && trialDaysLeft === 0 && (
        <Card className="hds-card-critical border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="hds-text-semibold text-red-900 dark:text-red-100">Trial Expired</h3>
                  <p className="text-hds-sm text-red-700 dark:text-red-300">
                    Subscribe now to continue using all features
                  </p>
                </div>
              </div>
              <Button asChild className="hds-btn-critical">
                <Link href="/dashboard/billing">
                  Subscribe Now
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance Score Card */}
      <Card className="hds-card-primary hds-shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="hds-heading-xl">Compliance Score</span>
          </CardTitle>
          <CardDescription className="text-hds-base hds-text-muted">
            Overall compliance rating for your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="hds-spacing-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className={`hds-heading-4xl font-bold ${getComplianceScoreColor(stats.complianceScore)}`}>
                {stats.complianceScore}%
              </div>
              <div className="mt-3">
                <Badge className={`hds-badge-${
                  stats.complianceScore >= 90 ? 'excellent' : 
                  stats.complianceScore >= 70 ? 'good' : 
                  'needs-attention'
                }`}>
                  {getComplianceScoreBadge(stats.complianceScore)}
                </Badge>
              </div>
            </div>
            <TrendingUp className={`h-16 w-16 ${getComplianceScoreColor(stats.complianceScore)} opacity-80`} />
          </div>
          <div className="mt-6 hds-text-info p-4 bg-primary/5 rounded-hds-md">
            <p className="text-hds-sm">
              {stats.complianceScore >= 90 
                ? '🎉 Excellent! Your organization is highly compliant.'
                : stats.complianceScore >= 70
                ? '⚠️ Good compliance level. Some improvements needed.'
                : '🚨 Compliance needs attention. Please review pending tasks and expired documents.'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hds-card-metric">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="hds-text-semibold text-hds-sm text-muted-foreground">Total Tasks</CardTitle>
            <Calendar className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="hds-metric-value text-foreground">{stats.totalTasks}</div>
            <p className="hds-metric-description">
              {stats.pendingTasks} pending
            </p>
          </CardContent>
        </Card>

        <Card className="hds-card-metric border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="hds-text-semibold text-hds-sm text-muted-foreground">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="hds-metric-value hds-metric-critical">{stats.overdueTasks}</div>
            <p className="hds-metric-description">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="hds-card-metric border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="hds-text-semibold text-hds-sm text-muted-foreground">Documents</CardTitle>
            <FileText className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="hds-metric-value text-foreground">{stats.totalDocuments}</div>
            <p className="hds-metric-description">
              {stats.expiredDocuments > 0 && (
                <span className="hds-text-critical">{stats.expiredDocuments} expired</span>
              )}
              {stats.expiringDocuments > 0 && (
                <span className="hds-text-warning">
                  {stats.expiredDocuments > 0 ? ', ' : ''}{stats.expiringDocuments} expiring soon
                </span>
              )}
              {stats.expiredDocuments === 0 && stats.expiringDocuments === 0 && (
                <span className="hds-text-success">All up to date</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="hds-card-metric border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="hds-text-semibold text-hds-sm text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="hds-metric-value hds-metric-success">{stats.completedTasks}</div>
            <p className="hds-metric-description">
              Tasks completed this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="hds-grid-responsive">
        <Card className="hds-card-action hds-shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Calendar className="h-6 w-6 text-primary" />
              <span className="hds-heading-lg">Task Management</span>
            </CardTitle>
            <CardDescription className="text-hds-base hds-text-muted">
              Create and track compliance tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/tasks">
              <Button className="hds-btn-primary w-full">
                <Plus className="h-4 w-4 mr-2" />
                Manage Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hds-card-action hds-shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-primary" />
              <span className="hds-heading-lg">Document Library</span>
            </CardTitle>
            <CardDescription className="text-hds-base hds-text-muted">
              Upload and organize compliance documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/documents">
              <Button variant="outline" className="hds-btn-outline w-full">
                <FileText className="h-4 w-4 mr-2" />
                View Documents
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hds-card-action hds-shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-primary" />
              <span className="hds-heading-lg">Staff Management</span>
            </CardTitle>
            <CardDescription className="text-hds-base hds-text-muted">
              Manage team members and roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-hds-md">
                <span className="hds-text-semibold text-hds-sm">Team Members:</span>
                <Badge className="hds-badge-default">5 Active</Badge>
              </div>
              <Button variant="outline" className="hds-btn-outline w-full">
                <Users className="h-4 w-4 mr-2" />
                Manage Staff
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest compliance activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'completed' ? 'bg-success' :
                      activity.type === 'created' ? 'bg-primary' :
                      activity.type === 'warning' ? 'bg-warning' :
                      activity.type === 'error' ? 'bg-destructive' :
                      'bg-muted'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Activity will appear here as you use the system
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Alerts</CardTitle>
            <CardDescription>
              Items requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.overdueTasks > 0 && (
                <div className="flex items-center space-x-4 p-3 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Overdue Tasks</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.overdueTasks} task{stats.overdueTasks > 1 ? 's' : ''} past due date
                    </p>
                  </div>
                </div>
              )}

              {stats.expiredDocuments > 0 && (
                <div className="flex items-center space-x-4 p-3 bg-destructive/10 rounded-lg">
                  <FileText className="h-4 w-4 text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Expired Documents</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.expiredDocuments} document{stats.expiredDocuments > 1 ? 's' : ''} expired
                    </p>
                  </div>
                </div>
              )}

              {stats.expiringDocuments > 0 && (
                <div className="flex items-center space-x-4 p-3 bg-warning/10 rounded-lg">
                  <Clock className="h-4 w-4 text-warning" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Expiring Soon</p>
                    <p className="text-xs text-muted-foreground">
                      {stats.expiringDocuments} document{stats.expiringDocuments > 1 ? 's' : ''} expiring within 30 days
                    </p>
                  </div>
                </div>
              )}

              {stats.overdueTasks === 0 && stats.expiredDocuments === 0 && stats.expiringDocuments === 0 && (
                <div className="flex items-center space-x-4 p-3 bg-success/10 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">All Clear!</p>
                    <p className="text-xs text-muted-foreground">
                      No compliance issues at this time
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
