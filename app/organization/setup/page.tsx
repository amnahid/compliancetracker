'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Building2, Users, Shield, Check } from 'lucide-react';

export default function OrganizationSetup() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '',
    allowPublicSignup: false,
    requireEmailVerification: true,
    defaultRole: 'user' as 'user' | 'admin',
  });

  useEffect(() => {
    // Check if user already has a proper organization
    if (session?.user?.organization && typeof session.user.organization === 'object') {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast.error('Organization name is required');
      return false;
    }
    if (formData.name.length < 2) {
      toast.error('Organization name must be at least 2 characters');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/organization/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Organization created successfully!');
        
        // Update session with new organization
        await update();
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to create organization');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {step > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <span className="text-sm font-medium">Organization Info</span>
          </div>
          <Separator className="w-12" />
          <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <span className="text-sm font-medium">Settings</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>Setup Your Organization</CardTitle>
            <CardDescription>
              Create your organization to start managing compliance together
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Organization Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your organization name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Brief description of your organization (optional)"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="domain">Email Domain</Label>
                    <Input
                      id="domain"
                      type="text"
                      value={formData.domain}
                      onChange={(e) => handleInputChange('domain', e.target.value)}
                      placeholder="yourcompany.com (optional)"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      If specified, users with this email domain can be automatically added to your organization
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={handleNext}>
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Settings
                    </h3>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="allowPublicSignup">Allow Public Signup</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow anyone with your email domain to join automatically
                        </p>
                      </div>
                      <Switch
                        id="allowPublicSignup"
                        checked={formData.allowPublicSignup}
                        onCheckedChange={(checked) => handleInputChange('allowPublicSignup', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <Label htmlFor="requireEmailVerification">Require Email Verification</Label>
                        <p className="text-sm text-muted-foreground">
                          New users must verify their email before accessing the system
                        </p>
                      </div>
                      <Switch
                        id="requireEmailVerification"
                        checked={formData.requireEmailVerification}
                        onCheckedChange={(checked) => handleInputChange('requireEmailVerification', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Management
                    </h3>
                    
                    <div>
                      <Label htmlFor="defaultRole">Default Role for New Users</Label>
                      <select
                        id="defaultRole"
                        value={formData.defaultRole}
                        onChange={(e) => handleInputChange('defaultRole', e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      <p className="text-sm text-muted-foreground mt-1">
                        The role assigned to new users joining your organization
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setStep(1)}
                    >
                      Back
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Organization'}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
