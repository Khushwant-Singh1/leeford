import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/reset-password';

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Suspense fallback={<p>Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}