'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Calendar,
  Check,
  AlertTriangle,
  DollarSign,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface UserSubscription {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  plan: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  trialStart?: string;
  trialEnd?: string;
}

interface UserData {
  subscription?: UserSubscription;
  trialEndsAt?: string;
  stripeCustomerId?: string;
}

export default function BillingPage() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: 'healthcare_compliance' }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create checkout session');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setLoading(true);
      // This would redirect to Stripe customer portal
      toast.info('Redirecting to billing portal...');
      // Implementation would go here
    } catch (error) {
      toast.error('Failed to access billing portal');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-800">Free Trial</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>;
      case 'canceled':
        return <Badge variant="secondary">Canceled</Badge>;
      default:
        return <Badge variant="secondary">No Subscription</Badge>;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, payment methods, and billing history.
        </p>
      </div>

      {/* Trial Status Banner */}
      {isOnTrial && trialDaysLeft > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Free Trial Active</h3>
                  <p className="text-blue-700">
                    {trialDaysLeft} days left in your trial period
                  </p>
                </div>
              </div>
              <Button onClick={handleStartSubscription} disabled={loading}>
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Expired */}
      {isOnTrial && trialDaysLeft === 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-900">Trial Expired</h3>
                  <p className="text-red-700">
                    Subscribe now to continue using all features
                  </p>
                </div>
              </div>
              <Button onClick={handleStartSubscription} disabled={loading}>
                Subscribe Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your current subscription details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                {userData?.subscription?.plan === 'healthcare_compliance' ? 'Compliance Tracker' : 'No Active Plan'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {userData?.subscription?.status === 'active' ? '$49/month' : 
                 isOnTrial ? `Free trial (${trialDaysLeft} days left)` : 
                 'No subscription'}
              </p>
            </div>
            {getStatusBadge(userData?.subscription?.status)}
          </div>

          {userData?.subscription && (
            <>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">
                    {userData.subscription.status === 'trialing' ? 'Trial Ends' : 'Next Billing Date'}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(userData.subscription.status === 'trialing' ? 
                      userData.subscription.trialEnd : 
                      userData.subscription.currentPeriodEnd)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Plan Type</Label>
                  <p className="text-sm text-muted-foreground">
                    Healthcare Compliance Tracker
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2">
            {userData?.subscription?.status === 'active' ? (
              <Button variant="outline" onClick={handleManageSubscription} disabled={loading}>
                Manage Subscription
              </Button>
            ) : (
              <Button onClick={handleStartSubscription} disabled={loading}>
                {isOnTrial ? 'Upgrade to Paid Plan' : 'Start Subscription'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Plan Features
          </CardTitle>
          <CardDescription>
            What's included in your Healthcare Compliance plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Unlimited task creation and tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">1GB document storage</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Email reminders and alerts</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Up to 5 users per practice</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">HIPAA-compliant data handling</span>
            </div>
            <div className="flex items-center gap-3">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">Email support (48-hour response)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
