import { Products } from "@/components/admin/products-table";
import { Product } from "@/types/product-types";

// Mock products data
const mockProducts: Products[] = [
  {
    id: "1",
    title: "Premium T-Shirt",
    sku: "TSHIRT-001",
    price: 29.99,
    stockQuantity: 150,
    status: "PUBLISHED",
    createdAt: new Date("2024-01-15").toISOString(),
  },
  {
    id: "2",
    title: "Cotton Hoodie",
    sku: "HOODIE-002",
    price: 59.99,
    stockQuantity: 75,
    status: "PUBLISHED",
    createdAt: new Date("2024-02-10").toISOString(),
  },
  {
    id: "3",
    title: "Denim Jeans",
    sku: "JEANS-003",
    price: 89.99,
    stockQuantity: 30,
    status: "DRAFT",
    createdAt: new Date("2024-03-05").toISOString(),
  },
];

export const productApi = {
  getAll: async (): Promise<Products[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    return mockProducts;
  },
  
  getProducts: async (
    currentPage: number,
    itemsPerPage: number,
    debouncedSearchTerm: string,
    status?: string
  ): Promise<{
    success: boolean,
    products: Products[];
    pagination: {
      totalPages: number;
      currentPage: number;
      totalItems: number;
      itemsPerPage: number;
    };
  }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Filter products based on search term and status
    let filteredProducts = mockProducts;
    
    if (debouncedSearchTerm) {
      filteredProducts = filteredProducts.filter(product =>
        product.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
    if (status) {
      filteredProducts = filteredProducts.filter(product => product.status === status);
    }
    
    // Paginate results
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    return {
      success: true,
      products: paginatedProducts,
      pagination: {
        totalPages: Math.ceil(filteredProducts.length / itemsPerPage),
        currentPage,
        totalItems: filteredProducts.length,
        itemsPerPage,
      }
    };
  },
  
  getById: async (id: string): Promise<Products> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const product = mockProducts.find(p => p.id === id);
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }
    return product;
  },
  
  addProduct: async (product: Product): Promise<Products> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newProduct: Products = {
      id: String(mockProducts.length + 1),
      title: product.title,
      sku: product.sku,
      price: product.price,
      stockQuantity: product.stockQuantity || 0,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
    };
    
    mockProducts.push(newProduct);
    return newProduct;
  },
  
  updateProduct: async (id: string, product: Product): Promise<Products> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Product with id ${id} not found`);
    }
    
    const updatedProduct: Products = {
      ...mockProducts[index],
      title: product.title,
      sku: product.sku,
      price: product.price,
      stockQuantity: product.stockQuantity || mockProducts[index].stockQuantity,
    };
    
    mockProducts[index] = updatedProduct;
    return updatedProduct;
  },
  
  deleteProduct: async (id: string): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProducts.splice(index, 1);
    }
  },
  
  updateStatus: async (id: string, status: string): Promise<Products> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Product with id ${id} not found`);
    }
    
    mockProducts[index] = {
      ...mockProducts[index],
      status: status as any
    };
    
    return mockProducts[index];
  },
  
  getDashBoardOverview: async (): Promise<{
    totalProducts: number;
    revenue: number,
    growth: string,
    usersCount: number
  }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      totalProducts: mockProducts.length,
      revenue: 25000,
      growth: "+12.5%",
      usersCount: 1250
    };
  }
};
