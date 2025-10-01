export type BillingInterval = 'month' | 'year';

export interface PricingPlan {
  name: string;
  price: number;
  interval: BillingInterval;
  monthlyEquivalent?: number;
  yearlyPrice?: number;
  savings?: number;
  features: string[];
  trial_days: number;
  popular?: boolean;
  badge?: string;
}

export const PRICING_PLANS: Record<string, PricingPlan> = {
  monthly: {
    name: 'Compliance Tracker',
    price: 49,
    interval: 'month',
    yearlyPrice: 499,
    features: [
      'Unlimited task creation and tracking',
      'Unlimited document uploads (1GB storage)',
      'Email reminders for tasks and expirations',
      'Up to 5 users per practice (admin + staff)',
      'Basic support (email, 48-hour response)',
      'HIPAA-compliant data handling',
      'License renewal tracking',
      'Staff certification management',
      'Compliance score dashboard',
      'Document expiration alerts',
    ],
    trial_days: 14,
  },
  yearly: {
    name: 'Compliance Tracker',
    price: 499,
    interval: 'year',
    monthlyEquivalent: 41.58, // 499/12
    savings: 89, // (49 * 12) - 499
    features: [
      'Unlimited task creation and tracking',
      'Unlimited document uploads (1GB storage)',
      'Email reminders for tasks and expirations',
      'Up to 5 users per practice (admin + staff)',
      'Priority support (email, 24-hour response)',
      'HIPAA-compliant data handling',
      'License renewal tracking',
      'Staff certification management',
      'Compliance score dashboard',
      'Document expiration alerts',
      '2 months FREE (vs monthly billing)',
      'Priority customer support',
    ],
    trial_days: 14,
    popular: true,
    badge: 'Best Value - Save $89/year',
  },
};

export const COMPETITORS = [
  { name: 'Compliancy Group', price: '$249+', interval: 'month' },
  { name: 'MedTrainer', price: '$500+', interval: 'month' },
  { 
    name: 'ComplianceTracker', 
    price: '$49', 
    yearlyPrice: '$499',
    interval: 'month',
    highlight: true,
    savings: '80%+'
  },
];

export function formatPrice(price: number, interval: BillingInterval): string {
  return `$${price}${interval === 'month' ? '/mo' : '/yr'}`;
}

export function calculateSavings(monthlyPrice: number, yearlyPrice: number): number {
  return (monthlyPrice * 12) - yearlyPrice;
}

export function calculateMonthlyEquivalent(yearlyPrice: number): number {
  return Math.round((yearlyPrice / 12) * 100) / 100;
}
