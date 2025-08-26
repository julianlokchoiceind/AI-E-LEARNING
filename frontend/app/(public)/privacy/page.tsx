"use client";

export default function PrivacyPage() {

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 20, 2025
            </p>
          </div>

          {/* Privacy Content */}
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Introduction
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              AI E-Learning Platform ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our online learning platform and related services.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Information We Collect
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <h3 className="text-lg font-medium mb-3">
                Personal Information
              </h3>
              <p className="mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li>Name and email address when you create an account</li>
                <li>Profile information and preferences</li>
                <li>Payment information (processed securely by Stripe)</li>
                <li>Communication data when you contact us</li>
                <li>OAuth information from third-party providers (Google, GitHub, Microsoft)</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">
                Usage Information
              </h3>
              <p className="mb-4">
                We automatically collect information about your use of our platform:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li>Course progress and completion data</li>
                <li>Platform interactions and feature usage</li>
                <li>Device information and browser type</li>
                <li>IP address and location data</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-lg font-medium mb-3">
                AI Interaction Data
              </h3>
              <p className="mb-4">
                When you use our AI Study Buddy feature, we collect your questions and interactions to provide personalized learning assistance and improve our AI services.
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. How We Use Your Information
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve our educational services</li>
                <li>Personalize your learning experience and recommendations</li>
                <li>Process payments and manage your subscriptions</li>
                <li>Communicate with you about courses, updates, and support</li>
                <li>Analyze usage patterns to improve our platform</li>
                <li>Train and improve our AI learning assistance features</li>
                <li>Comply with legal obligations and enforce our terms</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Information Sharing
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>With your consent or at your direction</li>
                <li>With service providers who assist in platform operations</li>
                <li>With course creators (limited to course progress data)</li>
                <li>When required by law or to protect our rights</li>
                <li>In connection with a business transfer or acquisition</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Third-Party Services
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                Our platform integrates with the following third-party services:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Stripe:</strong> Payment processing and billing</li>
                <li><strong>Google OAuth:</strong> Social login authentication</li>
                <li><strong>GitHub OAuth:</strong> Social login authentication</li>
                <li><strong>Microsoft OAuth:</strong> Social login authentication</li>
                <li><strong>Anthropic Claude:</strong> AI learning assistance</li>
                <li><strong>YouTube:</strong> Video content hosting and playback</li>
                <li><strong>Cloudflare:</strong> Content delivery and security</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Data Security
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, secure authentication, and regular security audits.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Data Retention
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. Course progress data is retained indefinitely to maintain learning continuity. You may request deletion of your account and associated data at any time.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Your Privacy Rights
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Export your data in a structured format</li>
                <li><strong>Objection:</strong> Object to certain processing activities</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at info@choiceind.com.
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Cookies and Tracking
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Authenticate users and maintain login sessions</li>
                <li>Remember user preferences and settings</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide security and prevent fraud</li>
              </ul>
              <p className="mt-4">
                You can control cookies through your browser settings, but some platform features may not function properly if cookies are disabled.
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              10. Children's Privacy
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us, and we will take steps to remove such information.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              11. International Data Transfers
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than Vietnam. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards to protect your information.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              12. Changes to This Policy
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              13. Contact Us
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Email:</strong> info@choiceind.com</li>
                <li><strong>Address:</strong> Ho Chi Minh City, Vietnam</li>
              </ul>
            </div>

            <div className="bg-primary/10 rounded-lg p-6 mt-8">
              <p className="text-sm text-muted-foreground">
                This Privacy Policy is governed by Vietnamese law. For users in the European Union, additional rights may apply under the General Data Protection Regulation (GDPR).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}