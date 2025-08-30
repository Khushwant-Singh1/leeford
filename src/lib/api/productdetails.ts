// src/lib/api/productdetails.ts
import { Product as PrismaProduct, ProductImage } from "@prisma/client";

// Define types based on the provided JSON structure
export interface Size {
  id: string;
  size: string;
  stock: number;
  colorId: string;
}

export interface Color {
  id: string;
  color: string;
  sizes: Size[];
  assets: Array<{ asset_url: string }>;
}

// Define a consistent Product type for the frontend, including relations
export interface Product extends PrismaProduct {
  images?: ProductImage[];
  colors?: Color[];
}

// Define the expected structure of the API response for getProducts
interface GetProductsResponse {
  success: boolean;
  products: Product[];
  pagination: {
    totalPages: number;
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Define the structure for the dashboard overview data
interface DashboardOverview {
    totalProducts: number;
    revenue: number;
    growth: string;
    usersCount: number;
}

const API_BASE_URL = "/api";

export const productApi = {
  /**
   * Fetches a paginated and searchable list of products from the backend.
   */
  getProducts: async (
    currentPage: number,
    itemsPerPage: number,
    debouncedSearchTerm: string
  ): Promise<GetProductsResponse> => {
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(itemsPerPage),
      search: debouncedSearchTerm,
    });

    const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Failed to fetch products");
    }
    return response.json();
  },

  /**
   * Fetches dashboard overview metrics.
   */
  getDashBoardOverview: async (): Promise<DashboardOverview> => {
    const response = await fetch(`${API_BASE_URL}/products/overview`);
    if (!response.ok) {
        throw new Error("Failed to fetch dashboard overview");
    }
    return response.json();
  },

  /**
   * Fetches a single product by its ID.
   */
  getById: async (id: string): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error(`Product with id ${id} not found`);
    }
    return response.json();
  },

  /**
   * Adds a new product using FormData.
   */
  addProduct: async (productData: FormData): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      body: productData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add product");
    }
    return response.json();
  },

  /**
   * Updates an existing product using FormData.
   */
  updateProduct: async (id: string, productData: FormData): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      body: productData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update product");
    }
    return response.json();
  },

  /**
   * Deletes a product by its ID.
   */
  deleteProduct: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete product");
    }
  },

  /**
   * Updates the status of a product.
   */
  updateStatus: async (
    id: string,
    status: "PUBLISHED" | "DRAFT" | "ARCHIVED"
  ): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error("Failed to update product status");
    }
    return response.json();
  },
};
