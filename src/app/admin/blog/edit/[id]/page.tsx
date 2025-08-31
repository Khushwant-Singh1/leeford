'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { BlogEditor } from '@/components/admin/blog-editor';
import { useToast } from '@/hooks/use-toast';

interface BlogPost {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  status: 'DRAFT' | 'PUBLISHED';
  categoryId?: string;
  tagIds: string[];
  seoTitle?: string;
  seoDescription?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

export default function EditBlogPostPage() {
  const params = useParams();
  const postId = params.id as string;
  const { toast } = useToast();
  
  const [post, setPost] = useState<BlogPost | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch post data, categories, and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postResponse, categoriesResponse, tagsResponse] = await Promise.all([
          fetch(`/api/admin/blog/posts/${postId}`),
          fetch('/api/admin/blog/categories'),
          fetch('/api/admin/blog/tags'),
        ]);

        if (postResponse.ok) {
          const postData = await postResponse.json();
          setPost({
            title: postData.title,
            content: postData.content,
            excerpt: postData.excerpt,
            featuredImage: postData.featuredImage,
            status: postData.status,
            categoryId: postData.category?.id,
            tagIds: postData.tags?.map((tag: any) => tag.id) || [],
            seoTitle: postData.seoTitle,
            seoDescription: postData.seoDescription,
          });
        } else {
          toast({
            title: 'Error',
            description: 'Post not found',
            variant: 'destructive',
          });
        }

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
          description: 'Failed to load post data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchData();
    }
  }, [postId, toast]);

  const handleSave = (savedPost: any) => {
    toast({
      title: 'Success',
      description: 'Post updated successfully',
    });
  };

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  if (!post) {
    return <div className="container mx-auto py-8">Post not found</div>;
  }

  return (
    <BlogEditor
      postId={postId}
      initialData={post}
      categories={categories}
      tags={tags}
      onSave={handleSave}
    />
  );
}
