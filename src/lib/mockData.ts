import { ProductPerformanceTable } from "@/components/admin/product-performance-table";
import { ProductPerformance } from "@/lib/api/productperformance";

// Mock data for recent orders
export const mockOrders = [
  {
    id: "1",
    customer: "John Doe",
    product: "T-Shirt",
    amount: 29.99,
    status: "Delivered",
    date: "2025-08-25"
  },
  {
    id: "2",
    customer: "Jane Smith",
    product: "Jeans",
    amount: 59.99,
    status: "Shipped",
    date: "2025-08-24"
  },
  {
    id: "3",
    customer: "Mike Johnson",
    product: "Sneakers",
    amount: 89.99,
    status: "Processing",
    date: "2025-08-23"
  }
];

// Mock data for customers
export const mockCustomers = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    orders: 5,
    totalSpent: 250.50
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1987654321",
    orders: 3,
    totalSpent: 180.75
  }
];

// Mock data for product performance
export const mockProductPerformance: ProductPerformance[] = [
  {
    id: "1",
    name: "T-Shirt",
    category: "Clothing",
    sales: 45,
    revenue: 1349.55,
    profit: 400.15,
  },
  {
    id: "2",
    name: "Jeans",
    category: "Clothing",
    sales: 32,
    revenue: 1919.68,
    profit: 610.4,
  },
];

// Mock data for testimonials
export const mockTestimonials = [
  {
    id: "1",
    name: "Sarah Johnson",
    comment: "Great products and fast delivery!",
    rating: 5,
    date: "2025-08-20"
  },
  {
    id: "2",
    name: "David Wilson",
    comment: "Excellent customer service!",
    rating: 4,
    date: "2025-08-18"
  }
];

// Mock data for categories
export const mockCategories = [
  { id: "1", name: "Clothing", slug: "clothing", description: "Apparel items" },
  { id: "2", name: "Electronics", slug: "electronics", description: "Electronic devices" },
  { id: "3", name: "Home & Living", slug: "home-living", description: "Home decor and furniture" }
];

// Mock data for variants
export const mockVariants = [
  { id: "1", name: "Color", values: ["Red", "Blue", "Green"] },
  { id: "2", name: "Size", values: ["S", "M", "L", "XL"] }
];

// Mock data for contacts
export const mockContacts = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    subject: "Product Inquiry",
    message: "I would like to know more about your products.",
    updatedAt: "2025-08-25T10:30:00.000Z",
    Status: "New"
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    subject: "Order Issue",
    message: "I haven't received my order yet.",
    updatedAt: "2025-08-24T14:15:00.000Z",
    Status: "In Progress"
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    subject: "Return Request",
    message: "I would like to return a product.",
    updatedAt: "2025-08-23T09:45:00.000Z",
    Status: "Resolved"
  }
];
