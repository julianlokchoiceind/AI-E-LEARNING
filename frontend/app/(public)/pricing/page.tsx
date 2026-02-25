'use client';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { Container } from '@/components/ui/Container';
import { PricingSection } from '@/components/feature/PricingSection';
import { useInlineMessage } from '@/hooks/useInlineMessage';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { useI18n } from '@/lib/i18n/context';

export default function PricingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const [isProcessing, setIsProcessing] = useState(false);
  const pricingLoginMessage = useInlineMessage('pricing-login-required');
  const pricingErrorMessage = useInlineMessage('pricing-error');

  const handleProSubscription = async () => {
    pricingErrorMessage.clear();
    pricingLoginMessage.clear();

    if (!user) {
      pricingLoginMessage.showError(t('pricing.loginToSubscribe'));
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    // Check premium status instead of subscription object
    if (user.premiumStatus) {
      pricingErrorMessage.showSuccess(t('pricing.alreadyPremium'));
      return;
    }

    setIsProcessing(true);
    try {
      // Create payment method (in production, collect card details)
      // For demo, we'll redirect to a payment collection page
      router.push('/billing/subscribe');
    } catch (error: any) {
      console.error('Subscription error:', error);
      pricingErrorMessage.showError(error.message || 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPerCourse = () => {
    router.push('/courses');
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Aurora keyframes */}
      <style>{`
        @keyframes orb-drift-a { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(45px,-30px) scale(1.12); } }
        @keyframes orb-drift-b { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-40px,28px) scale(1.09); } }
        @keyframes orb-drift-c { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-28px,-42px) scale(1.11); } }
        @keyframes orb-drift-d { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(32px,36px) scale(1.07); } }
      `}</style>

      {/* Hero Section */}
      <div className="bento-featured noise-overlay relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px)',
          backgroundSize: '72px 72px'
        }} />

        {/* Aurora orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Orb 1 — top-left, large, blue */}
          <div style={{
            position: 'absolute', top: '-80px', left: '-60px',
            width: '420px', height: '420px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%)',
            animation: 'orb-drift-a 10s ease-in-out infinite alternate',
          }} />
          {/* Orb 2 — bottom-right, large, deep blue */}
          <div style={{
            position: 'absolute', bottom: '-80px', right: '-40px',
            width: '480px', height: '320px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29,78,216,0.20) 0%, transparent 70%)',
            animation: 'orb-drift-b 13s ease-in-out infinite alternate',
            animationDelay: '2s',
          }} />
          {/* Orb 3 — top-right, medium, cyan */}
          <div style={{
            position: 'absolute', top: '-20px', right: '18%',
            width: '300px', height: '280px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.13) 0%, transparent 70%)',
            animation: 'orb-drift-c 9s ease-in-out infinite alternate',
            animationDelay: '4s',
          }} />
          {/* Orb 4 — bottom-center-left, medium, blue */}
          <div style={{
            position: 'absolute', bottom: '0', left: '22%',
            width: '360px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
            animation: 'orb-drift-d 11s ease-in-out infinite alternate',
            animationDelay: '1.5s',
          }} />
        </div>

        {/* Floating plan card — left */}
        <div className="absolute left-4 lg:left-[7%] top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="w-28 rounded-2xl bg-white/5 border border-white/10 p-3 backdrop-blur-sm">
            <div className="text-[9px] font-bold uppercase tracking-widest text-blue-300/50 mb-1">Free</div>
            <div className="text-3xl font-black text-white leading-none">$0</div>
            <div className="text-[9px] text-white/25 mt-1">forever</div>
          </div>
        </div>

        {/* Floating plan card — right */}
        <div className="absolute right-4 lg:right-[7%] top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="w-28 rounded-2xl bg-blue-500/15 border border-blue-400/30 p-3 backdrop-blur-sm shadow-lg shadow-blue-500/10">
            <div className="text-[9px] font-bold uppercase tracking-widest text-blue-300/70 mb-1">Pro</div>
            <div className="text-3xl font-black text-blue-300 leading-none">$19</div>
            <div className="text-[9px] text-blue-300/40 mt-1">/month</div>
          </div>
        </div>

        {/* Main content */}
        <Container variant="public" className="py-14 md:py-20 relative z-10">
          <div className="text-center max-w-xl mx-auto">

            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400/80">Plans & Pricing</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-4">
              {t('pricing.heroTitle')}
            </h1>
            <p className="text-blue-200/55 text-sm md:text-base max-w-md mx-auto leading-relaxed">
              {t('pricing.heroSubtitle')}
            </p>

            {/* Metrics bar */}
            <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-white/10">
              <div className="text-center">
                <div className="text-xl font-black text-white">3</div>
                <div className="text-[10px] uppercase tracking-wider text-white/30">Plans</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-xl font-black text-white">14</div>
                <div className="text-[10px] uppercase tracking-wider text-white/30">Day Refund</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-xl font-black text-white">∞</div>
                <div className="text-[10px] uppercase tracking-wider text-white/30">Courses</div>
              </div>
            </div>

          </div>
        </Container>
      </div>

      <Container variant="public" className="pt-12 md:pt-16 lg:pt-24">
        <div>
          {/* Global messages for pricing errors */}
          {pricingLoginMessage.message && (
            <InlineMessage
              message={pricingLoginMessage.message.message}
              type={pricingLoginMessage.message.type}
              onDismiss={pricingLoginMessage.clear}
            />
          )}

          {pricingErrorMessage.message && (
            <InlineMessage
              message={pricingErrorMessage.message.message}
              type={pricingErrorMessage.message.type}
              onDismiss={pricingErrorMessage.clear}
            />
          )}

          <PricingSection />
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">{t('pricing.faqTitle')}</h2>

          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-2">{t('pricing.faqSwitchPlans')}</h3>
              <p className="text-muted-foreground">
                {t('pricing.faqSwitchPlansAnswer')}
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-2">{t('pricing.faqPaymentMethods')}</h3>
              <p className="text-muted-foreground">
                {t('pricing.faqPaymentMethodsAnswer')}
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <h3 className="font-semibold text-lg mb-2">{t('pricing.faqRefundPolicy')}</h3>
              <p className="text-muted-foreground">
                {t('pricing.faqRefundPolicyAnswer')}
              </p>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}