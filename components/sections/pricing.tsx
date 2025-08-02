import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import Link from 'next/link';

const plan = {
  name: 'Compliance Tracker',
  price: 49,
  description: 'Everything your practice needs for healthcare compliance',
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
  cta: 'Start Free Trial',
  trial: '14-day free trial',
};

const competitors = [
  { name: 'Compliancy Group', price: '$249+' },
  { name: 'MedTrainer', price: '$500+' },
  { name: 'ComplianceTracker', price: '$49', highlight: true },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, Affordable Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Designed for small healthcare practices with straightforward, transparent pricing
          </p>
        </div>

        {/* Price Comparison */}
        <div className="mx-auto mt-12 max-w-md">
          <h3 className="text-center text-lg font-semibold text-foreground mb-6">
            Compare with Competitors
          </h3>
          <div className="space-y-3">
            {competitors.map((competitor, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  competitor.highlight 
                    ? 'bg-blue-100 border-2 border-blue-500' 
                    : 'bg-card border border-border'
                }`}
              >
                <span className={`font-medium ${competitor.highlight ? 'text-blue-900' : 'text-card-foreground'}`}>
                  {competitor.name}
                  {competitor.highlight && <Badge className="ml-2 bg-blue-600">You save 80%!</Badge>}
                </span>
                <span className={`font-bold ${competitor.highlight ? 'text-blue-600' : 'text-foreground'}`}>
                  {competitor.price}
                  {!competitor.highlight && <span className="text-sm text-muted-foreground">/month</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mx-auto mt-16 max-w-lg">
          <Card className="relative border-blue-500 shadow-xl">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
              <Star className="w-3 h-3 mr-1" />
              Best Value for Small Practices
            </Badge>
            
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="text-base">{plan.description}</CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold text-blue-600">${plan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-green-600 font-medium mt-2">{plan.trial}</p>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-card-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className="space-y-3">
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6">
                  <Link href="/auth/signup">
                    {plan.cta}
                  </Link>
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  No credit card required • Cancel anytime
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Projections */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="bg-card rounded-lg border border-border p-8">
            <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
              Why This Pricing Works
            </h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">200,000+</div>
                <p className="text-muted-foreground">Dentists in the US alone</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">80% Savings</div>
                <p className="text-muted-foreground">Compared to competitors</p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                <strong>Simple math:</strong> At just $49/month, we're accessible to small practices 
                while competitors charge $249-$500+ for similar features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}