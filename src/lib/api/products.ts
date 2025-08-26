// lib/api/products.ts
import { Product } from "@/types/product-types";
import { ProductStatus } from '@prisma/client';

export interface AddProductPayload {
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  sku: string;
  stockQuantity: number;
  lowStockThreshold?: number;
  categoryId?: string;
  isBestseller: boolean;
  isNewProduct: boolean;
  seoTitle?: string;
  seoDescription?: string;
  images: File[];
  status: ProductStatus;
}

export const productsApi = {
  addProduct: async (payload: AddProductPayload): Promise<Product> => {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach(file => formData.append('images', file));
      } else if (key === 'variants' && Array.isArray(value)) {
        formData.append('variants', JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await fetch("/api/products", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add product");
    }

    return response.json();
  },

  updateProduct: async (id: string, payload: Partial<AddProductPayload>): Promise<Product> => {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach(file => formData.append('images', file));
      } else if (key === 'variants' && Array.isArray(value)) {
        formData.append('variants', JSON.stringify(value));
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const response = await fetch(`/api/products/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update product");
    }

    return response.json();
  },
};