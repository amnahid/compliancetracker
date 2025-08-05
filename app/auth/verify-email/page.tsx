'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'already-verified'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          if (data.message === 'Email already verified') {
            setVerificationStatus('already-verified');
            setMessage('Your email has already been verified');
          } else {
            setVerificationStatus('success');
            setMessage('Your email has been verified successfully!');
          }
        } else {
          setVerificationStatus('error');
          setMessage(data.error || 'Email verification failed');
        }
      } catch (error) {
        setVerificationStatus('error');
        setMessage('Failed to verify email. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  const getIcon = () => {
    switch (verificationStatus) {
      case 'loading':
        return <Clock className="h-12 w-12 text-blue-500 animate-pulse" />;
      case 'success':
      case 'already-verified':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (verificationStatus) {
      case 'loading':
        return 'Verifying Email...';
      case 'success':
        return 'Email Verified!';
      case 'already-verified':
        return 'Already Verified';
      case 'error':
        return 'Verification Failed';
      default:
        return 'Email Verification';
    }
  };

  const getButtonColor = () => {
    switch (verificationStatus) {
      case 'success':
      case 'already-verified':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>
            {verificationStatus === 'loading' && 'Please wait while we verify your email address...'}
            {verificationStatus === 'success' && 'You can now access all features of ComplianceTracker.'}
            {verificationStatus === 'already-verified' && 'You already have full access to all features.'}
            {verificationStatus === 'error' && 'There was a problem verifying your email address.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          
          <div className="space-y-2">
            <Link href="/dashboard">
              <Button className="w-full" variant={getButtonColor()}>
                {verificationStatus === 'error' ? 'Continue to Dashboard' : 'Go to Dashboard'}
              </Button>
            </Link>
            
            {verificationStatus === 'error' && (
              <Link href="/auth/signin">
                <Button variant="outline" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-blue-500 animate-pulse mx-auto mb-2" />
              <p>Loading verification...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
