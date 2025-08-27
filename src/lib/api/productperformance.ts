// Define the shape of the data returned by the API
export interface ProductPerformance {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  profit: number;
}

const API_BASE_URL = "/api";

export const ProductPerformanceApi = {
  /**
   * Fetches the top-selling products.
   */
  getAll: async (): Promise<ProductPerformance[]> => {
    const response = await fetch(`${API_BASE_URL}/products/performance`);
    if (!response.ok) {
      throw new Error("Failed to fetch product performance data");
    }
    return response.json();
  },
};
  
  
