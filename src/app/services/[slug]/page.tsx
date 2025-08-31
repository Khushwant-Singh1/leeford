import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ComponentRenderer } from '@/components/public/ComponentRenderer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Clock, Star } from 'lucide-react';
import Link from 'next/link';

interface ServicePageProps {
  params: {
    slug: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const service = await getServiceData(params.slug);
  
  if (!service) {
    return {
      title: 'Service Not Found',
    };
  }

  return {
    title: service.name,
    description: service.description || `Learn more about ${service.name} at our spa.`,
    openGraph: {
      title: service.name,
      description: service.description || `Learn more about ${service.name} at our spa.`,
      type: 'website',
    },
  };
}

async function getServiceData(slug: string) {
  try {
    const service = await prisma.service.findUnique({
      where: { 
        slug: slug,
        isActive: true 
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        },
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            image: true
          },
          orderBy: { position: 'asc' }
        },
        components: {
          orderBy: { order: 'asc' },
          include: {
            carouselImages: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    return service;
  } catch (error) {
    console.error('Error fetching service:', error);
    return null;
  }
}

export default async function ServicePage({ params }: ServicePageProps) {
  const service = await getServiceData(params.slug);

  if (!service) {
    notFound();
  }

  // Generate breadcrumb navigation
  const breadcrumbs = [];
  if (service.parent?.parent) {
    breadcrumbs.push({
      name: service.parent.parent.name,
      href: `/services/${service.parent.parent.slug}`
    });
  }
  if (service.parent) {
    breadcrumbs.push({
      name: service.parent.name,
      href: `/services/${service.parent.slug}`
    });
  }
  breadcrumbs.push({ name: service.name, href: `/services/${service.slug}` });

  // Determine if this is a leaf service (has components) or category (has children)
  const isLeafService = service.components.length > 0;
  const hasChildren = service.children.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
            <Link href="/services" className="hover:text-foreground transition-colors">
              Services
            </Link>
            {breadcrumbs.slice(0, -1).map((crumb, index) => (
              <span key={index} className="flex items-center">
                <span className="mx-2">/</span>
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.name}
                </Link>
              </span>
            ))}
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">{service.name}</span>
          </nav>

          {/* Service Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  {service.name}
                </h1>
                {service.parent && (
                  <Badge variant="secondary" className="text-sm">
                    {service.parent.name}
                  </Badge>
                )}
              </div>
              
              {service.description && (
                <p className="text-xl text-muted-foreground max-w-3xl">
                  {service.description}
                </p>
              )}

              {isLeafService && (
                <div className="flex items-center gap-6 pt-4">
                  <Button size="lg">
                    <Calendar className="h-5 w-5 mr-2" />
                    Book Appointment
                  </Button>
                  <Button variant="outline" size="lg">
                    <Clock className="h-5 w-5 mr-2" />
                    Free Consultation
                  </Button>
                </div>
              )}
            </div>

            {service.image && (
              <div className="hidden md:block">
                <img 
                  src={service.image} 
                  alt={service.name}
                  className="w-64 h-48 object-cover rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {isLeafService ? (
          // Render dynamic components for leaf services
          <div className="max-w-4xl mx-auto space-y-12">
            {service.components.map((component) => (
              <div key={component.id} className="component-section">
                <ComponentRenderer
                  type={component.type}
                  content={component.content as Record<string, any>}
                  styleVariant={component.styleVariant || undefined}
                  carouselImages={component.carouselImages}
                />
              </div>
            ))}

            {/* Call-to-Action Section */}
            <Card className="mt-16">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">Ready to Experience {service.name}?</h3>
                <p className="text-muted-foreground mb-6">
                  Book your appointment today and let our expert team take care of you.
                </p>
                <div className="flex justify-center gap-4">
                  <Button size="lg">
                    <Calendar className="h-5 w-5 mr-2" />
                    Book Now
                  </Button>
                  <Button variant="outline" size="lg">
                    <Star className="h-5 w-5 mr-2" />
                    View Reviews
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : hasChildren ? (
          // Show sub-services for category pages
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-4">Our {service.name} Services</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose from our range of specialized treatments designed to meet your unique needs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {service.children.map((child) => (
                <Card key={child.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    {child.image && (
                      <div className="aspect-video relative overflow-hidden rounded-lg mb-4">
                        <img 
                          src={child.image} 
                          alt={child.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <h3 className="text-xl font-semibold mb-2">{child.name}</h3>
                    {child.description && (
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {child.description}
                      </p>
                    )}
                    <Button asChild className="w-full">
                      <Link href={`/services/${child.slug}`}>
                        Learn More
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Fallback for services without components or children
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4">More Information Coming Soon</h2>
            <p className="text-muted-foreground mb-8">
              We're working on adding more details about {service.name}.
            </p>
            <Button asChild>
              <Link href="/contact">
                Contact Us for Details
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Back Navigation */}
      <div className="container mx-auto px-4 pb-8">
        <Button variant="ghost" asChild>
          <Link href={service.parent ? `/services/${service.parent.slug}` : '/services'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {service.parent ? service.parent.name : 'Services'}
          </Link>
        </Button>
      </div>
    </div>
  );
}
