'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building2, Users, Shield, Mail, Crown, Copy, Check, CreditCard, ArrowUpCircle, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/lib/pricing';

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  description: string;
  domain?: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
  settings: {
    allowPublicSignup: boolean;
    requireEmailVerification: boolean;
    defaultRole: string;
  };
  subscription?: {
    status: string;
    plan: string;
    seats: number;
    usedSeats: number;
  };
}

export default function OrganizationSettings() {
  const { data: session } = useSession();
  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '',
    allowPublicSignup: false,
    requireEmailVerification: true,
    defaultRole: 'user',
  });

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const res = await fetch('/api/organization');
      if (res.ok) {
        const data = await res.json();
        setOrganization(data.organization);
        setCurrentUserId(data.currentUserId);
        setFormData({
          name: data.organization.name,
          description: data.organization.description || '',
          domain: data.organization.domain || '',
          allowPublicSignup: data.organization.settings.allowPublicSignup,
          requireEmailVerification: data.organization.settings.requireEmailVerification,
          defaultRole: data.organization.settings.defaultRole,
        });
      }
    } catch (error) {
      toast.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const getOrganizationPriceDisplay = (subscription: any) => {
    if (!subscription || subscription.status !== 'active') {
      return 'Starting at $49/month';
    }
    // Map subscription interval to pricing
    if (subscription.interval === 'year') {
      return '$499/year';
    }
    return '$49/month';
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/organization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Organization settings updated successfully');
        await fetchOrganization();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to update settings');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const copyInviteLink = async () => {
    if (!organization) return;
    
    const inviteLink = `${window.location.origin}/auth/signup?org=${organization.slug}`;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Invite link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Check ownership using MongoDB user IDs
  const isOwner = currentUserId === organization?.owner?.id;

  // Debug logging
  console.log('Debug - Current user MongoDB ID:', currentUserId);
  console.log('Debug - Organization owner:', organization?.owner);
  console.log('Debug - Is owner?', isOwner);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Organization Found</h1>
          <p className="text-muted-foreground">You don't belong to any organization.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8" />
            Organization Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your organization settings and members
          </p>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update your organization's basic details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div key="org-name">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isOwner}
                    required
                  />
                </div>
                <div key="org-slug">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={organization.slug}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={!isOwner}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="domain">Email Domain</Label>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => handleInputChange('domain', e.target.value)}
                  disabled={!isOwner}
                  placeholder="yourcompany.com"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Users with this email domain can join automatically if public signup is enabled
                </p>
              </div>

              {isOwner && (
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Configure security and access control settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label>Allow Public Signup</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users with your domain to join automatically
                </p>
              </div>
              <Switch
                checked={formData.allowPublicSignup}
                onCheckedChange={(checked) => handleInputChange('allowPublicSignup', checked)}
                disabled={!isOwner}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label>Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  New users must verify their email before accessing the system
                </p>
              </div>
              <Switch
                checked={formData.requireEmailVerification}
                onCheckedChange={(checked) => handleInputChange('requireEmailVerification', checked)}
                disabled={!isOwner}
              />
            </div>

            <div className="space-y-2">
              <Label>Default Role for New Users</Label>
              <select
                value={formData.defaultRole}
                onChange={(e) => handleInputChange('defaultRole', e.target.value)}
                disabled={!isOwner}
                className="w-full p-2 border rounded-md"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {isOwner && (
              <div className="pt-4">
                <Button 
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Security Settings'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({organization.members.length})
            </CardTitle>
            <CardDescription>
              Manage organization members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Invite Link */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Invite Link</Label>
                  <p className="text-sm text-muted-foreground">
                    Share this link to invite new members
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInviteLink}
                  className="flex items-center gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>

              <Separator />

              {/* Members List */}
              <div className="space-y-3">
                {organization.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.name}</span>
                          {member.id === organization.owner.id && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                        {member.role}
                      </Badge>
                      {member.id === organization.owner.id && (
                        <Badge variant="outline">Owner</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription & Billing
            </CardTitle>
            <CardDescription>
              Manage your subscription plan and billing details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Plan Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div key="status">
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={organization.subscription?.status === 'active' ? 'default' : 'secondary'}>
                    {organization.subscription?.status || 'inactive'}
                  </Badge>
                </div>
              </div>
              <div key="plan">
                <Label className="text-sm text-muted-foreground">Current Plan</Label>
                <p className="font-medium capitalize mt-1">
                  {organization.subscription?.plan?.replace('_', ' ') || 'No Plan'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getOrganizationPriceDisplay(organization.subscription)}
                </p>
              </div>
              <div key="seats">
                <Label className="text-sm text-muted-foreground">Seat Usage</Label>
                <p className="font-medium mt-1">
                  {organization.subscription?.usedSeats || 0} / {organization.subscription?.seats || 0} users
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ 
                      width: organization.subscription?.seats 
                        ? `${(organization.subscription.usedSeats / organization.subscription.seats) * 100}%` 
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Plan Features */}
            <div>
              <Label className="text-sm font-medium">
                {organization.subscription?.status === 'active' ? 'Current Plan Features' : 'Available Plan Features'}
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div key="task-tracking" className="text-sm text-muted-foreground">✓ Unlimited task creation and tracking</div>
                <div key="storage" className="text-sm text-muted-foreground">✓ 1GB document storage</div>
                <div key="reminders" className="text-sm text-muted-foreground">✓ Email reminders and alerts</div>
                <div key="users" className="text-sm text-muted-foreground">✓ Up to {organization.subscription?.seats || 10} users</div>
                <div key="hipaa" className="text-sm text-muted-foreground">✓ HIPAA-compliant data handling</div>
                <div key="support" className="text-sm text-muted-foreground">✓ Basic email support</div>
              </div>
            </div>

            <Separator />

            {/* Upgrade Options */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Subscription Actions</Label>
                <p className="text-sm text-muted-foreground">
                  Manage your subscription and billing preferences
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Start Subscription Button (if no active subscription) */}
                {(!organization.subscription || organization.subscription.status !== 'active') && (
                  <Button 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/stripe/create-checkout-session', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ plan: 'healthcare_compliance' })
                        });
                        
                        if (response.ok) {
                          const { url } = await response.json();
                          window.open(url, '_blank');
                        } else {
                          toast.error('Failed to create checkout session');
                        }
                      } catch (error) {
                        toast.error('Something went wrong');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Crown className="h-4 w-4" />
                    Start Subscription
                  </Button>
                )}

                {/* Add More Seats Button (if subscription is active and at capacity) */}
                {organization.subscription?.status === 'active' && 
                 organization.subscription.usedSeats >= organization.subscription.seats && (
                  <Button 
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/stripe/create-checkout-session', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ plan: 'healthcare_compliance' })
                        });
                        
                        if (response.ok) {
                          const { url } = await response.json();
                          window.open(url, '_blank');
                        } else {
                          toast.error('Failed to create upgrade session');
                        }
                      } catch (error) {
                        toast.error('Something went wrong');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    Add More Seats
                  </Button>
                )}
                
                {/* Manage Billing Button (only if subscription is active) */}
                {organization.subscription?.status === 'active' && (
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/stripe/customer-portal', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' }
                        });
                        
                        if (response.ok) {
                          const { url } = await response.json();
                          window.open(url, '_blank');
                        } else {
                          const error = await response.json();
                          toast.error(error.error || 'Failed to open billing portal');
                        }
                      } catch (error) {
                        toast.error('Something went wrong');
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    Manage Billing
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    window.open('/dashboard/billing', '_blank');
                  }}
                  className="flex items-center gap-2"
                >
                  View Usage & History
                </Button>
              </div>
            </div>

            {/* Billing Information */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium">Need Help?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contact our support team if you need to change plans, add features, or have billing questions.
                  </p>
                  <Button variant="link" className="p-0 h-auto mt-2" asChild>
                    <a href="mailto:support@compliancetracker.com">
                      support@compliancetracker.com
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
