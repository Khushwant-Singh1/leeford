'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BlogEditor } from '@/components/admin/blog-editor';
import { useToast } from '@/hooks/use-toast';

export default function NewBlogPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, tagsResponse] = await Promise.all([
          fetch('/api/admin/blog/categories'),
          fetch('/api/admin/blog/tags'),
        ]);

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }

        if (tagsResponse.ok) {
          const tagsData = await tagsResponse.json();
          setTags(tagsData);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load categories and tags',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleSave = (savedPost: any) => {
    toast({
      title: 'Success',
      description: 'Post created successfully',
    });
    router.push(`/admin/blog/edit/${savedPost.id}`);
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <BlogEditor
      categories={categories}
      tags={tags}
      onSave={handleSave}
    />
  );
}
