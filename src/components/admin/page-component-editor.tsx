'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type PageComponentType = 
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

interface PageComponent {
  id: string;
  type: PageComponentType;
  content: Record<string, any>;
  styleVariant?: string;
  order: number;
}

interface PageComponentEditorProps {
  component: PageComponent;
  onChange: (updates: Partial<PageComponent>) => void;
}

export function PageComponentEditor({ component, onChange }: PageComponentEditorProps) {
  const updateContent = (key: string, value: any) => {
    onChange({
      content: {
        ...component.content,
        [key]: value,
      },
    });
  };

  const updateStyleVariant = (variant: string) => {
    onChange({ styleVariant: variant });
  };

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
            <Select 
              value={component.content.level || 'h2'} 
              onValueChange={(value) => updateContent('level', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h1">H1 - Main Title</SelectItem>
                <SelectItem value="h2">H2 - Section Title</SelectItem>
                <SelectItem value="h3">H3 - Subsection</SelectItem>
                <SelectItem value="h4">H4 - Minor Heading</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="heading-style">Style Variant</Label>
            <Select 
              value={component.styleVariant || 'default'} 
              onValueChange={updateStyleVariant}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="centered">Centered</SelectItem>
                <SelectItem value="left-underlined">Left with Underline</SelectItem>
                <SelectItem value="uppercase">Uppercase</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'TEXT_BLOCK':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="text-content">Text Content</Label>
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
            <Select 
              value={component.styleVariant || 'default'} 
              onValueChange={updateStyleVariant}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Single Column</SelectItem>
                <SelectItem value="two-columns">Two Columns</SelectItem>
                <SelectItem value="centered">Centered</SelectItem>
                <SelectItem value="large-text">Large Text</SelectItem>
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
              placeholder="Enter image URL or upload"
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
            <Select 
              value={component.styleVariant || 'default'} 
              onValueChange={updateStyleVariant}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="full-width">Full Width</SelectItem>
                <SelectItem value="rounded">Rounded Corners</SelectItem>
                <SelectItem value="shadow">With Shadow</SelectItem>
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
              placeholder="Enter YouTube, Vimeo, or other video URL"
            />
          </div>
          <div>
            <Label htmlFor="video-provider">Provider</Label>
            <Select 
              value={component.content.provider || 'youtube'} 
              onValueChange={(value) => updateContent('provider', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
              placeholder="Quote author"
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
              placeholder="Enter button text"
            />
          </div>
          <div>
            <Label htmlFor="button-url">Button URL</Label>
            <Input
              id="button-url"
              value={component.content.url || ''}
              onChange={(e) => updateContent('url', e.target.value)}
              placeholder="Enter destination URL"
            />
          </div>
          <div>
            <Label htmlFor="button-variant">Button Style</Label>
            <Select 
              value={component.content.variant || 'primary'} 
              onValueChange={(value) => updateContent('variant', value)}
            >
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
        </div>
      );

    case 'SPACER':
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="spacer-height">Height</Label>
            <Select 
              value={component.content.height || '2rem'} 
              onValueChange={(value) => updateContent('height', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1rem">Small (1rem)</SelectItem>
                <SelectItem value="2rem">Medium (2rem)</SelectItem>
                <SelectItem value="3rem">Large (3rem)</SelectItem>
                <SelectItem value="4rem">Extra Large (4rem)</SelectItem>
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
            <Select 
              value={component.content.style || 'solid'} 
              onValueChange={(value) => updateContent('style', value)}
            >
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
        </div>
      );

    default:
      return (
        <div className="text-sm text-muted-foreground">
          No editor available for {component.type}
        </div>
      );
  }
}
