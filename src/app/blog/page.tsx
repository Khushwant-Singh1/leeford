import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { Badge } from '@/components/ui/badge';

// Define the type for our article data
type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  publishedAt: Date | null;
  category: { name: string } | null;
  author: {
    firstName: string | null;
    lastName: string | null;
  };
};

// Server-side function to fetch published articles
async function getPublishedArticles(): Promise<Article[]> {
  const articles = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      featuredImage: true,
      publishedAt: true,
      category: { select: { name: true } },
      author: { select: { firstName: true, lastName: true } },
    },
    orderBy: {
      publishedAt: 'desc', // Show the newest posts first
    },
  });
  return articles;
}

export default async function BlogPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="bg-white min-h-screen">
      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Blog Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">The Leeford Blog</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-500">
            Insights, articles, and updates from our team of experts.
          </p>
        </header>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <Link href={`/blog/${article.slug}`} key={article.id} className="group block">
                <Card article={article} />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-700">No Articles Yet</h2>
            <p className="mt-2 text-gray-500">Check back soon for new content!</p>
          </div>
        )}
      </main>
    </div>
  );
}

// A reusable Card component for consistent styling
function Card({ article }: { article: Article }) {
  const authorName = `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim() || 'Leeford Team';

  return (
    <article className="overflow-hidden rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 bg-white h-full flex flex-col">
      {article.featuredImage && (
        <div className="relative h-56 w-full">
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-grow">
        {article.category && <Badge variant="outline" className="mb-2 w-fit">{article.category.name}</Badge>}
        <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300">
          {article.title}
        </h3>
        <p className="mt-2 text-gray-600 text-sm line-clamp-3 flex-grow">
          {article.excerpt}
        </p>
        <footer className="mt-4 pt-4 border-t border-gray-100 flex items-center text-xs text-gray-500">
          <span>By {authorName}</span>
          <span className="mx-2">•</span>
          <span>{new Date(article.publishedAt!).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </footer>
      </div>
    </article>
  );
}