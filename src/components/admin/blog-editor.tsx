import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import ListItem from '@tiptap/extension-list-item';
import {TextStyle} from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { useEffect, useState, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Quote, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  Eye,
  EyeOff,
  Clock,
  Users,
  Lock,
  Unlock,
  X,
  Plus,
  Tag
} from 'lucide-react';

interface BlogEditorProps {
  postId?: string;
  initialData?: {
    title: string;
    content: any;
    excerpt?: string;
    featuredImage?: string;
    status: 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
    categoryId?: string;
    tagIds?: string[];
    seoTitle?: string;
    seoDescription?: string;
  };
  categories: Array<{ id: string; name: string; slug: string }>;
  tags: Array<{ id: string; name: string; slug: string }>;
  onSave?: (data: any) => void;
  readOnly?: boolean;
}

export function BlogEditor({ 
  postId, 
  initialData, 
  categories, 
  tags, 
  onSave, 
  readOnly = false 
}: BlogEditorProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(initialData?.title || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImage || '');
  const [status, setStatus] = useState(initialData?.status || 'DRAFT');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || 'none');
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tagIds || []);
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || '');
  const [isLocked, setIsLocked] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  const [showSeoSettings, setShowSeoSettings] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        listItem: {
          HTMLAttributes: {
            class: 'my-list-item',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'my-blockquote',
          },
        },
      }),
      ListItem,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-[3px]',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your story...',
      }),
      CharacterCount,
    ],
    content: initialData?.content || '<p>Start writing your masterpiece...</p>',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      const text = editor.getText();
      const words = text.split(/\s+/).filter(word => word.length > 0).length;
      
      setWordCount(words);
      setReadingTime(Math.max(1, Math.ceil(words / 200)));
      
      if (!readOnly && postId) {
        handleAutoSave(title, content);
      }
    },
  });

  // Lock/unlock post for editing
  const handleLockToggle = useCallback(async () => {
    if (!postId) return;
    
    try {
      const endpoint = `/api/admin/blog/posts/${postId}/lock`;
      const method = isLocked ? 'DELETE' : 'POST';
      
      const response = await fetch(endpoint, { method });
      
      if (response.ok) {
        setIsLocked(!isLocked);
        toast({
          title: isLocked ? 'Post unlocked' : 'Post locked',
          description: isLocked ? 'Other users can now edit this post' : 'You now have exclusive editing access',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to change lock status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change lock status',
        variant: 'destructive',
      });
    }
  }, [postId, isLocked, toast]);

  // Auto-save functionality
  const handleAutoSave = useCallback(
    debounce(async (currentTitle: string, content: any) => {
      if (!postId || readOnly) return;
      
      try {
        await fetch(`/api/admin/blog/posts/${postId}/autosave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: currentTitle, content }),
        });
        
        setLastSaved(new Date());
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }, 2000),
    [postId, readOnly]
  );

  // Manual save
  const handleSave = async () => {
    if (!editor || readOnly) return;
    
    setIsSaving(true);
    
    try {
      const data = {
        title,
        content: editor.getJSON(),
        excerpt,
        featuredImage: featuredImage || undefined,
        status,
        categoryId: categoryId !== 'none' ? categoryId : undefined,
        tagIds: selectedTags,
        seoTitle: seoTitle || undefined,
        seoDescription: seoDescription || undefined,
      };

      let response;
      
      if (postId) {
        response = await fetch(`/api/admin/blog/posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        response = await fetch('/api/admin/blog/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (response.ok) {
        const savedPost = await response.json();
        setLastSaved(new Date());
        toast({
          title: 'Success',
          description: postId ? 'Post updated successfully' : 'Post created successfully',
        });
        
        if (onSave) {
          onSave(savedPost);
        }
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save post',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save post',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Publish/unpublish
  const handlePublishToggle = async () => {
    if (!postId) return;
    
    try {
      const endpoint = `/api/admin/blog/posts/${postId}/publish`;
      const method = status === 'PUBLISHED' ? 'DELETE' : 'POST';
      
      const response = await fetch(endpoint, { method });
      
      if (response.ok) {
        const newStatus = status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        setStatus(newStatus);
        toast({
          title: 'Success',
          description: newStatus === 'PUBLISHED' ? 'Post published successfully' : 'Post unpublished successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change publish status',
        variant: 'destructive',
      });
    }
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For now, convert to base64. In production, upload to your media service
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      editor?.chain().focus().setImage({ src: result }).run();
    };
    reader.readAsDataURL(file);
  };

  // Add link
  const handleAddLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Remove tag
  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId));
  };

  // Create new tag
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    setIsCreatingTag(true);
    try {
      const response = await fetch('/api/admin/blog/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (response.ok) {
        const newTag = await response.json();
        // Add to local tags list
        const newTags = [...tags, newTag];
        // Update the tags prop if possible (this would need to be passed from parent)
        
        // Auto-select the new tag
        setSelectedTags(prev => [...prev, newTag.id]);
        setNewTagName('');
        setShowCreateTag(false);
        
        toast({
          title: 'Success',
          description: 'Tag created successfully',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to create tag',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create tag',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingTag(false);
    }
  };

  const getSelectedTagNames = () => {
    return tags.filter(tag => selectedTags.includes(tag.id));
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">
            {postId ? 'Edit Post' : 'Create New Post'}
          </h1>
          {lastSaved && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {postId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLockToggle}
              disabled={readOnly}
            >
              {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {isLocked ? 'Unlock' : 'Lock'}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSeoSettings(!showSeoSettings)}
          >
            SEO Settings
          </Button>
          
          {postId && (
            <Button
              variant={status === 'PUBLISHED' ? 'secondary' : 'default'}
              size="sm"
              onClick={handlePublishToggle}
              disabled={readOnly}
            >
              {status === 'PUBLISHED' ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={isSaving || readOnly}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Title */}
      <Input
        placeholder="Post title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-3xl font-bold border-none px-0 py-4 h-auto"
        disabled={readOnly}
      />

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Category</label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={readOnly}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={(value: any) => setStatus(value)} disabled={readOnly}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium">Stats</label>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
            <span>{wordCount} words</span>
            <span>{readingTime} min read</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium">Tags</label>
        <div className="mt-2 space-y-3">
          {/* Selected Tags */}
          {getSelectedTagNames().length > 0 && (
            <div className="flex flex-wrap gap-2">
              {getSelectedTagNames().map(tag => (
                <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                  {tag.name}
                  {!readOnly && (
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => handleRemoveTag(tag.id)}
                    />
                  )}
                </Badge>
              ))}
            </div>
          )}
          
          {/* Tag Selection */}
          {!readOnly && (
            <div className="flex gap-2">
              <Select onValueChange={handleTagToggle}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Add existing tags..." />
                </SelectTrigger>
                <SelectContent>
                  {tags
                    .filter(tag => !selectedTags.includes(tag.id))
                    .map(tag => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <Tag className="h-3 w-3" />
                          {tag.name}
                        </div>
                      </SelectItem>
                    ))}
                  {tags.filter(tag => !selectedTags.includes(tag.id)).length === 0 && (
                    <SelectItem value="no-tags" disabled>
                      No more tags available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateTag(!showCreateTag)}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                New Tag
              </Button>
            </div>
          )}
          
          {/* Create New Tag */}
          {showCreateTag && !readOnly && (
            <div className="flex gap-2 p-3 border rounded-lg bg-muted/30">
              <Input
                placeholder="Enter tag name..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                  if (e.key === 'Escape') {
                    setShowCreateTag(false);
                    setNewTagName('');
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || isCreatingTag}
              >
                {isCreatingTag ? 'Creating...' : 'Create'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateTag(false);
                  setNewTagName('');
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center space-x-1 p-2 border rounded-lg bg-muted/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-muted' : ''}
          >
            <Bold className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-muted' : ''}
          >
            <Italic className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'bg-muted' : ''}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={editor.isActive('code') ? 'bg-muted' : ''}
          >
            <Code className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
          >
            <Heading3 className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-muted' : ''}
          >
            <List className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-muted' : ''}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-muted' : ''}
          >
            <Quote className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddLink}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Editor */}
      <div className="min-h-[400px] p-4 border rounded-lg focus-within:ring-2 focus-within:ring-ring">
        <EditorContent 
          editor={editor} 
          className="prose prose-lg max-w-none
            [&_.ProseMirror]:outline-none
            [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:mb-4
            [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:mb-3
            [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-medium [&_.ProseMirror_h3]:mb-2
            [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:my-4
            [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_ol]:my-4
            [&_.ProseMirror_li]:my-1
            [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-muted-foreground [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-4
            [&_.ProseMirror_p]:my-2
            [&_.ProseMirror_strong]:font-bold
            [&_.ProseMirror_em]:italic
            [&_.ProseMirror_code]:bg-muted [&_.ProseMirror_code]:px-1 [&_.ProseMirror_code]:rounded
            [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline
          "
        />
      </div>

      {/* Excerpt */}
      <div>
        <label className="text-sm font-medium">Excerpt</label>
        <Textarea
          placeholder="Brief description of your post..."
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className="mt-2"
          disabled={readOnly}
        />
      </div>

      {/* Featured Image */}
      <div>
        <label className="text-sm font-medium">Featured Image URL</label>
        <Input
          placeholder="https://example.com/image.jpg"
          value={featuredImage}
          onChange={(e) => setFeaturedImage(e.target.value)}
          className="mt-2"
          disabled={readOnly}
        />
        {featuredImage && (
          <img 
            src={featuredImage} 
            alt="Featured" 
            className="mt-2 max-w-xs rounded border"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>

      {/* SEO Settings */}
      {showSeoSettings && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="font-semibold">SEO Settings</h3>
          
          <div>
            <label className="text-sm font-medium">SEO Title</label>
            <Input
              placeholder="Custom title for search engines"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="mt-2"
              disabled={readOnly}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">SEO Description</label>
            <Textarea
              placeholder="Meta description for search engines"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="mt-2"
              disabled={readOnly}
            />
          </div>
        </div>
      )}
    </div>
  );
}
