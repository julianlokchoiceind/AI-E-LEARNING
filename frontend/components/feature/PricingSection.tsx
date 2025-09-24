'use client';

import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Get started with basics',
    features: [
      'Access to free courses',
      'Basic AI assistant support',
      'Course completion certificates'
    ],
    limitations: [
      'Limited course access',
      'Ads supported'
    ],
    buttonText: 'Current Plan',
    buttonVariant: 'outline' as const,
    isPopular: false
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Everything you need to succeed',
    features: [
      'Unlimited access to all courses',
      'Priority AI assistant support',
      'Download courses for offline',
      'Exclusive Pro content',
      'Ad-free experience',
      'Early access to new courses'
    ],
    limitations: [],
    buttonText: 'Subscribe to Pro',
    buttonVariant: 'primary' as const,
    isPopular: true
  },
  {
    name: 'Pay Per Course',
    price: '$19-99',
    period: '/course',
    description: 'Choose what you learn',
    features: [
      'Lifetime access to purchased courses',
      'Pay only for what you need',
      'Course completion certificates',
      'Basic AI assistant support'
    ],
    limitations: [
      'No monthly commitment'
    ],
    buttonText: 'Browse Courses',
    buttonVariant: 'outline' as const,
    isPopular: false
  }
];

export function PricingSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative p-6 ${
                plan.isPopular ? 'border-primary shadow-lg' : 'border-border'
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="primary" className="px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <Check className="w-4 h-4 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}

                {plan.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground mr-3 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{limitation}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                variant={plan.buttonVariant}
                className="w-full"
                disabled={plan.name === 'Free'}
              >
                {plan.buttonText}
              </Button>
            </Card>
          ))}
    </div>
  );
}