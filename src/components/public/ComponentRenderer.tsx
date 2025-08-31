import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ComponentRendererProps {
  type: string;
  content: Record<string, any>;
  styleVariant?: string;
  carouselImages?: Array<{
    imageUrl: string;
    altText?: string | null;
    caption?: string | null;
    order: number;
  }>;
}

export function ComponentRenderer({ type, content, styleVariant, carouselImages }: ComponentRendererProps) {
  const renderComponent = () => {
    switch (type) {
      case 'HEADING':
        return <HeadingComponent content={content} styleVariant={styleVariant} />;
      case 'TEXT_BLOCK':
        return <TextBlockComponent content={content} styleVariant={styleVariant} />;
      case 'IMAGE':
        return <ImageComponent content={content} styleVariant={styleVariant} />;
      case 'IMAGE_CAROUSEL':
        return <ImageCarouselComponent content={content} styleVariant={styleVariant} images={carouselImages} />;
      case 'VIDEO_EMBED':
        return <VideoEmbedComponent content={content} styleVariant={styleVariant} />;
      case 'QUOTE_BLOCK':
        return <QuoteBlockComponent content={content} styleVariant={styleVariant} />;
      case 'CTA_BUTTON':
        return <CTAButtonComponent content={content} styleVariant={styleVariant} />;
      case 'SPACER':
        return <SpacerComponent content={content} />;
      case 'DIVIDER':
        return <DividerComponent content={content} />;
      default:
        return <div>Unknown component type: {type}</div>;
    }
  };

  return <div className="component-wrapper">{renderComponent()}</div>;
}

// Individual component implementations
function HeadingComponent({ content, styleVariant }: { content: any; styleVariant?: string }) {
  const level = content.level || 'h2';
  const text = content.text || '';
  
  const baseClasses = 'font-bold';
  const variantClasses = {
    'centered': 'text-center',
    'left-underlined': 'text-left border-b-2 border-primary pb-2',
    'uppercase': 'uppercase tracking-wider',
    'gradient': 'bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent'
  };
  
  const classes = `${baseClasses} ${styleVariant && styleVariant !== 'default' && variantClasses[styleVariant as keyof typeof variantClasses] || ''}`;
  
  const sizeClasses = {
    h1: 'text-4xl md:text-5xl lg:text-6xl',
    h2: 'text-3xl md:text-4xl lg:text-5xl',
    h3: 'text-2xl md:text-3xl lg:text-4xl',
    h4: 'text-xl md:text-2xl lg:text-3xl'
  };
  
  const Tag = level as keyof React.JSX.IntrinsicElements;
  
  return React.createElement(Tag, {
    className: `${classes} ${sizeClasses[level as keyof typeof sizeClasses] || sizeClasses.h2}`
  }, text);
}

