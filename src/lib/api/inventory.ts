import { Varient } from "@/types/product-types";

interface InventoryOverview {
  totalProducts: number;
  lowStockItems: number;
  outOfStock: number;
  restockAlerts: number;
}

// Mock data for inventory overview
const getInventoryOverview = async (): Promise<InventoryOverview> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    totalProducts: 150,
    lowStockItems: 12,
    outOfStock: 3,
    restockAlerts: 8
  };
};

export interface InventoryItem {
  id: number;
  name: string;
  inStock: number;
  lowStockThreshold: number;
}

// Mock data for inventory items
const mockInventoryItems: InventoryItem[] = [
  { id: 1, name: "Product A", inStock: 25, lowStockThreshold: 10 },
  { id: 2, name: "Product B", inStock: 5, lowStockThreshold: 15 },
  { id: 3, name: "Product C", inStock: 0, lowStockThreshold: 20 },
  { id: 4, name: "Product D", inStock: 45, lowStockThreshold: 10 },
  { id: 5, name: "Product E", inStock: 8, lowStockThreshold: 12 }
];

const getInventory = async (currentPage: number, itemsPerPage: number, debouncedSearchTerm: string): Promise<{ products: InventoryItem[], pagination: { totalPages: number } }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Filter items based on search term
  let filteredItems = mockInventoryItems;
  if (debouncedSearchTerm) {
    filteredItems = mockInventoryItems.filter(item => 
      item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }
  
  // Paginate results
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);
  
  return {
    products: paginatedItems,
    pagination: {
      totalPages: Math.ceil(filteredItems.length / itemsPerPage)
    }
  };
};

interface Size {
  id: string;
  size: string;
  stock: number;
  colorId: string;
}

const updateStock = async (variantId: string, stock: number): Promise<Size> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Return mock updated size
  return {
    id: variantId,
    size: "M",
    stock: stock,
    colorId: "color-1"
  };
};

const addNewSize = async (colorId: string, sizes: Array<{ size: string; stock: number }>): Promise<Varient[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return mock variants (you may need to adjust this based on your Varient type)
  return [];
};

const addNewColor = async (productId: string, newColorData: {name : string,imageUrl:string, sizes: Array<{ size: string; stock: number }>}): Promise<Varient[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Return mock variants (you may need to adjust this based on your Varient type)
  return [];
};

export const inventoryApi = {
  getInventoryOverview,
  getInventory,
  updateStock,
  addNewSize,
  addNewColor,
};