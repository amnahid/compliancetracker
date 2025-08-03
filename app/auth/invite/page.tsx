'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Building2, User, Shield, Calendar } from 'lucide-react';
import Link from 'next/link';

interface InvitationData {
  email: string;
  name: string;
  role: string;
  organization: string;
  invitedBy: {
    name: string;
    email: string;
  };
  expiresAt: string;
}

function InvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const validateInvitation = useCallback(async () => {
    try {
      const response = await fetch(`/api/auth/invite?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setInvitation(data.invitation);
      } else {
        setError(data.error || 'Invalid invitation');
      }
    } catch (error) {
      console.error('Error validating invitation:', error);
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      validateInvitation();
    } else {
      setError('No invitation token provided');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, validateInvitation]);

  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!invitation) return;

    setAccepting(true);

    try {
      // Create account with invitation data
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: invitation.name,
          email: invitation.email,
          password,
          role: invitation.role,
          invitationToken: token,
        }),
      });

      const signupData = await signupResponse.json();

      if (signupResponse.ok) {
        toast.success('Account created successfully! Please sign in.');
        router.push('/auth/signin?message=Account created successfully');
      } else {
        toast.error(signupData.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to create account');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Link href="/auth/signin">
                <Button variant="outline">Back to Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Join Your Team</CardTitle>
          <CardDescription>
            You've been invited to join {invitation.organization}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Organization:</span>
              <span>{invitation.organization}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Email:</span>
              <span>{invitation.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Role:</span>
              <span className="capitalize">{invitation.role}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Invited by:</span>
              <span>{invitation.invitedBy.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Expires:</span>
              <span>{new Date(invitation.expiresAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Account Creation Form */}
          <form onSubmit={handleAcceptInvitation} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={invitation.name}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                required
                minLength={8}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={accepting}
            >
              {accepting ? 'Creating Account...' : 'Accept Invitation & Create Account'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-blue-600 hover:underline">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading invitation...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <InvitePageContent />
    </Suspense>
  );
}
