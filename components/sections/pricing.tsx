'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import Link from 'next/link';
import { PRICING_PLANS, COMPETITORS, formatPrice, type BillingInterval } from '@/lib/pricing';

export function Pricing() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('month');
  const [isYearly, setIsYearly] = useState(false);

  const currentPlan = isYearly ? PRICING_PLANS.yearly : PRICING_PLANS.monthly;

  const toggleBilling = () => {
    setIsYearly(!isYearly);
    setBillingInterval(isYearly ? 'month' : 'year');
  };

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

        {/* Billing Toggle */}
        <div className="mx-auto mt-12 max-w-sm">
          <div className="flex items-center justify-center space-x-4 bg-card rounded-lg p-2 border border-border">
            <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={toggleBilling}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                isYearly ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  isYearly ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <Badge className="bg-green-600 text-white">Save $89</Badge>
            )}
          </div>
        </div>

        {/* Price Comparison */}
        <div className="mx-auto mt-12 max-w-md">
          <h3 className="text-center text-lg font-semibold text-foreground mb-6">
            Compare with Competitors
          </h3>
          <div className="space-y-3">
            {COMPETITORS.map((competitor, index) => (
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
                  {competitor.highlight && <Badge className="ml-2 bg-blue-600">You save {competitor.savings}!</Badge>}
                </span>
                <span className={`font-bold ${competitor.highlight ? 'text-blue-600' : 'text-foreground'}`}>
                  {isYearly && competitor.yearlyPrice ? competitor.yearlyPrice : competitor.price}
                  {!competitor.highlight && (
                    <span className="text-sm text-muted-foreground">
                      /{isYearly ? 'year' : 'month'}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mx-auto mt-16 max-w-lg">
          <Card className="relative border-blue-500 shadow-xl">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600">
              <Star className="w-3 h-3 mr-1" />
              {isYearly ? 'Best Value - Save $89/year' : 'Best Value for Small Practices'}
            </Badge>
            
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl">{currentPlan.name}</CardTitle>
              <CardDescription className="text-base">
                Everything your practice needs for healthcare compliance
              </CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold text-blue-600">${currentPlan.price}</span>
                <span className="text-muted-foreground">/{currentPlan.interval}</span>
              </div>
              {isYearly && (
                <div className="mt-2">
                  <span className="text-sm text-muted-foreground line-through">
                    ${PRICING_PLANS.monthly.price * 12}/year
                  </span>
                  <span className="ml-2 text-sm text-green-600 font-medium">
                    Save ${currentPlan.savings}
                  </span>
                </div>
              )}
              {!isYearly && (
                <div className="mt-2">
                  <span className="text-sm text-blue-600 font-medium">
                    Or ${PRICING_PLANS.yearly.price}/year (save $89)
                  </span>
                </div>
              )}
              <p className="text-sm text-green-600 font-medium mt-2">
                {currentPlan.trial_days}-day free trial
              </p>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-4 mb-8">
                {currentPlan.features.map((feature, featureIndex) => (
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
                  <Link href={`/auth/signup?plan=${isYearly ? 'yearly' : 'monthly'}`}>
                    Start Free Trial
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
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">200,000+</div>
                <p className="text-muted-foreground">Dentists in the US alone</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">80%+ Savings</div>
                <p className="text-muted-foreground">Compared to competitors</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {isYearly ? '$89' : '$200+'}
                </div>
                <p className="text-muted-foreground">
                  {isYearly ? 'Annual savings' : 'Monthly competitor pricing'}
                </p>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-muted-foreground">
                <strong>Simple math:</strong> At just {formatPrice(currentPlan.price, currentPlan.interval)}, 
                we're accessible to small practices while competitors charge $249-$500+ for similar features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}