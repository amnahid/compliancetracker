import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export const PRICE_IDS = {
  healthcare_compliance: process.env.STRIPE_PRICE_ID_HEALTHCARE_COMPLIANCE!,
};

export const PLANS = {
  healthcare_compliance: {
    name: 'Compliance Tracker',
    price: 49,
    interval: 'month',
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
};