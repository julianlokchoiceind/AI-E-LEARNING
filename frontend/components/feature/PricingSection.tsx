'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/lib/i18n/context';
import { TranslationKey } from '@/lib/i18n/utils';

interface PlanConfig {
  nameKey: TranslationKey
  priceKey: TranslationKey
  periodKey: TranslationKey
  descriptionKey: TranslationKey
  featureKeys: TranslationKey[]
  limitationKeys: TranslationKey[]
  buttonKey: TranslationKey
  buttonVariant: 'outline' | 'primary'
  isPopular: boolean
}

const planConfigs: PlanConfig[] = [
  {
    nameKey: 'pricingPlans.freeName',
    priceKey: 'pricingPlans.freePrice',
    periodKey: 'pricingPlans.freePeriod',
    descriptionKey: 'pricingPlans.freeDescription',
    featureKeys: [
      'pricingPlans.freeFeature1',
      'pricingPlans.freeFeature2',
      'pricingPlans.freeFeature3',
    ],
    limitationKeys: [
      'pricingPlans.freeLimitation1',
      'pricingPlans.freeLimitation2',
    ],
    buttonKey: 'pricingPlans.freeButton',
    buttonVariant: 'outline',
    isPopular: false
  },
  {
    nameKey: 'pricingPlans.proName',
    priceKey: 'pricingPlans.proPrice',
    periodKey: 'pricingPlans.proPeriod',
    descriptionKey: 'pricingPlans.proDescription',
    featureKeys: [
      'pricingPlans.proFeature1',
      'pricingPlans.proFeature2',
      'pricingPlans.proFeature3',
      'pricingPlans.proFeature4',
      'pricingPlans.proFeature5',
      'pricingPlans.proFeature6',
    ],
    limitationKeys: [],
    buttonKey: 'pricingPlans.proButton',
    buttonVariant: 'primary',
    isPopular: true
  },
  {
    nameKey: 'pricingPlans.payPerCourseName',
    priceKey: 'pricingPlans.payPerCoursePrice',
    periodKey: 'pricingPlans.payPerCoursePeriod',
    descriptionKey: 'pricingPlans.payPerCourseDescription',
    featureKeys: [
      'pricingPlans.payPerCourseFeature1',
      'pricingPlans.payPerCourseFeature2',
      'pricingPlans.payPerCourseFeature3',
      'pricingPlans.payPerCourseFeature4',
    ],
    limitationKeys: [
      'pricingPlans.payPerCourseLimitation',
    ],
    buttonKey: 'pricingPlans.payPerCourseButton',
    buttonVariant: 'outline',
    isPopular: false
  }
];

export function PricingSection() {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {planConfigs.map((plan, index) => (
            <Card
              key={index}
              className={`relative p-6 ${
                plan.isPopular ? 'border-primary shadow-lg' : 'border-border'
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="primary" className="px-4 py-1">
                    {t('pricingPlans.proPopular')}
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {t(plan.nameKey)}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {t(plan.descriptionKey)}
                </p>
                <div className="flex items-baseline justify-center mb-4">
                  <span className="text-4xl font-bold text-foreground">
                    {t(plan.priceKey)}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {t(plan.periodKey)}
                  </span>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                {plan.featureKeys.map((featureKey, featureIndex) => (
                  <div key={featureIndex} className="flex items-center mb-2">
                    <Check className="w-4 h-4 text-success mr-3 flex-shrink-0" />
                    <span className="text-sm text-foreground">{t(featureKey)}</span>
                  </div>
                ))}

                {plan.limitationKeys.map((limitationKey, limitationIndex) => (
                  <div key={limitationIndex} className="flex items-center mb-2">
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground mr-3 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{t(limitationKey)}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button
                variant={plan.buttonVariant}
                className="w-full"
                disabled={index === 0}
              >
                {t(plan.buttonKey)}
              </Button>
            </Card>
          ))}
    </div>
  );
}
