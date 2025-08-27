import { ReactNode } from 'react';

export interface Product {
  id?: string;
  name: string;
  price: number;
  description: string;
  status: "PUBLISHED" | "DRAFT";
  discountPrice?: number;
  categoryId?: string;
  subcategoryId?: string;
  category_id?: string; // For backward compatibility
  subcategory_id?: string; // For backward compatibility
  material?: string;
  assets?: Asset[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  image?: string;
  parentId?: string; // For subcategories
  parent?: Category; // Parent category for subcategories
  subcategories?: Category[]; // Child subcategories for main categories
  products?: Product[];
  productCount?: ReactNode | number;
  _count?: {
    products: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Size {
  id?: string;
  size: string;
  stock: number;
  colorId?: string;
}

export interface Asset {
  id?: string;
  asset_url: string;
  url?: string; // For backward compatibility
  type: string;
  colorId: string | null;
  productId: string | null;
}

export interface Varient {
  id: string;
  color: string;
  productId: string;
  assets: Asset[];
  sizes: Size[];
}
