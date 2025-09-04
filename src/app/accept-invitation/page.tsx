'use client';

import { Suspense } from 'react';
import { AcceptInvitationForm } from '@/components/accept-invitation-form';

function AcceptInvitationPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-6"></div>
              <div className="space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        }>
          <AcceptInvitationForm />
        </Suspense>
      </div>
    </div>
  );
}

export default AcceptInvitationPage;
