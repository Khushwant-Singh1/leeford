import { Testimonial } from "@/components/admin/testimonials-manager";

// Mock data for testimonials
let mockTestimonials: Testimonial[] = [
  {
    id: '1',
    username: 'John Doe',
    role: 'CEO',
    description: 'Great service and amazing products!',
    ratings: 5,
    date: new Date().toISOString(),
    image: '/placeholder-avatar.jpg'
  },
  {
    id: '2',
    username: 'Jane Smith',
    role: 'Marketing Director',
    description: 'Highly recommended for all your needs.',
    ratings: 4,
    date: new Date(Date.now() - 86400000).toISOString(),
    image: '/placeholder-avatar.jpg'
  }
];

export const testimonialApi = {
  getAll: async (): Promise<Testimonial[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...mockTestimonials];
  },
  
  getById: async (id: string): Promise<Testimonial> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const testimonial = mockTestimonials.find(t => t.id === id);
    if (!testimonial) throw new Error('Testimonial not found');
    return { ...testimonial };
  },
  
  create: async (testimonial: Omit<Testimonial, "id" | "date">): Promise<Testimonial> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newTestimonial: Testimonial = {
      ...testimonial,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString()
    };
    mockTestimonials = [...mockTestimonials, newTestimonial];
    return newTestimonial;
  },
  
  update: async (id: string, updates: Partial<Testimonial>): Promise<Testimonial> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    mockTestimonials = mockTestimonials.map(t => 
      t.id === id ? { ...t, ...updates, id } : t
    );
    const updated = mockTestimonials.find(t => t.id === id);
    if (!updated) throw new Error('Testimonial not found');
    return { ...updated };
  },
  
  delete: async (id: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    mockTestimonials = mockTestimonials.filter(t => t.id !== id);
  }
};