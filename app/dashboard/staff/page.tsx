'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Edit, 
  Trash2, 
  MoreVertical,
  Crown,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AuthGuard } from '@/components/auth/AuthGuard';

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  organization: string;
  organizationType: string;
  subscriptionStatus: string;
  emailVerified: Date | null;
  createdAt: string;
  image?: string;
}

interface NewStaffForm {
  name: string;
  email: string;
  role: 'admin' | 'user';
  password: string;
}

interface Invitation {
  _id: string;
  email: string;
  name: string;
  role: string;
  organization: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    name: string;
    email: string;
  };
}

export default function StaffPage() {
  return (
    <AuthGuard requiredRole="admin">
      <StaffPageContent />
    </AuthGuard>
  );
}

function StaffPageContent() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [userDebugInfo, setUserDebugInfo] = useState<any>(null);
  const [newStaff, setNewStaff] = useState<NewStaffForm>({
    name: '',
    email: '',
    role: 'user',
    password: ''
  });
  
  const [newInvitation, setNewInvitation] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user'
  });

  const refreshSession = async () => {
    console.log('Refreshing session...');
    await update({ trigger: 'update' });
    window.location.reload();
  };

  const forceSessionRefresh = async () => {
    try {
      console.log('Force refreshing session...');
      
      // Call refresh endpoint
      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Refresh response:', data);
        
        // Force session update
        await update({ trigger: 'update' });
        
        // Small delay then reload
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        console.error('Failed to refresh session');
      }
    } catch (error) {
      console.error('Error force refreshing session:', error);
    }
  };

  const fetchUserDebugInfo = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUserDebugInfo(data);
      }
    } catch (error) {
      console.error('Error fetching debug info:', error);
    }
  };

  useEffect(() => {
    fetchUserDebugInfo();
  }, []);

  useEffect(() => {
    // For admin users, fetch staff even if organization is undefined
    if (session?.user && (session.user.organization || session.user.role === 'admin')) {
      fetchStaff();
      fetchInvitations();
    } else if (session?.user && !session.user.organization) {
      // If user exists but no organization, stop loading to show debug UI
      setLoading(false);
    }
  }, [session]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        
        // Handle new API response format
        if (Array.isArray(data)) {
          setStaff(data);
        } else if (data.users && Array.isArray(data.users)) {
          setStaff(data.users);
        } else if (data.debug) {
          // API returned debug info about missing organization
          toast.error('Organization not found. Please fix your organization setting.');
          setStaff([]);
        } else {
          setStaff([]);
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to load staff members');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/admin/invitations');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newInvitation.name || !newInvitation.email || !newInvitation.role) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newInvitation),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Invitation sent successfully!');
        setShowInviteDialog(false);
        setNewInvitation({ name: '', email: '', role: 'user' });
        fetchInvitations();
        
        // Copy invitation link to clipboard
        if (data.invitation?.invitationLink) {
          navigator.clipboard.writeText(data.invitation.invitationLink);
          toast.success('Invitation link copied to clipboard!');
        }
      } else {
        toast.error(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newStaff,
          organization: session?.user?.organization,
          organizationType: 'medical' // Default to medical, can be updated later
        }),
      });

      if (response.ok) {
        toast.success('Staff member added successfully');
        setShowAddDialog(false);
        setNewStaff({ name: '', email: '', role: 'user', password: '' });
        fetchStaff();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add staff member');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      toast.error('Failed to add staff member');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${staffId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Staff member removed successfully');
        fetchStaff();
      } else {
        toast.error('Failed to remove staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast.error('Failed to remove staff member');
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingStaff) return;

    try {
      const response = await fetch(`/api/admin/users/${editingStaff._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingStaff.name,
          email: editingStaff.email,
          role: editingStaff.role,
        }),
      });

      if (response.ok) {
        toast.success('Staff member updated successfully');
        setEditingStaff(null);
        fetchStaff();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update staff member');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error('Failed to update staff member');
    }
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
        <Crown className="h-3 w-3" />
        Admin
      </Badge>
    ) : (
      <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
        <User className="h-3 w-3" />
        Staff
      </Badge>
    );
  };

  const getStatusBadge = (emailVerified: Date | null, subscriptionStatus: string) => {
    if (!emailVerified) {
      return <Badge className="bg-amber-100 text-amber-800">Pending Verification</Badge>;
    }
    
    switch (subscriptionStatus) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'trial':
        return <Badge className="bg-blue-100 text-blue-800">Trial</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  // Check if current user is admin
  const isAdmin = session?.user?.role === 'admin';
  const isDbAdmin = userDebugInfo?.user?.role === 'admin';
  
  // Debug logging
  console.log('Staff Page - Session:', session);
  console.log('Staff Page - User Role:', session?.user?.role);
  console.log('Staff Page - Is Admin:', isAdmin);
  console.log('Staff Page - DB Role:', userDebugInfo?.user?.role);
  console.log('Staff Page - Is DB Admin:', isDbAdmin);

  // Allow access if either session says admin OR database says admin (temporary fix)
  const hasAccess = isAdmin || isDbAdmin;

  if (!hasAccess) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-gray-600">
              Only administrators can access staff management.
              <br />
              <small className="text-xs text-gray-500 mt-2 block">
                Current role: {session?.user?.role || 'unknown'}
              </small>
            </p>
            <div className="mt-4 text-xs text-gray-500">
              <p><strong>Session Debug Info:</strong></p>
              <p>Session exists: {session ? 'Yes' : 'No'}</p>
              <p>User exists: {session?.user ? 'Yes' : 'No'}</p>
              <p>Session Role: {session?.user?.role || 'undefined'}</p>
              
              {userDebugInfo && (
                <div className="mt-2">
                  <p><strong>Database Info:</strong></p>
                  <p>DB Role: {userDebugInfo.user?.role || 'undefined'}</p>
                  <p>DB Email: {userDebugInfo.user?.email || 'undefined'}</p>
                  <p>Role Match: {session?.user?.role === userDebugInfo.user?.role ? 'Yes' : 'No'}</p>
                </div>
              )}
            </div>
            <div className="mt-2">
              <p><strong>Organization Debug:</strong></p>
              <p>Session Organization: {
                typeof session?.user?.organization === 'object' && session?.user?.organization
                  ? (session.user.organization as any).name
                  : session?.user?.organization || 'undefined'
              }</p>
              <p>DB Organization: {userDebugInfo?.user?.organization || 'undefined'}</p>
              <p>Staff Count: {staff.length}</p>
              {staff.length > 0 && (
                <div className="mt-1">
                  <p><strong>Staff Organizations:</strong></p>
                  {staff.slice(0, 3).map((member, idx) => (
                    <p key={idx} className="text-xs">
                      {member.email}: {member.organization || 'no org'}
                    </p>
                  ))}
                  {staff.length > 3 && <p className="text-xs">...and {staff.length - 3} more</p>}
                </div>
              )}
            </div>
            <div className="mt-4 space-x-2">
              <Button 
                onClick={refreshSession}
                variant="outline"
                size="sm"
              >
                Refresh Session
              </Button>
              <Button 
                onClick={forceSessionRefresh}
                variant="default"
                size="sm"
              >
                Force Refresh
              </Button>
              <Button 
                onClick={fetchUserDebugInfo}
                variant="outline"
                size="sm"
              >
                Check DB Role
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth/fix-organization', { method: 'POST' });
                    const data = await response.json();
                    if (data.success) {
                      toast.success('Organization field fixed! Please refresh session.');
                      fetchUserDebugInfo();
                    } else {
                      toast.error('Failed to fix organization: ' + data.error);
                    }
                  } catch (error) {
                    toast.error('Error fixing organization');
                  }
                }}
                variant="destructive"
                size="sm"
              >
                Fix Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your organization's staff members and their access levels
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Send Staff Invitation</DialogTitle>
                <DialogDescription>
                  Send a secure invitation link to invite new staff members to your organization.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendInvitation} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="inviteName">Full Name</Label>
                  <Input
                    id="inviteName"
                    type="text"
                    value={newInvitation.name}
                    onChange={(e) => setNewInvitation({ ...newInvitation, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="inviteEmail">Email</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={newInvitation.email}
                    onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="inviteRole">Role</Label>
                  <Select
                    value={newInvitation.role}
                    onValueChange={(value: 'admin' | 'user') => setNewInvitation({ ...newInvitation, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowInviteDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Send Invitation</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Add a new staff member to your organization. They will receive an invitation email.
                </DialogDescription>
              </DialogHeader>
            <form onSubmit={handleAddStaff} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newStaff.role} onValueChange={(value: 'admin' | 'user') => setNewStaff({ ...newStaff, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Staff Member</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  placeholder="Enter temporary password"
                  required
                />
                <p className="text-xs text-gray-500">
                  The staff member should change this password after first login
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Staff Member</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Staff Member Dialog */}
        <Dialog open={!!editingStaff} onOpenChange={(open) => !open && setEditingStaff(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>
                Update staff member information and role.
              </DialogDescription>
            </DialogHeader>
            {editingStaff && (
              <form onSubmit={handleUpdateStaff} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Full Name</Label>
                  <Input
                    id="editName"
                    type="text"
                    value={editingStaff.name}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email Address</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editingStaff.email}
                    onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editRole">Role</Label>
                  <Select 
                    value={editingStaff.role} 
                    onValueChange={(value: 'admin' | 'user') => setEditingStaff({ ...editingStaff, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Staff Member</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditingStaff(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Staff Member</Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations ({invitations.length})
            </CardTitle>
            <CardDescription>
              Staff members who have been invited but haven't joined yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation._id}>
                    <TableCell className="font-medium">{invitation.name}</TableCell>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant={invitation.role === 'admin' ? 'default' : 'secondary'}>
                        {invitation.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
                          const inviteLink = `${baseUrl}/auth/invite?token=${invitation.token}`;
                          navigator.clipboard.writeText(inviteLink);
                          toast.success('Invitation link copied to clipboard!');
                        }}
                      >
                        Copy Link
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Staff</p>
                <p className="text-3xl font-bold text-gray-900">{staff.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administrators</p>
                <p className="text-3xl font-bold text-purple-600">
                  {staff.filter(s => s.role === 'admin').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-3xl font-bold text-green-600">
                  {staff.filter(s => s.emailVerified && s.subscriptionStatus === 'active').length}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                <p className="text-3xl font-bold text-amber-600">
                  {staff.filter(s => !s.emailVerified).length}
                </p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Mail className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            Manage your organization's staff members and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {member.name}
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{getRoleBadge(member.role)}</TableCell>
                  <TableCell>{getStatusBadge(member.emailVerified, member.subscriptionStatus)}</TableCell>
                  <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingStaff(member)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteStaff(member._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {staff.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No staff members found</p>
              <p className="text-sm">Add your first staff member to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
