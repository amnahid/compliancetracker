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
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PRICING_PLANS, formatPrice } from '@/lib/pricing';

interface UserSubscription {
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  plan: string;
  interval?: 'month' | 'year';
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
  const { data: session, status } = useSession();

  // Redirect non-admin users
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
          <p className="text-muted-foreground mb-4">
            Billing information is only accessible to organization administrators.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact your administrator if you need assistance with billing or subscription matters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <BillingPageContent />
    </AuthGuard>
  );
}

function BillingPageContent() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Temporary billing disable until August 15, 2025
  const BILLING_UNLOCK_DATE = new Date('2025-08-15');
  const currentDate = new Date();
  const isBillingDisabled = currentDate < BILLING_UNLOCK_DATE;
  const daysUntilUnlock = Math.ceil((BILLING_UNLOCK_DATE.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  // Check for success/cancel parameters and refresh data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true') {
      toast.success('Payment successful! Your subscription is now active.');
      // Refresh user data after successful payment
      setTimeout(() => {
        fetchUserData();
      }, 2000); // Give webhook time to process
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (canceled === 'true') {
      toast.error('Payment was canceled');
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

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

  const handleStartSubscription = async (planType: 'monthly' | 'yearly' = 'monthly') => {
    try {
      setLoading(true);
      const planName = planType === 'yearly' ? 'healthcare_compliance_yearly' : 'healthcare_compliance';
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planName }),
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

  // Temporary function to manually activate subscription for testing
  const handleTestActivation = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/test/activate-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ forceActivate: true }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Subscription activated successfully!');
        // Refresh user data
        fetchUserData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to activate subscription');
      }
    } catch (error) {
      toast.error('Something went wrong');
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

  const getSubscriptionPriceDisplay = (subscription: UserSubscription) => {
    // Map subscription plan to pricing
    const isYearly = subscription.interval === 'year';
    const plan = isYearly ? PRICING_PLANS.yearly : PRICING_PLANS.monthly;
    
    return formatPrice(plan.price, plan.interval);
  };

  const calculateTrialDaysLeft = () => {
    if (!userData?.trialEndsAt) return 0;
    const trialEnd = new Date(userData.trialEndsAt);
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const isOnTrial = () => {
    // User is on trial if:
    // 1. Subscription status is 'trialing', OR
    // 2. No subscription exists AND trialEndsAt is in the future
    if (userData?.subscription?.status === 'trialing') return true;
    if (userData?.subscription?.status === 'active') return false;
    
    // Check if trial hasn't expired yet
    if (userData?.trialEndsAt) {
      const trialEnd = new Date(userData.trialEndsAt);
      return trialEnd > new Date();
    }
    
    return false;
  };

  const isActiveSubscription = userData?.subscription?.status === 'active';
  const userIsOnTrial = isOnTrial();
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

      {/* Temporary Billing Disable Notice */}
      {isBillingDisabled && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900">Billing Options Temporarily Disabled</h3>
                <p className="text-amber-700">
                  Billing options will be unlocked on August 15, 2025 ({daysUntilUnlock} days remaining)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Status Banner */}
      {userIsOnTrial && trialDaysLeft > 0 && (
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
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleStartSubscription('monthly')} 
                  disabled={loading || isBillingDisabled}
                  title={isBillingDisabled ? "Billing options will be unlocked on August 15, 2025" : ""}
                  variant="outline"
                  size="sm"
                >
                  $49/month
                </Button>
                <Button 
                  onClick={() => handleStartSubscription('yearly')} 
                  disabled={loading || isBillingDisabled}
                  title={isBillingDisabled ? "Billing options will be unlocked on August 15, 2025" : ""}
                  size="sm"
                >
                  $499/year
                  <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Save $89</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trial Expired */}
      {userIsOnTrial && trialDaysLeft === 0 && (
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
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleStartSubscription('monthly')} 
                  disabled={loading || isBillingDisabled}
                  title={isBillingDisabled ? "Billing options will be unlocked on August 15, 2025" : ""}
                  variant="outline"
                  size="sm"
                >
                  $49/month
                </Button>
                <Button 
                  onClick={() => handleStartSubscription('yearly')} 
                  disabled={loading || isBillingDisabled}
                  title={isBillingDisabled ? "Billing options will be unlocked on August 15, 2025" : ""}
                  size="sm"
                >
                  $499/year
                  <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Save $89</span>
                </Button>
              </div>
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
                {userData?.subscription?.plan ? 'Compliance Tracker' : 'No Active Plan'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {userData?.subscription?.status === 'active' ? 
                  getSubscriptionPriceDisplay(userData.subscription) :
                 userIsOnTrial ? `Free trial (${trialDaysLeft} days left)` : 
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
              <Button 
                variant="outline" 
                onClick={handleManageSubscription} 
                disabled={loading || isBillingDisabled}
                title={isBillingDisabled ? "Billing options will be unlocked on August 15, 2025" : ""}
              >
                Manage Subscription
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleStartSubscription('monthly')} 
                  disabled={loading || isBillingDisabled}
                  title={isBillingDisabled ? "Billing options will be unlocked on August 15, 2025" : ""}
                  variant="outline"
                  size="sm"
                >
                  $49/month
                </Button>
                <Button 
                  onClick={() => handleStartSubscription('yearly')} 
                  disabled={loading || isBillingDisabled}
                  title={isBillingDisabled ? "Billing options will be unlocked on August 15, 2025" : ""}
                  size="sm"
                >
                  $499/year
                  <span className="ml-1 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">Save $89</span>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug/Test Section (Remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">🧪 Debug Tools</CardTitle>
            <CardDescription className="text-orange-600">
              Development only - Test subscription activation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p><strong>Current Status:</strong> {userData?.subscription?.status || 'no_subscription'}</p>
              <p><strong>Trial Ends:</strong> {userData?.trialEndsAt || 'not_set'}</p>
              <p><strong>Is On Trial:</strong> {userIsOnTrial ? 'Yes' : 'No'}</p>
              <p><strong>Is Active:</strong> {isActiveSubscription ? 'Yes' : 'No'}</p>
            </div>
            <Button 
              onClick={handleTestActivation} 
              disabled={loading || isBillingDisabled}
              className="bg-orange-600 hover:bg-orange-700"
              title={isBillingDisabled ? "Billing options will be unlocked on August 15, 2025" : ""}
            >
              🔧 Force Activate Subscription (Test)
            </Button>
          </CardContent>
        </Card>
      )}

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
