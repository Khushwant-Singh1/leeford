"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown } from "lucide-react";
import { ProductPerformanceApi, ProductPerformance } from "@/lib/api/productperformance";

export function TopSellingProducts() {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Pick<ProductPerformance, 'name' | 'sales' | 'revenue'>; direction: "ascending" | "descending" } | null>(null);

  // Fetch products using React Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ["topSellingProducts"],
    queryFn: async () => {
      try {
        const data = await ProductPerformanceApi.getAll();
        console.log("Fetched products:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
  });

  const products = Array.isArray(data) ? data : [];

  // Sorting logic
  const sortedProducts = [...products].sort((a, b) => {
    if (!sortConfig) return 0;
    const key = sortConfig.key;
    
    // Handle string and number sorting
    if (typeof a[key] === 'string' && typeof b[key] === 'string') {
        return sortConfig.direction === 'ascending' 
            ? (a[key] as string).localeCompare(b[key] as string) 
            : (b[key] as string).localeCompare(a[key] as string);
    }
    
    const aValue = (a[key] as number) ?? 0;
    const bValue = (b[key] as number) ?? 0;

    if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
    return 0;
  });

  // Sorting handler
  const requestSort = (key: 'name' | 'sales' | 'revenue') => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[
              { label: "Name", key: "name" },
              { label: "Sales", key: "sales" },
              { label: "Revenue", key: "revenue" },
            ].map(({ label, key }) => (
              <th
                key={key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort(key as 'name' | 'sales' | 'revenue')}
              >
                {label}
                {sortConfig?.key === key &&
                  (sortConfig.direction === "ascending" ? (
                    <ArrowUp size={14} className="inline ml-1" />
                  ) : (
                    <ArrowDown size={14} className="inline ml-1" />
                  ))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isLoading ? (
            <tr>
              <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                Loading products...
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td colSpan={3} className="px-6 py-4 text-center text-sm text-red-500">
                Error loading products. Please try again later.
              </td>
            </tr>
          ) : products.length > 0 ? (
            sortedProducts.map((product) => (
              <tr key={product.name}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sales}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{product.revenue.toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
