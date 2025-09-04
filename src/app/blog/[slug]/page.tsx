import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { renderTiptapContent } from '@/lib/tiptap-renderer';
import { Calendar, UserCircle } from 'lucide-react';
import type { Metadata } from 'next';

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getSingleArticle(params.slug);
  if (!post) {
    return { title: 'Post Not Found' };
  }
  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
  };
}


async function getSingleArticle(slug: string) {
  const article = await prisma.blogPost.findUnique({
    where: { slug, status: 'PUBLISHED' },
    include: {
      author: true,
      category: true,
      tags: true,
    },
  });
  return article;
}

export default async function SingleArticlePage({ params }: { params: { slug: string } }) {
  const post = await getSingleArticle(params.slug);

  if (!post) {
    return notFound();
  }
  
  // Safely render the Tiptap content to HTML
  const contentHTML = renderTiptapContent(post.content);
  const authorName = `${post.author.firstName || ''} ${post.author.lastName || ''}`.trim() || 'Leeford Team';

  return (
    <article className="bg-white">
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          {/* Article Header */}
          <header className="mb-8">
            {post.category && <Badge className="mb-2">{post.category.name}</Badge>}
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
              {post.title}
            </h1>
            <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <UserCircle className="w-5 h-5" />
                <span>{authorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <span>{new Date(post.publishedAt!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage && (
            <div className="relative h-96 w-full rounded-lg overflow-hidden mb-8">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Content - Rendered from Tiptap */}
          <div
            className="prose lg:prose-xl max-w-none"
            dangerouslySetInnerHTML={{ __html: contentHTML }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <footer className="mt-12 pt-8 border-t">
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Badge key={tag.id} variant="secondary">{tag.name}</Badge>
                ))}
              </div>
            </footer>
          )}
        </div>
      </main>
    </article>
  );
}