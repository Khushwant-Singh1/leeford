'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Plus, Search, Edit, Trash2, Eye, EyeOff, FileText, TrendingUp, Lock, Clock, MoreHorizontal, FileX
} from 'lucide-react';
import Link from 'next/link';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

// Type definition for a blog post, matching your API
interface BlogPost {
  id: string;
  title: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
  views: number;
  readingTime: number;
  updatedAt: string;
  isLocked: boolean;
  author: { 
    firstName: string | null; 
    lastName: string | null; 
    email: string | null; 
    id: string;
  };
  category: { 
    name: string; 
  } | null;
  lastEditedBy: { 
    firstName: string | null; 
    lastName: string | null; 
    id: string; 
  } | null;
}

// Props for the dashboard component
interface BlogDashboardProps { 
  currentUserId: string; 
  userRole: 'ADMIN' | 'EDITOR'; 
}

// A custom hook for debouncing input changes to reduce API calls
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function BlogDashboard({ currentUserId, userRole }: BlogDashboardProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalViews: 0 });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch posts and stats from your API
  const fetchPosts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter !== 'all' && { categoryId: categoryFilter }),
      });

      const response = await fetch(`/api/admin/blog/posts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setPosts(data.posts);
        setTotalPages(data.pagination.pages);
        setCurrentPage(data.pagination.page);
        // Assuming your API returns stats like this
        setStats({ 
            totalPosts: data.pagination.total, 
            publishedPosts: data.stats?.published || 0, 
            draftPosts: data.stats?.drafts || 0, 
            totalViews: data.stats?.totalViews || 0
        });
      } else {
        toast.error('Failed to fetch posts', { description: data.error });
      }
    } catch (error) {
      toast.error('An unexpected error occurred while fetching posts.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, categoryFilter]);

  // Handle deleting a post
  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to permanently delete this post?')) return;
    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Post deleted successfully.');
        fetchPosts(currentPage); // Refresh list
      } else {
        const error = await response.json();
        toast.error('Failed to delete post', { description: error.error });
      }
    } catch (error) {
      toast.error('An unexpected error occurred while deleting the post.');
    }
  };

  // Handle toggling the publish status
  const handlePublishToggle = async (post: BlogPost) => {
    try {
      const endpoint = `/api/admin/blog/posts/${post.id}/publish`;
      const method = post.status === 'PUBLISHED' ? 'DELETE' : 'POST';
      const response = await fetch(endpoint, { method });

      if (response.ok) {
        toast.success(post.status === 'PUBLISHED' ? 'Post unpublished successfully.' : 'Post published successfully.');
        fetchPosts(currentPage); // Refresh list
      } else {
        const error = await response.json();
        toast.error('Failed to update status', { description: error.error });
      }
    } catch (error) {
      toast.error('An unexpected error occurred while updating status.');
    }
  };

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchPosts(1); // Reset to page 1 when filters change
  }, [debouncedSearchTerm, statusFilter, categoryFilter]);

  // Effect to fetch data only when the page number changes
  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage]);
  
  // Effect to fetch categories on initial mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin/blog/categories');
        if (response.ok) setCategories(await response.json());
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // --- HELPER FUNCTIONS ---
  const getStatusBadge = (status: BlogPost['status']) => {
    const variants = {
      DRAFT: 'secondary',
      IN_REVIEW: 'outline',
      PUBLISHED: 'default',
      ARCHIVED: 'destructive',
    } as const;
    const variant = variants[status] || 'secondary';
    const formattedStatus = status.replace('_', ' ');
    return (
      <Badge variant={variant} className="capitalize">{formattedStatus.toLowerCase()}</Badge>
    );
  };

  const getAuthorName = (author: BlogPost['author']) => {
    return `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email || 'Unknown';
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 p-4 md:p-6 bg-gray-50/50 min-h-screen">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
            <p className="text-muted-foreground">Manage, edit, and publish your articles.</p>
          </div>
          <Link href="/admin/blog/new">
            <Button><Plus className="w-4 h-4 mr-2" />New Post</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Posts</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalPosts}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Published</CardTitle><Eye className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.publishedPosts}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Drafts</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.draftPosts}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Views</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <div className="relative flex-1 w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="PUBLISHED">Published</SelectItem></SelectContent></Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent><SelectItem value="all">All Categories</SelectItem>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Title</TableHead><TableHead>Author</TableHead><TableHead>Status</TableHead><TableHead>Category</TableHead><TableHead>Views</TableHead><TableHead>Last Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}><TableCell><Skeleton className="h-5 w-48" /></TableCell><TableCell><Skeleton className="h-5 w-24" /></TableCell><TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell><TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell><TableCell><Skeleton className="h-5 w-10" /></TableCell><TableCell><Skeleton className="h-5 w-20" /></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell></TableRow>
                    ))
                  ) : posts.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="h-48 text-center"><div className="flex flex-col items-center gap-4"><FileX className="w-12 h-12 text-muted-foreground" /><h3 className="font-semibold">No Posts Found</h3><p className="text-muted-foreground text-sm">Try adjusting your filters or create a new post.</p><Link href="/admin/blog/new"><Button size="sm"><Plus className="w-4 h-4 mr-2" />Create Post</Button></Link></div></TableCell></TableRow>
                  ) : (
                    posts.map((post) => (
                      <TableRow key={post.id} className="hover:bg-muted/50">
                        <TableCell><div className="flex items-center gap-2"><span className="font-medium">{post.title}</span>{post.isLocked && (<Tooltip><TooltipTrigger><Lock className="w-3.5 h-3.5 text-muted-foreground" /></TooltipTrigger><TooltipContent><p>Post is locked for editing</p></TooltipContent></Tooltip>)}</div><div className="text-sm text-muted-foreground">{post.readingTime} min read</div></TableCell>
                        <TableCell>{getAuthorName(post.author)}</TableCell>
                        <TableCell>{getStatusBadge(post.status)}</TableCell>
                        <TableCell>{post.category ? <Badge variant="outline">{post.category.name}</Badge> : <span className="text-xs text-muted-foreground">N/A</span>}</TableCell>
                        <TableCell>{post.views.toLocaleString()}</TableCell>
                        <TableCell>{new Date(post.updatedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right"><div className="flex items-center justify-end gap-1"><Tooltip><TooltipTrigger asChild><Link href={`/admin/blog/edit/${post.id}`}><Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button></Link></TooltipTrigger><TooltipContent><p>Edit Post</p></TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handlePublishToggle(post)}>{post.status === 'PUBLISHED' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button></TooltipTrigger><TooltipContent><p>{post.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</p></TooltipContent></Tooltip>{userRole === 'ADMIN' && (<Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(post.id)}><Trash2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Delete Post</p></TooltipContent></Tooltip>)}</div></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        {totalPages > 1 && (
            <Pagination><PaginationContent><PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.max(1, p - 1)); }} className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}/></PaginationItem><PaginationItem><span className="p-2 text-sm font-medium">Page {currentPage} of {totalPages}</span></PaginationItem><PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(p => Math.min(totalPages, p + 1)); }}  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}/></PaginationItem></PaginationContent></Pagination>
        )}
      </div>
    </TooltipProvider>
  );
}