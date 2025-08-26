import React from 'react';
import Link from 'next/link';
import { BookOpen, BarChart, Home } from 'lucide-react';

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-background border-r">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">Creator Portal</h2>
          
          <nav className="space-y-2">
            <Link href="/creator">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </div>
            </Link>
            
            <Link href="/creator/courses">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                <BookOpen className="w-5 h-5" />
                <span>My Courses</span>
              </div>
            </Link>
            
            <Link href="/creator/analytics">
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                <BarChart className="w-5 h-5" />
                <span>Analytics</span>
              </div>
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}