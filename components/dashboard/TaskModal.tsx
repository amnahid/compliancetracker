'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, User, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Task {
  _id?: string;
  title: string;
  description: string;
  dueDate: string;
  assignee: string;
  assigneeName?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  category: 'hipaa-training' | 'license-renewal' | 'safety-training' | 'documentation' | 'other';
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSave: () => void;
}

export default function TaskModal({ isOpen, onClose, task, onSave }: TaskModalProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<Task>({
    title: '',
    description: '',
    dueDate: '',
    assignee: '',
    status: 'pending',
    priority: 'medium',
    category: 'other'
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('09:00');
  const isEditing = !!task;

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (task) {
        setFormData(task);
        const taskDate = new Date(task.dueDate);
        setDate(taskDate);
        setTime(format(taskDate, 'HH:mm'));
      } else {
        // Reset form for new task
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          assignee: '',
          status: 'pending',
          priority: 'medium',
          category: 'other'
        });
        setDate(undefined);
        setTime('09:00');
      }
    }
  }, [isOpen, task]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        // Handle both direct array and object with users property
        const usersArray = Array.isArray(data) ? data : (data.users || []);
        
        // Filter users based on current user's role
        let filteredUsers = usersArray;
        if (session?.user?.role !== 'admin') {
          // Non-admin users can only assign tasks to themselves
          filteredUsers = usersArray.filter((user: User) => user.email === session?.user?.email);
        }
        
        setUsers(filteredUsers);
        
        // If not admin and creating new task, auto-assign to themselves
        if (session?.user?.role !== 'admin' && !task && filteredUsers.length > 0) {
          setFormData(prev => ({ ...prev, assignee: filteredUsers[0]._id }));
        }
      } else {
        // Set empty array if API fails
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Set empty array on error
      setUsers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error('Please select a due date');
      return;
    }

    const dueDateTime = new Date(date);
    const [hours, minutes] = time.split(':');
    dueDateTime.setHours(parseInt(hours), parseInt(minutes));

    const taskData = {
      ...formData,
      dueDate: dueDateTime.toISOString()
    };

    setLoading(true);

    try {
      const url = isEditing ? `/api/tasks/${task?._id}` : '/api/tasks';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        toast.success(isEditing ? 'Task updated successfully' : 'Task created successfully');
        onSave();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to save task');
      }
    } catch (error) {
      toast.error('An error occurred while saving the task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task?._id) return;

    if (!confirm('Are you sure you want to delete this task?')) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/tasks/${task._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Task deleted successfully');
        onSave();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the task');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'hipaa-training': 'HIPAA Training',
      'license-renewal': 'License Renewal',
      'safety-training': 'Safety Training',
      'documentation': 'Documentation',
      'other': 'Other'
    };
    return labels[category] || category;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? 'Edit Task' : 'Create New Task'}
            {task && (
              <Badge 
                variant={task.priority === 'high' ? 'destructive' : 'secondary'}
                className={cn(
                  'ml-2',
                  task.priority === 'medium' && 'bg-warning/10 text-warning border-warning/20'
                )}
              >
                {task.priority} priority
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the task details below' 
              : 'Fill in the details to create a new compliance task'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Non-admin editing restriction notice */}
          {isEditing && session?.user?.role !== 'admin' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You can only update the status of your assigned tasks. 
                Contact an administrator to modify other details.
              </p>
            </div>
          )}

          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Task Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title..."
              required
              disabled={isEditing && session?.user?.role !== 'admin'}
              className={`w-full ${isEditing && session?.user?.role !== 'admin' ? 'bg-muted' : ''}`}
            />
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide additional details about this task..."
              rows={3}
              disabled={isEditing && session?.user?.role !== 'admin'}
              className={`w-full ${isEditing && session?.user?.role !== 'admin' ? 'bg-muted' : ''}`}
            />
          </div>

          {/* Category and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category *
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value as Task['category'] })}
                disabled={isEditing && session?.user?.role !== 'admin'}
              >
                <SelectTrigger className={isEditing && session?.user?.role !== 'admin' ? 'bg-muted' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hipaa-training">HIPAA Training</SelectItem>
                  <SelectItem value="license-renewal">License Renewal</SelectItem>
                  <SelectItem value="safety-training">Safety Training</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">
                Priority *
              </Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}
                disabled={isEditing && session?.user?.role !== 'admin'}
              >
                <SelectTrigger className={isEditing && session?.user?.role !== 'admin' ? 'bg-muted' : ''}>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                      Low Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-warning"></div>
                      Medium Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive"></div>
                      High Priority
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee" className="text-sm font-medium">
                Assign To *
                {session?.user?.role !== 'admin' && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (You can only assign tasks to yourself)
                  </span>
                )}
              </Label>
              <Select 
                value={formData.assignee} 
                onValueChange={(value) => setFormData({ ...formData, assignee: value })}
                disabled={isEditing && session?.user?.role !== 'admin'}
              >
                <SelectTrigger className={isEditing && session?.user?.role !== 'admin' ? 'bg-muted' : ''}>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(users) && users.length > 0 ? (
                    users
                      .filter(user => {
                        // Admin users can assign to anyone, non-admin users can only assign to themselves
                        if (session?.user?.role === 'admin') {
                          return true;
                        }
                        return user.email === session?.user?.email;
                      })
                      .map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{user.name}</span>
                            <span className="text-sm text-muted-foreground">({user.role})</span>
                            {user.email === session?.user?.email && (
                              <span className="text-xs text-primary">(You)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                  ) : (
                    <SelectItem value="no-users" disabled>
                      {session?.user?.role === 'admin' ? 'No users available' : 'You are the only available assignee'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Task['status'] })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Due Date and Time */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Due Date & Time *
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isEditing && session?.user?.role !== 'admin'}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground",
                      isEditing && session?.user?.role !== 'admin' && "bg-muted"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>

              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  disabled={isEditing && session?.user?.role !== 'admin'}
                  className={`pl-10 ${isEditing && session?.user?.role !== 'admin' ? 'bg-muted' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Overdue Warning */}
          {task && date && new Date(date) < new Date() && task.status !== 'completed' && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">
                This task is overdue. Consider updating the due date or marking it as completed.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <div className="flex-1">
              {isEditing && session?.user?.role === 'admin' && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Delete Task
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || (
                  isEditing && session?.user?.role !== 'admin' 
                    ? false  // Non-admin can always submit status changes
                    : !formData.title || !formData.assignee || !date  // Admin needs all fields
                )}
                className="btn-primary flex-1 sm:flex-none"
              >
                {loading ? 'Saving...' : (
                  isEditing 
                    ? (session?.user?.role === 'admin' ? 'Update Task' : 'Update Status')
                    : 'Create Task'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
