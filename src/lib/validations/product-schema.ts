import { z } from 'zod';

export const productSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  shortDescription: z.string().optional(),
  price: z.number().min(0, { message: 'Price must be a positive number' }),
  comparePrice: z.number().optional(),
  sku: z.string().min(1, { message: 'SKU is required' }),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']), 
  stockQuantity: z.number().min(0, { message: 'Stock quantity must be a positive number' }),
  lowStockThreshold: z.number().optional(),
  isBestSeller: z.boolean().optional(),
  isNewProduct: z.boolean().optional(),
  categoryId: z.string().optional(),
  weight: z.number().optional(),
  size: z.string().optional(),
  rating: z.number().optional(),
  taxCategoryId: z.string().optional(),
  madeOf: z.string().optional(),
  includes: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  internalNotes: z.string().optional(),
  images: z.array(z.any()).optional(), // Placeholder for file validation
});

export type ProductSchema = z.infer<typeof productSchema>;
