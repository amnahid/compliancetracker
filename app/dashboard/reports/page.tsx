'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ComplianceReport {
  period: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  pendingTasks: number;
  documentsExpiring: number;
  complianceScore: number;
}

interface TaskReport {
  id: string;
  title: string;
  assignee: string;
  status: string;
  dueDate: string;
  category: string;
  daysOverdue?: number;
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overview');
  const [timePeriod, setTimePeriod] = useState('month');
  const [complianceData, setComplianceData] = useState<ComplianceReport | null>(null);
  const [taskReports, setTaskReports] = useState<TaskReport[]>([]);

  useEffect(() => {
    if (session?.user?.organization) {
      fetchReportData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, reportType, timePeriod]);

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch tasks and documents for reports
      const [tasksRes, documentsRes] = await Promise.all([
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

      if (tasksRes.ok && documentsRes.ok) {
        const tasks = await tasksRes.json();
        const documents = await documentsRes.json();

        // Generate compliance report
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
        const overdueTasks = tasks.filter((t: any) => t.status === 'overdue').length;
        const pendingTasks = tasks.filter((t: any) => t.status === 'pending').length;
        
        const documentsExpiring = documents.filter((d: any) => {
          if (!d.expirationDate) return false;
          const expirationDate = new Date(d.expirationDate);
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          return expirationDate <= thirtyDaysFromNow;
        }).length;

        const complianceScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

        setComplianceData({
          period: timePeriod,
          totalTasks,
          completedTasks,
          overdueTasks,
          pendingTasks,
          documentsExpiring,
          complianceScore
        });

        // Generate task reports with additional details
        const taskReports = tasks.map((task: any) => {
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          const daysOverdue = task.status === 'overdue' 
            ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            : undefined;

          return {
            id: task._id,
            title: task.title,
            assignee: task.assigneeName || 'Unassigned',
            status: task.status,
            dueDate: dueDate.toLocaleDateString(),
            category: task.category,
            daysOverdue
          };
        });

        setTaskReports(taskReports);
      } else {
        // Handle API errors gracefully
        if (!tasksRes.ok) {
          console.error('Tasks API error:', tasksRes.status, tasksRes.statusText);
        }
        if (!documentsRes.ok) {
          console.error('Documents API error:', documentsRes.status, documentsRes.statusText);
        }
        
        // Use mock data if APIs fail
        setComplianceData({
          period: timePeriod,
          totalTasks: 12,
          completedTasks: 8,
          overdueTasks: 2,
          pendingTasks: 2,
          documentsExpiring: 3,
          complianceScore: 67
        });

        setTaskReports([
          {
            id: '1',
            title: 'HIPAA Training Completion',
            assignee: 'John Doe',
            status: 'completed',
            dueDate: new Date().toLocaleDateString(),
            category: 'hipaa-training',
            daysOverdue: undefined
          },
          {
            id: '2',
            title: 'Safety Protocol Review',
            assignee: 'Jane Smith',
            status: 'overdue',
            dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            category: 'safety-training',
            daysOverdue: 5
          }
        ]);
        
        toast.warning('Using sample data - API connection unavailable');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      
      // Fallback to mock data
      setComplianceData({
        period: timePeriod,
        totalTasks: 12,
        completedTasks: 8,
        overdueTasks: 2,
        pendingTasks: 2,
        documentsExpiring: 3,
        complianceScore: 67
      });

      setTaskReports([
        {
          id: '1',
          title: 'HIPAA Training Completion',
          assignee: 'John Doe',
          status: 'completed',
          dueDate: new Date().toLocaleDateString(),
          category: 'hipaa-training',
          daysOverdue: undefined
        },
        {
          id: '2',
          title: 'Safety Protocol Review',
          assignee: 'Jane Smith',
          status: 'overdue',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          category: 'safety-training',
          daysOverdue: 5
        }
      ]);
      
      toast.error('Failed to load report data - using sample data');
    } finally {
      setLoading(false);
    }
  }, [timePeriod]);

  const exportReport = () => {
    if (!complianceData) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      organization: session?.user?.organization,
      period: timePeriod,
      complianceData,
      taskReports: reportType === 'tasks' ? taskReports : []
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${timePeriod}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Report exported successfully');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Overdue</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance Reports</h1>
          <p className="text-gray-600 mt-1">
            Monitor your organization's compliance performance and generate detailed reports
          </p>
        </div>
        <Button onClick={exportReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Report Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Overview</SelectItem>
            <SelectItem value="tasks">Task Details</SelectItem>
            <SelectItem value="documents">Document Status</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Report */}
      {reportType === 'overview' && complianceData && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                    <p className="text-3xl font-bold text-blue-600">{complianceData.complianceScore}%</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {complianceData.complianceScore >= 80 ? (
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    ) : (
                      <TrendingDown className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                    <p className="text-3xl font-bold text-gray-900">{complianceData.totalTasks}</p>
                  </div>
                  <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                    <p className="text-3xl font-bold text-green-600">{complianceData.completedTasks}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                    <p className="text-3xl font-bold text-red-600">{complianceData.overdueTasks}</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Status Breakdown</CardTitle>
                <CardDescription>Current status of all compliance tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Completed</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(complianceData.completedTasks / complianceData.totalTasks) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{complianceData.completedTasks}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Pending</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-amber-600 h-2 rounded-full" 
                          style={{ width: `${(complianceData.pendingTasks / complianceData.totalTasks) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{complianceData.pendingTasks}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Overdue</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-600 h-2 rounded-full" 
                          style={{ width: `${(complianceData.overdueTasks / complianceData.totalTasks) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{complianceData.overdueTasks}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Document Alerts</CardTitle>
                <CardDescription>Documents requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-900">Expiring Soon</p>
                        <p className="text-sm text-amber-700">Documents expiring within 30 days</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-amber-600">{complianceData.documentsExpiring}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Task Details Report */}
      {reportType === 'tasks' && (
        <Card>
          <CardHeader>
            <CardTitle>Task Details Report</CardTitle>
            <CardDescription>Detailed view of all compliance tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Days Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskReports.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>{task.assignee}</TableCell>
                    <TableCell className="capitalize">{task.category.replace('-', ' ')}</TableCell>
                    <TableCell>{task.dueDate}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      {task.daysOverdue ? (
                        <span className="text-red-600 font-medium">{task.daysOverdue} days</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Document Status Report */}
      {reportType === 'documents' && (
        <Card>
          <CardHeader>
            <CardTitle>Document Status Report</CardTitle>
            <CardDescription>Overview of document compliance status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Document status report coming soon...</p>
              <p className="text-sm">This feature will show detailed document expiration and compliance status.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
