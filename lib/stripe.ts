import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export const PRICE_IDS = {
  healthcare_compliance_monthly: process.env.STRIPE_PRICE_ID_HEALTHCARE_COMPLIANCE_MONTHLY!,
  healthcare_compliance_yearly: process.env.STRIPE_PRICE_ID_HEALTHCARE_COMPLIANCE_YEARLY!,
};

export const PLANS = {
  healthcare_compliance_monthly: {
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
  healthcare_compliance_yearly: {
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
  },
};