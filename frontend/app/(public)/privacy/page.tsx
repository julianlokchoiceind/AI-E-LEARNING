"use client";

import { useI18n } from '@/lib/i18n/context';

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {t('privacy.title', 'Privacy Policy')}
            </h1>
            <p className="text-gray-600">
              {t('privacy.lastUpdated', 'Last updated: January 20, 2025')}
            </p>
          </div>

          {/* Privacy Content */}
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.intro.title', '1. Introduction')}
            </h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              {t('privacy.intro.content', 'AI E-Learning Platform ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our online learning platform and related services.')}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.collection.title', '2. Information We Collect')}
            </h2>
            <div className="mb-6 text-gray-700 leading-relaxed">
              <h3 className="text-lg font-medium mb-3">
                {t('privacy.collection.personal.title', 'Personal Information')}
              </h3>
              <p className="mb-4">
                {t('privacy.collection.personal.intro', 'We collect information you provide directly to us, including:')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li>{t('privacy.collection.personal.name', 'Name and email address when you create an account')}</li>
                <li>{t('privacy.collection.personal.profile', 'Profile information and preferences')}</li>
                <li>{t('privacy.collection.personal.payment', 'Payment information (processed securely by Stripe)')}</li>
                <li>{t('privacy.collection.personal.communication', 'Communication data when you contact us')}</li>
                <li>{t('privacy.collection.personal.oauth', 'OAuth information from third-party providers (Google, GitHub, Microsoft)')}</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">
                {t('privacy.collection.usage.title', 'Usage Information')}
              </h3>
              <p className="mb-4">
                {t('privacy.collection.usage.intro', 'We automatically collect information about your use of our platform:')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li>{t('privacy.collection.usage.progress', 'Course progress and completion data')}</li>
                <li>{t('privacy.collection.usage.interaction', 'Platform interactions and feature usage')}</li>
                <li>{t('privacy.collection.usage.device', 'Device information and browser type')}</li>
                <li>{t('privacy.collection.usage.ip', 'IP address and location data')}</li>
                <li>{t('privacy.collection.usage.cookies', 'Cookies and similar tracking technologies')}</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">
                {t('privacy.collection.ai.title', 'AI Interaction Data')}
              </h3>
              <p className="mb-4">
                {t('privacy.collection.ai.content', 'When you use our AI Study Buddy feature, we collect your questions and interactions to provide personalized learning assistance and improve our AI services.')}
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.use.title', '3. How We Use Your Information')}
            </h2>
            <div className="mb-6 text-gray-700 leading-relaxed">
              <p className="mb-4">
                {t('privacy.use.intro', 'We use the information we collect to:')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('privacy.use.provide', 'Provide, maintain, and improve our educational services')}</li>
                <li>{t('privacy.use.personalize', 'Personalize your learning experience and recommendations')}</li>
                <li>{t('privacy.use.process', 'Process payments and manage your subscriptions')}</li>
                <li>{t('privacy.use.communicate', 'Communicate with you about courses, updates, and support')}</li>
                <li>{t('privacy.use.analytics', 'Analyze usage patterns to improve our platform')}</li>
                <li>{t('privacy.use.ai', 'Train and improve our AI learning assistance features')}</li>
                <li>{t('privacy.use.legal', 'Comply with legal obligations and enforce our terms')}</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.sharing.title', '4. Information Sharing')}
            </h2>
            <div className="mb-6 text-gray-700 leading-relaxed">
              <p className="mb-4">
                {t('privacy.sharing.intro', 'We do not sell your personal information. We may share your information in the following circumstances:')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('privacy.sharing.consent', 'With your consent or at your direction')}</li>
                <li>{t('privacy.sharing.providers', 'With service providers who assist in platform operations')}</li>
                <li>{t('privacy.sharing.creators', 'With course creators (limited to course progress data)')}</li>
                <li>{t('privacy.sharing.legal', 'When required by law or to protect our rights')}</li>
                <li>{t('privacy.sharing.business', 'In connection with a business transfer or acquisition')}</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.third.title', '5. Third-Party Services')}
            </h2>
            <div className="mb-6 text-gray-700 leading-relaxed">
              <p className="mb-4">
                {t('privacy.third.intro', 'Our platform integrates with the following third-party services:')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Stripe:</strong> {t('privacy.third.stripe', 'Payment processing and billing')}</li>
                <li><strong>Google OAuth:</strong> {t('privacy.third.google', 'Social login authentication')}</li>
                <li><strong>GitHub OAuth:</strong> {t('privacy.third.github', 'Social login authentication')}</li>
                <li><strong>Microsoft OAuth:</strong> {t('privacy.third.microsoft', 'Social login authentication')}</li>
                <li><strong>Anthropic Claude:</strong> {t('privacy.third.claude', 'AI learning assistance')}</li>
                <li><strong>YouTube:</strong> {t('privacy.third.youtube', 'Video content hosting and playback')}</li>
                <li><strong>Cloudflare:</strong> {t('privacy.third.cloudflare', 'Content delivery and security')}</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.security.title', '6. Data Security')}
            </h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              {t('privacy.security.content', 'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, secure authentication, and regular security audits.')}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.retention.title', '7. Data Retention')}
            </h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              {t('privacy.retention.content', 'We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. Course progress data is retained indefinitely to maintain learning continuity. You may request deletion of your account and associated data at any time.')}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.rights.title', '8. Your Privacy Rights')}
            </h2>
            <div className="mb-6 text-gray-700 leading-relaxed">
              <p className="mb-4">
                {t('privacy.rights.intro', 'You have the following rights regarding your personal information:')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>{t('privacy.rights.access.title', 'Access:')}</strong> {t('privacy.rights.access.desc', 'Request a copy of your personal data')}</li>
                <li><strong>{t('privacy.rights.rectification.title', 'Rectification:')}</strong> {t('privacy.rights.rectification.desc', 'Correct inaccurate or incomplete data')}</li>
                <li><strong>{t('privacy.rights.erasure.title', 'Erasure:')}</strong> {t('privacy.rights.erasure.desc', 'Request deletion of your personal data')}</li>
                <li><strong>{t('privacy.rights.portability.title', 'Portability:')}</strong> {t('privacy.rights.portability.desc', 'Export your data in a structured format')}</li>
                <li><strong>{t('privacy.rights.objection.title', 'Objection:')}</strong> {t('privacy.rights.objection.desc', 'Object to certain processing activities')}</li>
              </ul>
              <p className="mt-4">
                {t('privacy.rights.contact', 'To exercise these rights, please contact us at info@choiceind.com.')}
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.cookies.title', '9. Cookies and Tracking')}
            </h2>
            <div className="mb-6 text-gray-700 leading-relaxed">
              <p className="mb-4">
                {t('privacy.cookies.intro', 'We use cookies and similar technologies to:')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>{t('privacy.cookies.auth', 'Authenticate users and maintain login sessions')}</li>
                <li>{t('privacy.cookies.preferences', 'Remember user preferences and settings')}</li>
                <li>{t('privacy.cookies.analytics', 'Analyze platform usage and performance')}</li>
                <li>{t('privacy.cookies.security', 'Provide security and prevent fraud')}</li>
              </ul>
              <p className="mt-4">
                {t('privacy.cookies.control', 'You can control cookies through your browser settings, but some platform features may not function properly if cookies are disabled.')}
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.children.title', '10. Children\'s Privacy')}
            </h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              {t('privacy.children.content', 'Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us, and we will take steps to remove such information.')}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.international.title', '11. International Data Transfers')}
            </h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              {t('privacy.international.content', 'Your information may be transferred to and processed in countries other than Vietnam. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.')}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.changes.title', '12. Changes to This Policy')}
            </h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              {t('privacy.changes.content', 'We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.')}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {t('privacy.contact.title', '13. Contact Us')}
            </h2>
            <div className="mb-6 text-gray-700 leading-relaxed">
              <p className="mb-4">
                {t('privacy.contact.intro', 'If you have any questions about this Privacy Policy or our data practices, please contact us:')}
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>{t('privacy.contact.email', 'Email:')}</strong> info@choiceind.com</li>
                <li><strong>{t('privacy.contact.address', 'Address:')}</strong> {t('privacy.contact.location', 'Ho Chi Minh City, Vietnam')}</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 mt-8">
              <p className="text-sm text-gray-600">
                {t('privacy.disclaimer', 'This Privacy Policy is governed by Vietnamese law. For users in the European Union, additional rights may apply under the General Data Protection Regulation (GDPR).')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}