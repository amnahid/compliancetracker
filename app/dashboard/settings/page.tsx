'use client';

import { useState, useEffect } from 'react';
import { useSession, getSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Settings as SettingsIcon, 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Database,
  Mail,
  Save,
  Eye,
  EyeOff,
  Crown,
  Trash2
} from 'lucide-react';

interface UserSettings {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface OrganizationSettings {
  name: string;
  type: string;
  address: string;
  phone: string;
  website: string;
  description: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  taskReminders: boolean;
  documentExpiration: boolean;
  systemUpdates: boolean;
  weeklyReports: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: string;
  passwordExpiry: string;
  requirePasswordChange: boolean;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswords, setShowPasswords] = useState(false);

  const [userSettings, setUserSettings] = useState<UserSettings>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [orgSettings, setOrgSettings] = useState<OrganizationSettings>({
    name: '',
    type: 'medical',
    address: '',
    phone: '',
    website: '',
    description: ''
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    taskReminders: true,
    documentExpiration: true,
    systemUpdates: false,
    weeklyReports: true
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: '24',
    passwordExpiry: '90',
    requirePasswordChange: false
  });

  const [upgradeCode, setUpgradeCode] = useState('');
  const [deleteAccountData, setDeleteAccountData] = useState({
    password: '',
    confirmDelete: ''
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setUserSettings({
        name: session.user.name || '',
        email: session.user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setOrgSettings({
        name: typeof session.user.organization === 'object' && session.user.organization 
          ? (session.user.organization as any).name 
          : typeof session.user.organization === 'string' 
          ? session.user.organization 
          : '',
        type: 'medical',
        address: '',
        phone: '',
        website: '',
        description: ''
      });
    }
  }, [session]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userSettings.name,
          email: userSettings.email,
          currentPassword: userSettings.currentPassword,
          newPassword: userSettings.newPassword,
        }),
      });

      if (response.ok) {
        toast.success('Profile updated successfully');
        // Update session
        await update({
          name: userSettings.name,
          email: userSettings.email,
        });
        
        // Clear password fields
        setUserSettings(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/organization/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgSettings),
      });

      if (response.ok) {
        toast.success('Organization settings updated successfully');
      } else {
        toast.error('Failed to update organization settings');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('Failed to update organization settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationSettings),
      });

      if (response.ok) {
        toast.success('Notification settings updated successfully');
      } else {
        toast.error('Failed to update notification settings');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSecurity = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/user/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(securitySettings),
      });

      if (response.ok) {
        toast.success('Security settings updated successfully');
      } else {
        toast.error('Failed to update security settings');
      }
    } catch (error) {
      console.error('Error updating security:', error);
      toast.error('Failed to update security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/upgrade-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ upgradeCode }),
      });

      if (response.ok) {
        toast.success('Successfully upgraded to administrator! The page will refresh automatically.');
        setUpgradeCode('');
        
        // Force session update with trigger to refresh JWT token
        await update({ trigger: 'update' });
        
        // Add a small delay to ensure session is updated, then refresh
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upgrade role');
      }
    } catch (error) {
      console.error('Error upgrading role:', error);
      toast.error('Failed to upgrade role');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountData.confirmDelete !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm account deletion');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: deleteAccountData.password,
          confirmDelete: deleteAccountData.confirmDelete,
        }),
      });

      if (response.ok) {
        toast.success('Account successfully deleted. You will be signed out.');
        setDeleteAccountData({ password: '', confirmDelete: '' });
        setShowDeleteDialog(false);
        // Sign out the user
        setTimeout(async () => {
          await signOut({ callbackUrl: '/auth/signin' });
        }, 2000);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    ...(session?.user?.role === 'admin' ? [{ id: 'organization', label: 'Organization', icon: Building2 }] : []),
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account, organization, and application preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Settings
                </CardTitle>
                <CardDescription>
                  Update your personal information and password
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={userSettings.name}
                        onChange={(e) => setUserSettings({ ...userSettings, name: e.target.value })}
                        placeholder="Enter your full name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userSettings.email}
                        onChange={(e) => setUserSettings({ ...userSettings, email: e.target.value })}
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Change Password</h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPasswords(!showPasswords)}
                      >
                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type={showPasswords ? "text" : "password"}
                          value={userSettings.currentPassword}
                          onChange={(e) => setUserSettings({ ...userSettings, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type={showPasswords ? "text" : "password"}
                          value={userSettings.newPassword}
                          onChange={(e) => setUserSettings({ ...userSettings, newPassword: e.target.value })}
                          placeholder="Enter new password"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                          id="confirmPassword"
                          type={showPasswords ? "text" : "password"}
                          value={userSettings.confirmPassword}
                          onChange={(e) => setUserSettings({ ...userSettings, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Role Upgrade Section - DISABLED FOR SECURITY */}
          {activeTab === 'profile' && session?.user?.role !== 'admin' && false && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <Crown className="h-5 w-5" />
                  Upgrade to Administrator
                </CardTitle>
                <CardDescription className="text-amber-700">
                  If you're the organization owner or need admin access, you can upgrade your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpgradeRole} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upgradeCode">Admin Upgrade Code</Label>
                    <Input
                      id="upgradeCode"
                      type="text"
                      value={upgradeCode}
                      onChange={(e) => setUpgradeCode(e.target.value)}
                      placeholder="Enter your upgrade code"
                    />
                    <p className="text-sm text-amber-700">
                      Contact support or use the bootstrap code if you're the first user
                    </p>
                  </div>
                  <Button type="submit" disabled={loading || !upgradeCode} className="bg-amber-600 hover:bg-amber-700">
                    Upgrade to Admin
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Organization Settings */}
          {activeTab === 'organization' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organization Settings
                </CardTitle>
                <CardDescription>
                  Manage your organization's information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateOrganization} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name</Label>
                      <Input
                        id="orgName"
                        type="text"
                        value={orgSettings.name}
                        onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                        placeholder="Enter organization name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="orgType">Organization Type</Label>
                      <Select value={orgSettings.type} onValueChange={(value) => setOrgSettings({ ...orgSettings, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem key="dental" value="dental">Dental Office</SelectItem>
                          <SelectItem key="chiropractic" value="chiropractic">Chiropractic Clinic</SelectItem>
                          <SelectItem key="medical" value="medical">Medical Practice</SelectItem>
                          <SelectItem key="veterinary" value="veterinary">Veterinary Clinic</SelectItem>
                          <SelectItem key="other" value="other">Other Healthcare</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={orgSettings.phone}
                        onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        value={orgSettings.website}
                        onChange={(e) => setOrgSettings({ ...orgSettings, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={orgSettings.address}
                      onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
                      placeholder="Enter full address"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={orgSettings.description}
                      onChange={(e) => setOrgSettings({ ...orgSettings, description: e.target.value })}
                      placeholder="Describe your organization"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how you receive notifications and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive general notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailNotifications: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Task Reminders</Label>
                      <p className="text-sm text-gray-500">Get reminded about upcoming task deadlines</p>
                    </div>
                    <Switch
                      checked={notificationSettings.taskReminders}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, taskReminders: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Document Expiration Alerts</Label>
                      <p className="text-sm text-gray-500">Receive alerts when documents are about to expire</p>
                    </div>
                    <Switch
                      checked={notificationSettings.documentExpiration}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, documentExpiration: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>System Updates</Label>
                      <p className="text-sm text-gray-500">Notifications about system maintenance and updates</p>
                    </div>
                    <Switch
                      checked={notificationSettings.systemUpdates}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, systemUpdates: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-gray-500">Receive weekly compliance summary reports</p>
                    </div>
                    <Switch
                      checked={notificationSettings.weeklyReports}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, weeklyReports: checked })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleUpdateNotifications} disabled={loading} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      checked={securitySettings.twoFactorEnabled}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Require Password Change</Label>
                      <p className="text-sm text-gray-500">Force users to change passwords periodically</p>
                    </div>
                    <Switch
                      checked={securitySettings.requirePasswordChange}
                      onCheckedChange={(checked) => setSecuritySettings({ ...securitySettings, requirePasswordChange: checked })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                    <Select 
                      value={securitySettings.sessionTimeout} 
                      onValueChange={(value) => setSecuritySettings({ ...securitySettings, sessionTimeout: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="1" value="1">1 hour</SelectItem>
                        <SelectItem key="4" value="4">4 hours</SelectItem>
                        <SelectItem key="8" value="8">8 hours</SelectItem>
                        <SelectItem key="24" value="24">24 hours</SelectItem>
                        <SelectItem key="168" value="168">1 week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                    <Select 
                      value={securitySettings.passwordExpiry} 
                      onValueChange={(value) => setSecuritySettings({ ...securitySettings, passwordExpiry: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select expiry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="30" value="30">30 days</SelectItem>
                        <SelectItem key="60" value="60">60 days</SelectItem>
                        <SelectItem key="90" value="90">90 days</SelectItem>
                        <SelectItem key="180" value="180">6 months</SelectItem>
                        <SelectItem key="365" value="365">1 year</SelectItem>
                        <SelectItem key="0" value="0">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleUpdateSecurity} disabled={loading} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delete Account Section */}
          {activeTab === 'security' && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <Trash2 className="h-5 w-5" />
                  Delete Account
                </CardTitle>
                <CardDescription className="text-red-700">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">⚠️ Warning: This will permanently:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Delete your account and profile information</li>
                      <li>• Cancel any active subscriptions</li>
                      <li>• Remove access to all organization data</li>
                      <li>• Delete all your uploaded documents</li>
                    </ul>
                  </div>

                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete My Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="deletePassword">Confirm your password (if you have one)</Label>
                          <Input
                            id="deletePassword"
                            type="password"
                            value={deleteAccountData.password}
                            onChange={(e) => setDeleteAccountData({ 
                              ...deleteAccountData, 
                              password: e.target.value 
                            })}
                            placeholder="Enter your password (optional for OAuth users)"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmDelete">
                            Type <strong>DELETE</strong> to confirm
                          </Label>
                          <Input
                            id="confirmDelete"
                            type="text"
                            value={deleteAccountData.confirmDelete}
                            onChange={(e) => setDeleteAccountData({ 
                              ...deleteAccountData, 
                              confirmDelete: e.target.value 
                            })}
                            placeholder="Type DELETE to confirm"
                          />
                        </div>
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                          setDeleteAccountData({ password: '', confirmDelete: '' });
                        }}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={loading || deleteAccountData.confirmDelete !== 'DELETE'}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {loading ? 'Deleting...' : 'Delete Account'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