function TextBlockComponent({ content, styleVariant }: { content: any; styleVariant?: string }) {
  const html = content.html || '';
  
  const variantClasses = {
    'large-text': 'text-lg',
    'two-columns': 'columns-1 md:columns-2 gap-8',
    'highlighted': 'bg-muted p-6 rounded-lg border-l-4 border-primary',
    'minimal': 'text-muted-foreground'
  };
  
  const classes = `prose prose-lg max-w-none ${styleVariant && styleVariant !== 'default' && variantClasses[styleVariant as keyof typeof variantClasses] || ''}`;
  
  return (
    <div 
      className={classes}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ImageComponent({ content, styleVariant }: { content: any; styleVariant?: string }) {
  const { imageUrl, altText, caption } = content;
  
  if (!imageUrl) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Image not available</p>
      </div>
    );
  }
  
  const variantClasses = {
    'rounded': 'rounded-lg overflow-hidden',
    'shadow': 'shadow-lg',
    'full-width': 'w-full',
    'centered': 'mx-auto'
  };
  
  const imageClasses = `max-w-full h-auto ${styleVariant && styleVariant !== 'default' && variantClasses[styleVariant as keyof typeof variantClasses] || ''}`;
  
  return (
    <figure className={styleVariant === 'centered' ? 'text-center' : ''}>
      <img 
        src={imageUrl} 
        alt={altText || ''} 
        className={imageClasses}
      />
      {caption && (
        <figcaption className="text-sm text-muted-foreground mt-2 text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function ImageCarouselComponent({ 
  content, 
  styleVariant, 
  images 
}: { 
  content: any; 
  styleVariant?: string; 
  images?: Array<{ imageUrl: string; altText?: string | null; caption?: string | null; order: number }>;
}) {
  if (!images || images.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No images in carousel</p>
      </div>
    );
  }
  
  const sortedImages = [...images].sort((a, b) => a.order - b.order);
  
  // Simple carousel implementation - you can enhance this with a proper carousel library
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedImages.map((image, index) => (
          <div key={index} className="relative">
            <img 
              src={image.imageUrl} 
              alt={image.altText || `Image ${index + 1}`}
              className="w-full h-64 object-cover rounded-lg"
            />
            {image.caption && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {image.caption}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoEmbedComponent({ content, styleVariant }: { content: any; styleVariant?: string }) {
  const { url, provider } = content;
  
  if (!url) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No video URL provided</p>
      </div>
    );
  }
  
  const aspectRatioClasses = {
    'square': 'aspect-square',
    'wide': 'aspect-[21/9]',
    'vertical': 'aspect-[9/16]'
  };
  
  const aspectRatio = styleVariant && aspectRatioClasses[styleVariant as keyof typeof aspectRatioClasses] || 'aspect-video';
  
  const getEmbedUrl = (url: string, provider: string) => {
    if (provider === 'youtube') {
      const videoId = url.includes('youtube.com') ? url.split('v=')[1]?.split('&')[0] : url.split('youtu.be/')[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (provider === 'vimeo') {
      const videoId = url.split('vimeo.com/')[1];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url; // Direct video URL
  };
  
  return (
    <div className={`w-full ${aspectRatio} rounded-lg overflow-hidden`}>
      <iframe
        src={getEmbedUrl(url, provider)}
        className="w-full h-full"
        allowFullScreen
        title="Embedded video"
      />
    </div>
  );
}

function QuoteBlockComponent({ content, styleVariant }: { content: any; styleVariant?: string }) {
  const { quote, author, title } = content;
  
  const variantClasses = {
    'bordered': 'border-l-4 border-primary pl-6',
    'highlighted': 'bg-muted p-6 rounded-lg',
    'minimal': 'text-muted-foreground',
    'large-quote': 'relative'
  };
  
  const classes = `${styleVariant && variantClasses[styleVariant as keyof typeof variantClasses] || 'border-l-4 border-primary pl-6'}`;
  
  return (
    <blockquote className={classes}>
      {styleVariant === 'large-quote' && (
        <span className="text-6xl text-primary/20 absolute -top-4 -left-2">"</span>
      )}
      <p className="text-lg italic mb-4">{quote}</p>
      {(author || title) && (
        <footer className="text-sm text-muted-foreground">
          — {author}{title && `, ${title}`}
        </footer>
      )}
    </blockquote>
  );
}

function CTAButtonComponent({ content }: { content: any; styleVariant?: string }) {
  const { text, url, variant, size } = content;
  
  if (!text || !url) {
    return null;
  }
  
  return (
    <div className="text-center py-4">
      <Button 
        asChild
        variant={variant || 'default'} 
        size={size || 'default'}
      >
        <a href={url} target={url.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">
          {text}
        </a>
      </Button>
    </div>
  );
}

function SpacerComponent({ content }: { content: any }) {
  const height = content.height || '2rem';
  
  return <div style={{ height }} />;
}

function DividerComponent({ content }: { content: any }) {
  const { style, width } = content;
  
  const styleClasses = {
    'solid': 'border-solid',
    'dashed': 'border-dashed',
    'dotted': 'border-dotted',
    'gradient': 'border-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent'
  };
  
  const widthClasses = {
    'full': 'w-full',
    'half': 'w-1/2 mx-auto',
    'quarter': 'w-1/4 mx-auto'
  };
  
  const baseClasses = style === 'gradient' 
    ? `${styleClasses[style as keyof typeof styleClasses]} ${widthClasses[width as keyof typeof widthClasses] || 'w-full'}`
    : `border-t ${styleClasses[style as keyof typeof styleClasses] || 'border-solid'} ${widthClasses[width as keyof typeof widthClasses] || 'w-full'}`;
  
  return <hr className={baseClasses} />;
}
