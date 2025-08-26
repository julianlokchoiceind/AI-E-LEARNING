"use client";



export default function TermsPage() {
  

  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: January 20, 2025
            </p>
          </div>

          {/* Terms Content */}
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              By accessing and using the AI E-Learning Platform ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Service Description
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              AI E-Learning Platform is an online education platform that provides video courses, AI-powered learning assistance, and interactive content for programming and artificial intelligence education. The platform offers both free and paid content, with subscription options available.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. User Accounts
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                To access certain features of our Service, you must register for an account. When you register, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security and confidentiality of your password</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Payment and Subscriptions
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                Our platform offers both free and paid content:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Free courses are available to all registered users</li>
                <li>Paid courses require individual purchase or Pro subscription</li>
                <li>Pro subscription provides unlimited access to all courses</li>
                <li>Refunds are available within 14 days of purchase for courses with less than 80% completion</li>
                <li>Subscription billing is handled by Stripe and other approved payment processors</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. Content and Intellectual Property
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                All content on the platform, including videos, text, graphics, and software, is owned by AI E-Learning Platform or its content creators. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use content for personal, non-commercial educational purposes only</li>
                <li>Not share, distribute, or republish course content</li>
                <li>Not download or attempt to download course videos without explicit permission</li>
                <li>Respect intellectual property rights of all content creators</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. User Conduct
            </h2>
            <div className="mb-6 text-muted-foreground leading-relaxed">
              <p className="mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Engage in any unlawful or fraudulent activity</li>
                <li>Abuse, harass, or threaten other users</li>
                <li>Post spam, advertisements, or irrelevant content</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </div>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. AI Services
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              Our platform uses AI technology to provide learning assistance and personalized recommendations. AI responses are generated automatically and should be used as educational guidance only. While we strive for accuracy, AI responses may contain errors and should not be considered as professional advice.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Privacy
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices regarding the collection and use of your personal information.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Termination
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and access to the Service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the Service will cease immediately.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              10. Changes to Terms
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the platform. Your continued use of the Service after such modifications constitutes acceptance of the updated terms.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mb-4">
              11. Contact Information
            </h2>
            <p className="mb-6 text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at info@choiceind.com.
            </p>

            <div className="bg-primary/10 rounded-lg p-6 mt-8">
              <p className="text-sm text-muted-foreground">
                These terms constitute the entire agreement between you and AI E-Learning Platform regarding the use of the Service. These terms are governed by Vietnamese law and any disputes will be resolved in Vietnamese courts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}