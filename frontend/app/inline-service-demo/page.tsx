'use client';

import React from 'react';
import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { useInlineMessage } from '@/hooks/useInlineMessage';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { InlineService } from '@/lib/inline/InlineService';

export default function InlineServiceDemoPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Multiple message locations for different sections
  const loginForm = useInlineMessage('login-form');
  const registrationForm = useInlineMessage('registration-form');
  const globalMessages = useInlineMessage('global-messages');

  const handleLoginTest = () => {
    loginForm.clear();
    
    if (!email) {
      loginForm.showError('Email is required');
      return;
    }
    
    if (!password) {
      loginForm.showError('Password is required');
      return;
    }
    
    // Simulate login success
    setTimeout(() => {
      loginForm.showSuccess('Login successful! Redirecting...');
    }, 1000);
  };

  const handleRegistrationTest = () => {
    registrationForm.showSuccess('Registration successful! Check your email for verification.');
  };

  const showGlobalInfo = () => {
    globalMessages.showInfo('This is a global information message that appears at the top of the page');
  };

  const showGlobalWarning = () => {
    globalMessages.showWarning('This is a warning message with auto-dismiss after 8 seconds');
  };

  return (
    <div className="min-h-screen bg-muted py-12">
      <Container className="max-w-4xl space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            InlineService Demo
          </h1>
          <p className="mt-2 text-muted-foreground">
            Testing the new Global Inline Message Service
          </p>
        </div>

        {/* Global Messages Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Global Messages</h2>
          {globalMessages.message && (
            <InlineMessage
              message={globalMessages.message.message}
              type={globalMessages.message.type}
              onDismiss={globalMessages.clear}
            />
          )}
          <div className="flex gap-4">
            <Button onClick={showGlobalInfo} variant="outline">
              Show Info Message
            </Button>
            <Button onClick={showGlobalWarning} variant="outline">
              Show Warning Message
            </Button>
            <Button onClick={() => InlineService.clearAll()} variant="outline">
              Clear Global Messages
            </Button>
          </div>
        </div>

        {/* Login Form Section */}
        <div className="bg-background p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-semibold">Login Form Test</h2>
          
          {loginForm.message && (
            <InlineMessage
              message={loginForm.message.message}
              type={loginForm.message.type}
              onDismiss={loginForm.clear}
            />
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex gap-4">
              <Button onClick={handleLoginTest}>
                Test Login
              </Button>
              <Button onClick={() => loginForm.showError('Invalid credentials')} variant="outline">
                Show Error
              </Button>
              <Button onClick={() => loginForm.clear()} variant="outline">
                Clear Messages
              </Button>
            </div>
          </div>
        </div>

        {/* Registration Form Section */}
        <div className="bg-background p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-semibold">Registration Form Test</h2>
          
          {registrationForm.message && (
            <InlineMessage
              message={registrationForm.message.message}
              type={registrationForm.message.type}
              onDismiss={registrationForm.clear}
            />
          )}

          <div className="flex gap-4">
            <Button onClick={handleRegistrationTest}>
              Test Registration Success
            </Button>
            <Button 
              onClick={() => registrationForm.showError('Email already exists')} 
              variant="outline"
            >
              Show Registration Error
            </Button>
            <Button onClick={() => registrationForm.clear()} variant="outline">
              Clear Messages
            </Button>
          </div>
        </div>

        {/* Message Types Demo */}
        <div className="bg-background p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-semibold">All Message Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => globalMessages.showSuccess('Success message')}
              className="bg-green-600 hover:bg-green-700"
            >
              Success
            </Button>
            <Button 
              onClick={() => globalMessages.showError('Error message')}
              className="bg-red-600 hover:bg-red-700"
            >
              Error
            </Button>
            <Button 
              onClick={() => globalMessages.showWarning('Warning message')}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Warning
            </Button>
            <Button 
              onClick={() => globalMessages.showInfo('Info message')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Info
            </Button>
          </div>
        </div>

        {/* Features Showcase */}
        <div className="bg-background p-6 rounded-lg border space-y-4">
          <h2 className="text-xl font-semibold">Features Showcase</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✅ <strong>Location-based messages:</strong> Each useInlineMessage('location') manages its own message</p>
            <p>✅ <strong>Auto-dismiss:</strong> Success messages auto-dismiss after 5s, errors after 8s</p>
            <p>✅ <strong>Manual dismiss:</strong> Click the X button to dismiss manually</p>
            <p>✅ <strong>Left border accent:</strong> Visual hierarchy with colored borders</p>
            <p>✅ <strong>Type safety:</strong> TypeScript support for message types</p>
            <p>✅ <strong>Consistent styling:</strong> Matches existing design system</p>
            <p>✅ <strong>Zero configuration:</strong> Just import and use, no providers needed</p>
          </div>
        </div>

        <div className="text-center">
          <Button onClick={() => window.history.back()} variant="outline">
            ← Back to Previous Page
          </Button>
        </div>
      </Container>
    </div>
  );
}