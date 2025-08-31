'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, GripVertical, Edit3, Eye, Plus, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export type PageComponentType = 
  | 'HEADING' 
  | 'TEXT_BLOCK' 
  | 'IMAGE' 
  | 'IMAGE_CAROUSEL' 
  | 'VIDEO_EMBED' 
  | 'REVIEW_CARD' 
  | 'ARTICLE_GRID'
  | 'QUOTE_BLOCK'
  | 'CTA_BUTTON'
  | 'SPACER'
  | 'DIVIDER';

export interface CarouselImage {
  id?: string;
  imageUrl: string;
  altText?: string;
  caption?: string;
  order: number;
}

export interface PageComponent {
  id: string;
  type: PageComponentType;
  content: Record<string, any>;
  styleVariant?: string;
  order: number;
  carouselImages?: CarouselImage[];
}

interface ComponentEditorProps {
  component: PageComponent;
  onUpdate: (id: string, updates: Partial<PageComponent>) => void;
  onRemove: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
}

export function ComponentEditor({ 
  component, 
  onUpdate, 
  onRemove, 
  onMoveUp, 
  onMoveDown 
}: ComponentEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  const updateContent = (key: string, value: any) => {
    onUpdate(component.id, {
      content: { ...component.content, [key]: value }
    });
  };

  const updateStyleVariant = (variant: string) => {
    onUpdate(component.id, { styleVariant: variant });
  };

  const addCarouselImage = () => {
    const newImage: CarouselImage = {
      id: `temp-${Date.now()}`,
      imageUrl: '',
      altText: '',
      caption: '',
      order: (component.carouselImages?.length || 0)
    };
    
    onUpdate(component.id, {
      carouselImages: [...(component.carouselImages || []), newImage]
    });
  };

  const updateCarouselImage = (imageId: string, updates: Partial<CarouselImage>) => {
    const updatedImages = (component.carouselImages || []).map(img =>
      img.id === imageId ? { ...img, ...updates } : img
    );
    onUpdate(component.id, { carouselImages: updatedImages });
  };

  const removeCarouselImage = (imageId: string) => {
    const filteredImages = (component.carouselImages || []).filter(img => img.id !== imageId);
    const reorderedImages = filteredImages.map((img, index) => ({ ...img, order: index }));
    onUpdate(component.id, { carouselImages: reorderedImages });
  };

  const getComponentIcon = (type: PageComponentType) => {
    switch (type) {
      case 'HEADING': return '📝';
      case 'TEXT_BLOCK': return '📄';
      case 'IMAGE': return '🖼️';
      case 'IMAGE_CAROUSEL': return '🎠';
      case 'VIDEO_EMBED': return '🎥';
      case 'QUOTE_BLOCK': return '💬';
      case 'CTA_BUTTON': return '🔘';
      case 'SPACER': return '↔️';
      case 'DIVIDER': return '➖';
      default: return '📦';
    }
  };

  const getComponentPreview = () => {
    switch (component.type) {
      case 'HEADING':
        return component.content.text || 'Untitled Heading';
      case 'TEXT_BLOCK':
        return component.content.html?.replace(/<[^>]*>/g, '').substring(0, 50) + '...' || 'Text content';
      case 'IMAGE':
        return component.content.altText || component.content.caption || 'Image';
      case 'IMAGE_CAROUSEL':
        return `Carousel (${component.carouselImages?.length || 0} images)`;
      case 'VIDEO_EMBED':
        return component.content.url || 'Video embed';
      case 'QUOTE_BLOCK':
        return component.content.quote || 'Quote text';
      case 'CTA_BUTTON':
        return component.content.text || 'Button text';
      case 'SPACER':
        return `Spacer (${component.content.height || '2rem'})`;
      case 'DIVIDER':
        return `Divider (${component.content.style || 'solid'})`;
      default:
        return component.type;
    }
  };

  const renderComponentEditor = () => {
    switch (component.type) {
      case 'HEADING':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="heading-text">Heading Text</Label>
              <Input
                id="heading-text"
                value={component.content.text || ''}
                onChange={(e) => updateContent('text', e.target.value)}
                placeholder="Enter heading text"
              />
            </div>
            <div>
              <Label htmlFor="heading-level">Heading Level</Label>
              <Select onValueChange={(value) => updateContent('level', value)} value={component.content.level || 'h2'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="h1">H1 - Main Title</SelectItem>
                  <SelectItem value="h2">H2 - Section Title</SelectItem>
                  <SelectItem value="h3">H3 - Subsection</SelectItem>
                  <SelectItem value="h4">H4 - Small Heading</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="heading-style">Style Variant</Label>
              <Select onValueChange={updateStyleVariant} value={component.styleVariant || 'default'}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="centered">Centered</SelectItem>
                  <SelectItem value="left-underlined">Left with Underline</SelectItem>
                  <SelectItem value="uppercase">Uppercase</SelectItem>
                  <SelectItem value="gradient">Gradient Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'TEXT_BLOCK':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-content">Content</Label>
              <Textarea
                id="text-content"
                value={component.content.html || ''}
                onChange={(e) => updateContent('html', e.target.value)}
                placeholder="Enter your text content (HTML supported)"
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="text-style">Style Variant</Label>
              <Select onValueChange={updateStyleVariant} value={component.styleVariant || 'default'}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="large-text">Large Text</SelectItem>
                  <SelectItem value="two-columns">Two Columns</SelectItem>
                  <SelectItem value="highlighted">Highlighted Box</SelectItem>
                  <SelectItem value="minimal">Minimal Style</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'IMAGE':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={component.content.imageUrl || ''}
                onChange={(e) => updateContent('imageUrl', e.target.value)}
                placeholder="Enter image URL"
              />
            </div>
            <div>
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input
                id="image-alt"
                value={component.content.altText || ''}
                onChange={(e) => updateContent('altText', e.target.value)}
                placeholder="Describe the image for accessibility"
              />
            </div>
            <div>
              <Label htmlFor="image-caption">Caption (Optional)</Label>
              <Input
                id="image-caption"
                value={component.content.caption || ''}
                onChange={(e) => updateContent('caption', e.target.value)}
                placeholder="Image caption"
              />
            </div>
            <div>
              <Label htmlFor="image-style">Style Variant</Label>
              <Select onValueChange={updateStyleVariant} value={component.styleVariant || 'default'}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="rounded">Rounded Corners</SelectItem>
                  <SelectItem value="shadow">With Shadow</SelectItem>
                  <SelectItem value="full-width">Full Width</SelectItem>
                  <SelectItem value="centered">Centered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'IMAGE_CAROUSEL':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Carousel Images</Label>
              <Button size="sm" onClick={addCarouselImage}>
                <Plus className="h-4 w-4 mr-1" />
                Add Image
              </Button>
            </div>
            
            <div className="space-y-3">
              {component.carouselImages?.map((image, index) => (
                <Card key={image.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Image {index + 1}</Badge>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeCarouselImage(image.id!)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input
                        value={image.imageUrl}
                        onChange={(e) => updateCarouselImage(image.id!, { imageUrl: e.target.value })}
                        placeholder="Enter image URL"
                      />
                    </div>
                    <div>
                      <Label>Alt Text</Label>
                      <Input
                        value={image.altText || ''}
                        onChange={(e) => updateCarouselImage(image.id!, { altText: e.target.value })}
                        placeholder="Describe the image"
                      />
                    </div>
                    <div>
                      <Label>Caption (Optional)</Label>
                      <Input
                        value={image.caption || ''}
                        onChange={(e) => updateCarouselImage(image.id!, { caption: e.target.value })}
                        placeholder="Image caption"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div>
              <Label htmlFor="carousel-style">Carousel Style</Label>
              <Select onValueChange={updateStyleVariant} value={component.styleVariant || 'default'}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="dots">With Dots</SelectItem>
                  <SelectItem value="arrows">With Arrows</SelectItem>
                  <SelectItem value="thumbnails">With Thumbnails</SelectItem>
                  <SelectItem value="fade">Fade Transition</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'VIDEO_EMBED':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="video-url">Video URL</Label>
              <Input
                id="video-url"
                value={component.content.url || ''}
                onChange={(e) => updateContent('url', e.target.value)}
                placeholder="YouTube, Vimeo, or direct video URL"
              />
            </div>
            <div>
              <Label htmlFor="video-provider">Provider</Label>
              <Select onValueChange={(value) => updateContent('provider', value)} value={component.content.provider || 'youtube'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                  <SelectItem value="direct">Direct Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="video-style">Style Variant</Label>
              <Select onValueChange={updateStyleVariant} value={component.styleVariant || 'default'}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (16:9)</SelectItem>
                  <SelectItem value="square">Square (1:1)</SelectItem>
                  <SelectItem value="wide">Wide (21:9)</SelectItem>
                  <SelectItem value="vertical">Vertical (9:16)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'QUOTE_BLOCK':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="quote-text">Quote Text</Label>
              <Textarea
                id="quote-text"
                value={component.content.quote || ''}
                onChange={(e) => updateContent('quote', e.target.value)}
                placeholder="Enter the quote text"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="quote-author">Author</Label>
              <Input
                id="quote-author"
                value={component.content.author || ''}
                onChange={(e) => updateContent('author', e.target.value)}
                placeholder="Quote author name"
              />
            </div>
            <div>
              <Label htmlFor="quote-title">Author Title (Optional)</Label>
              <Input
                id="quote-title"
                value={component.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                placeholder="Author's title or position"
              />
            </div>
            <div>
              <Label htmlFor="quote-style">Style Variant</Label>
              <Select onValueChange={updateStyleVariant} value={component.styleVariant || 'default'}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="bordered">With Border</SelectItem>
                  <SelectItem value="highlighted">Highlighted Background</SelectItem>
                  <SelectItem value="minimal">Minimal Style</SelectItem>
                  <SelectItem value="large-quote">Large Quote Marks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'CTA_BUTTON':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                value={component.content.text || ''}
                onChange={(e) => updateContent('text', e.target.value)}
                placeholder="Button text"
              />
            </div>
            <div>
              <Label htmlFor="button-url">Link URL</Label>
              <Input
                id="button-url"
                value={component.content.url || ''}
                onChange={(e) => updateContent('url', e.target.value)}
                placeholder="Where should this button link to?"
              />
            </div>
            <div>
              <Label htmlFor="button-variant">Button Style</Label>
              <Select onValueChange={(value) => updateContent('variant', value)} value={component.content.variant || 'primary'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="outline">Outline</SelectItem>
                  <SelectItem value="ghost">Ghost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="button-size">Size</Label>
              <Select onValueChange={(value) => updateContent('size', value)} value={component.content.size || 'default'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'SPACER':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="spacer-height">Height</Label>
              <Select onValueChange={(value) => updateContent('height', value)} value={component.content.height || '2rem'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1rem">Small (1rem)</SelectItem>
                  <SelectItem value="2rem">Medium (2rem)</SelectItem>
                  <SelectItem value="3rem">Large (3rem)</SelectItem>
                  <SelectItem value="4rem">Extra Large (4rem)</SelectItem>
                  <SelectItem value="6rem">Huge (6rem)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'DIVIDER':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="divider-style">Divider Style</Label>
              <Select onValueChange={(value) => updateContent('style', value)} value={component.content.style || 'solid'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid Line</SelectItem>
                  <SelectItem value="dashed">Dashed Line</SelectItem>
                  <SelectItem value="dotted">Dotted Line</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="divider-width">Width</Label>
              <Select onValueChange={(value) => updateContent('width', value)} value={component.content.width || 'full'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Width</SelectItem>
                  <SelectItem value="half">Half Width</SelectItem>
                  <SelectItem value="quarter">Quarter Width</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return <div>Editor not implemented for {component.type}</div>;
    }
  };

  const renderComponentPreview = () => {
    switch (component.type) {
      case 'HEADING':
        const HeadingTag = component.content.level || 'h2';
        return React.createElement(HeadingTag, {
          className: `font-bold ${component.styleVariant === 'centered' ? 'text-center' : ''}`
        }, component.content.text || 'Untitled Heading');

      case 'TEXT_BLOCK':
        return (
          <div 
            className={`prose ${component.styleVariant === 'two-columns' ? 'columns-2' : ''}`}
            dangerouslySetInnerHTML={{ __html: component.content.html || '<p>Text content</p>' }}
          />
        );

      case 'IMAGE':
        return component.content.imageUrl ? (
          <div className="text-center">
            <img 
              src={component.content.imageUrl} 
              alt={component.content.altText || ''}
              className={`max-w-full h-auto ${component.styleVariant === 'rounded' ? 'rounded-lg' : ''}`}
            />
            {component.content.caption && (
              <p className="text-sm text-muted-foreground mt-2">{component.content.caption}</p>
            )}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 p-8 text-center">
            <p className="text-muted-foreground">No image URL provided</p>
          </div>
        );

      case 'QUOTE_BLOCK':
        return (
          <blockquote className="border-l-4 border-primary pl-4 italic">
            <p>"{component.content.quote || 'Quote text'}"</p>
            {component.content.author && (
              <footer className="text-sm text-muted-foreground mt-2">
                — {component.content.author}
                {component.content.title && `, ${component.content.title}`}
              </footer>
            )}
          </blockquote>
        );

      case 'CTA_BUTTON':
        return (
          <div className="text-center">
            <Button variant={component.content.variant || 'default'} size={component.content.size || 'default'}>
              {component.content.text || 'Click Here'}
            </Button>
          </div>
        );

      default:
        return <div className="p-4 bg-muted rounded">{getComponentPreview()}</div>;
    }
  };

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg">{getComponentIcon(component.type)}</span>
                </div>
                <div>
                  <CardTitle className="text-base">{component.type.replace('_', ' ')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{getComponentPreview()}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline">#{component.order + 1}</Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPreview(!isPreview);
                  }}
                >
                  {isPreview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(component.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {isPreview ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Preview</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPreview(false)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <div className="border rounded-lg p-4 bg-background">
                  {renderComponentPreview()}
                </div>
              </div>
            ) : (
              renderComponentEditor()
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
