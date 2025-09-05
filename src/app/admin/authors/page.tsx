'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { SocialLinksForm, type SocialLinks } from '@/components/ui/social-links-form';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, User, ExternalLink, Twitter, Linkedin, Github, Globe, Instagram, Facebook } from 'lucide-react';

interface Author {
  id: string;
  name: string;
  bio?: string;
  profilePicture?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    instagram?: string;
    facebook?: string;
  };
}

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [newAuthor, setNewAuthor] = useState<{
    name: string;
    bio: string;
    profilePicture: string;
    socialLinks: SocialLinks;
  }>({
    name: '',
    bio: '',
    profilePicture: '',
    socialLinks: {}
  });
  const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchAuthors = async () => {
    try {
      const response = await fetch('/api/admin/authors');
      if (response.ok) {
        const data = await response.json();
        setAuthors(data);
      } else {
        toast({ 
          title: 'Error', 
          description: 'Failed to fetch authors', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to fetch authors', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAuthor = async () => {
    if (!newAuthor.name.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Author name is required', 
        variant: 'destructive' 
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newAuthor.name.trim(),
          bio: newAuthor.bio.trim() || undefined,
          profilePicture: newAuthor.profilePicture.trim() || undefined,
          socialLinks: newAuthor.socialLinks
        }),
      });

      if (response.ok) {
        const createdAuthor = await response.json();
        toast({ title: 'Success', description: 'Author created successfully' });
        setNewAuthor({ 
          name: '', 
          bio: '', 
          profilePicture: '', 
          socialLinks: {
            twitter: '',
            linkedin: '',
            github: '',
            website: '',
            instagram: '',
            facebook: '',
          }
        });
        setAuthors(prev => [...prev, createdAuthor]);
      } else {
        const error = await response.json();
        toast({ 
          title: 'Error', 
          description: error.message || 'Failed to create author', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Failed to create author:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to create author', 
        variant: 'destructive' 
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateAuthor = async () => {
    if (!editingAuthor || !editingAuthor.name.trim()) {
      toast({ 
        title: 'Error', 
        description: 'Author name is required', 
        variant: 'destructive' 
      });
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/authors/${editingAuthor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingAuthor.name.trim(),
          bio: editingAuthor.bio?.trim() || undefined,
          profilePicture: editingAuthor.profilePicture?.trim() || undefined,
          socialLinks: editingAuthor.socialLinks || {}
        }),
      });

      if (response.ok) {
        const updatedAuthor = await response.json();
        toast({ title: 'Success', description: 'Author updated successfully' });
        setAuthors(prev => prev.map(author => 
          author.id === updatedAuthor.id ? updatedAuthor : author
        ));
        setEditingAuthor(null);
      } else {
        const error = await response.json();
        toast({ 
          title: 'Error', 
          description: error.message || 'Failed to update author', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Failed to update author:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to update author', 
        variant: 'destructive' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteAuthor = async (authorId: string) => {
    if (!confirm('Are you sure you want to delete this author?')) return;

    try {
      const response = await fetch(`/api/admin/authors/${authorId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Author deleted successfully' });
        setAuthors(prev => prev.filter(author => author.id !== authorId));
      } else {
        const error = await response.json();
        toast({ 
          title: 'Error', 
          description: error.message || 'Failed to delete author', 
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Failed to delete author:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to delete author', 
        variant: 'destructive' 
      });
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading authors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <User className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Manage Authors</h1>
      </div>
      
      {/* Create New Author */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Author
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <Input
                placeholder="Author name *"
                value={newAuthor.name}
                onChange={(e) => setNewAuthor(prev => ({ ...prev, name: e.target.value }))}
              />
              
              <Textarea
                placeholder="Author bio"
                value={newAuthor.bio}
                onChange={(e) => setNewAuthor(prev => ({ ...prev, bio: e.target.value }))}
                className="min-h-[100px]"
              />
            </div>
            
            {/* Right Column - Profile Picture */}
            <div>
              <label className="text-sm font-medium mb-2 block">Profile Picture</label>
              <ImageUpload
                key={`new-${newAuthor.name}-${newAuthor.profilePicture}`}
                onUpload={(url) => setNewAuthor(prev => ({ ...prev, profilePicture: url }))}
                folder="authors"
                currentImageUrl={newAuthor.profilePicture}
                className="max-w-sm"
              />
            </div>
          </div>
          
          {/* Social Links */}
          <SocialLinksForm
            socialLinks={newAuthor.socialLinks}
            onChange={(socialLinks) => setNewAuthor(prev => ({ ...prev, socialLinks }))}
            disabled={isCreating}
          />
          
          <Button 
            onClick={createAuthor} 
            disabled={!newAuthor.name.trim() || isCreating}
            className="w-full md:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Author'}
          </Button>
        </CardContent>
      </Card>

      {/* Authors List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Authors ({authors.length})</h2>
        
        {authors.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No authors yet</h3>
              <p className="text-muted-foreground">Create your first author to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {authors.map((author) => (
              <Card key={author.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {author.profilePicture ? (
                        <img
                          src={author.profilePicture}
                          alt={author.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{author.name}</h3>
                        {author.bio && (
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            {author.bio}
                          </p>
                        )}
                        
                        {/* Social Links */}
                        {author.socialLinks && Object.values(author.socialLinks).some(link => link) && (
                          <div className="flex gap-2 mt-3">
                            {author.socialLinks.twitter && (
                              <a 
                                href={`https://twitter.com/${author.socialLinks.twitter}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 transition-colors"
                              >
                                <Twitter className="w-4 h-4" />
                              </a>
                            )}
                            {author.socialLinks.linkedin && (
                              <a 
                                href={`https://linkedin.com/in/${author.socialLinks.linkedin}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Linkedin className="w-4 h-4" />
                              </a>
                            )}
                            {author.socialLinks.github && (
                              <a 
                                href={`https://github.com/${author.socialLinks.github}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-700 hover:text-gray-900 transition-colors"
                              >
                                <Github className="w-4 h-4" />
                              </a>
                            )}
                            {author.socialLinks.website && (
                              <a 
                                href={author.socialLinks.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:text-green-800 transition-colors"
                              >
                                <Globe className="w-4 h-4" />
                              </a>
                            )}
                            {author.socialLinks.instagram && (
                              <a 
                                href={`https://instagram.com/${author.socialLinks.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-pink-500 hover:text-pink-700 transition-colors"
                              >
                                <Instagram className="w-4 h-4" />
                              </a>
                            )}
                            {author.socialLinks.facebook && (
                              <a 
                                href={`https://facebook.com/${author.socialLinks.facebook}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Facebook className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-2">ID: {author.id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditingAuthor(author)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteAuthor(author.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Author Modal */}
      {editingAuthor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Author: {editingAuthor.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <Input
                    placeholder="Author name *"
                    value={editingAuthor.name}
                    onChange={(e) => setEditingAuthor(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                  
                  <Textarea
                    placeholder="Author bio"
                    value={editingAuthor.bio || ''}
                    onChange={(e) => setEditingAuthor(prev => prev ? { ...prev, bio: e.target.value } : null)}
                    className="min-h-[100px]"
                  />
                </div>
                
                {/* Right Column - Profile Picture */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Profile Picture</label>
                  <ImageUpload
                    key={`edit-${editingAuthor.id}-${editingAuthor.profilePicture}`}
                    onUpload={(url) => setEditingAuthor(prev => prev ? { ...prev, profilePicture: url } : null)}
                    folder="authors"
                    currentImageUrl={editingAuthor.profilePicture}
                    className="max-w-sm"
                  />
                </div>
              </div>
              
              {/* Social Links */}
              <SocialLinksForm
                socialLinks={editingAuthor.socialLinks || {}}
                onChange={(socialLinks) => setEditingAuthor(prev => prev ? { ...prev, socialLinks } : null)}
                disabled={isUpdating}
              />
              
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline"
                  onClick={() => setEditingAuthor(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={updateAuthor} 
                  disabled={!editingAuthor.name.trim() || isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Update Author'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
