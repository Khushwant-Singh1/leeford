'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Image, Video, Quote, MousePointer, Minus, MoreHorizontal } from 'lucide-react';
import { ComponentEditor, PageComponent, PageComponentType } from './ComponentEditor';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PageBuilderProps {
  components: PageComponent[];
  onComponentsChange: (components: PageComponent[]) => void;
}

export function PageBuilder({ components, onComponentsChange }: PageBuilderProps) {
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null);

  // Component type definitions with icons and descriptions
  const componentTypes: Array<{
    type: PageComponentType;
    label: string;
    description: string;
    icon: React.ReactNode;
    category: 'content' | 'media' | 'layout' | 'interactive';
  }> = [
    {
      type: 'HEADING',
      label: 'Heading',
      description: 'Add a title or section heading',
      icon: <FileText className="h-4 w-4" />,
      category: 'content'
    },
    {
      type: 'TEXT_BLOCK',
      label: 'Text Block',
      description: 'Rich text content with formatting',
      icon: <FileText className="h-4 w-4" />,
      category: 'content'
    },
    {
      type: 'IMAGE',
      label: 'Image',
      description: 'Single image with caption',
      icon: <Image className="h-4 w-4" />,
      category: 'media'
    },
    {
      type: 'IMAGE_CAROUSEL',
      label: 'Image Carousel',
      description: 'Slideshow of multiple images',
      icon: <Image className="h-4 w-4" />,
      category: 'media'
    },
    {
      type: 'VIDEO_EMBED',
      label: 'Video',
      description: 'YouTube, Vimeo, or direct video',
      icon: <Video className="h-4 w-4" />,
      category: 'media'
    },
    {
      type: 'QUOTE_BLOCK',
      label: 'Quote',
      description: 'Customer testimonial or quote',
      icon: <Quote className="h-4 w-4" />,
      category: 'content'
    },
    {
      type: 'CTA_BUTTON',
      label: 'Call-to-Action',
      description: 'Button linking to another page',
      icon: <MousePointer className="h-4 w-4" />,
      category: 'interactive'
    },
    {
      type: 'SPACER',
      label: 'Spacer',
      description: 'Add vertical spacing',
      icon: <Minus className="h-4 w-4" />,
      category: 'layout'
    },
    {
      type: 'DIVIDER',
      label: 'Divider',
      description: 'Visual separator line',
      icon: <Minus className="h-4 w-4" />,
      category: 'layout'
    }
  ];

  const getDefaultContent = (type: PageComponentType): Record<string, any> => {
    switch (type) {
      case 'HEADING':
        return { text: 'New Heading', level: 'h2' };
      case 'TEXT_BLOCK':
        return { html: '<p>Enter your text content here...</p>' };
      case 'IMAGE':
        return { imageUrl: '', altText: '', caption: '' };
      case 'VIDEO_EMBED':
        return { url: '', provider: 'youtube' };
      case 'QUOTE_BLOCK':
        return { quote: 'Enter quote text...', author: '', title: '' };
      case 'CTA_BUTTON':
        return { text: 'Click Here', url: '', variant: 'primary' };
      case 'SPACER':
        return { height: '2rem' };
      case 'DIVIDER':
        return { style: 'solid' };
      default:
        return {};
    }
  };

  const addComponent = (type: PageComponentType) => {
    const newComponent: PageComponent = {
      id: `temp-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      order: components.length,
    };
    onComponentsChange([...components, newComponent]);
  };

  const updateComponent = (id: string, updates: Partial<PageComponent>) => {
    const updatedComponents = components.map(component =>
      component.id === id ? { ...component, ...updates } : component
    );
    onComponentsChange(updatedComponents);
  };

  const removeComponent = (id: string) => {
    const filteredComponents = components.filter(component => component.id !== id);
    const reorderedComponents = filteredComponents.map((component, index) => ({
      ...component,
      order: index
    }));
    onComponentsChange(reorderedComponents);
  };

  const moveComponent = (id: string, direction: 'up' | 'down') => {
    const currentIndex = components.findIndex(c => c.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= components.length) return;

    const reorderedComponents = [...components];
    [reorderedComponents[currentIndex], reorderedComponents[newIndex]] = 
    [reorderedComponents[newIndex], reorderedComponents[currentIndex]];

    // Update order numbers
    const finalComponents = reorderedComponents.map((component, index) => ({
      ...component,
      order: index
    }));

    onComponentsChange(finalComponents);
  };

  const groupedComponents = componentTypes.reduce((acc, comp) => {
    if (!acc[comp.category]) acc[comp.category] = [];
    acc[comp.category].push(comp);
    return acc;
  }, {} as Record<string, typeof componentTypes>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Page Builder
                <Badge variant="secondary">{components.length} components</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Build your service page by adding and arranging content components
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Component
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {Object.entries(groupedComponents).map(([category, items]) => (
                  <div key={category}>
                    <DropdownMenuLabel className="capitalize">
                      {category.replace('_', ' ')} Components
                    </DropdownMenuLabel>
                    {items.map((comp) => (
                      <DropdownMenuItem
                        key={comp.type}
                        onClick={() => addComponent(comp.type)}
                        className="flex flex-col items-start p-3"
                      >
                        <div className="flex items-center gap-2 w-full">
                          {comp.icon}
                          <span className="font-medium">{comp.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {comp.description}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        {components.length > 0 && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">Tip</Badge>
                Click on any component to expand and edit its content. Use the preview button to see how it will look.
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                {components
                  .sort((a, b) => a.order - b.order)
                  .map((component) => (
                    <ComponentEditor
                      key={component.id}
                      component={component}
                      onUpdate={updateComponent}
                      onRemove={removeComponent}
                      onMoveUp={() => moveComponent(component.id, 'up')}
                      onMoveDown={() => moveComponent(component.id, 'down')}
                    />
                  ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {components.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No components yet</h3>
                <p className="text-muted-foreground">
                  Start building your service page by adding your first component above.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-md mx-auto">
                {componentTypes.slice(0, 4).map((comp) => (
                  <Button
                    key={comp.type}
                    variant="outline"
                    size="sm"
                    onClick={() => addComponent(comp.type)}
                    className="flex flex-col h-auto p-4"
                  >
                    {comp.icon}
                    <span className="text-xs mt-1">{comp.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
