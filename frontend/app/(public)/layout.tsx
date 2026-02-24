'use client'

import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeaderTransparencyProvider } from '@/lib/hooks/useHeaderTransparency';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <HeaderTransparencyProvider>
      <div className="flex min-h-screen flex-col bg-mesh-gradient">
        <Header />
        <main className="flex-1 pt-20">
          {children}
        </main>
        <Footer />
      </div>
    </HeaderTransparencyProvider>
  );
}
