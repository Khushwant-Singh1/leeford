import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BlogDashboard } from '@/components/admin/blog-dashboard';

export default async function BlogPage() {
  const session = await auth();
  
  if (!session?.user || !['ADMIN', 'EDITOR'].includes(session.user.role)) {
    redirect('/unauthorized');
  }

  return (
    <div className="container mx-auto py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <BlogDashboard 
          currentUserId={session.user.id} 
          userRole={session.user.role as 'ADMIN' | 'EDITOR'} 
        />
      </Suspense>
    </div>
  );
}
