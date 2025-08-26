"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown } from "lucide-react";
import { ProductPerformanceApi } from "@/lib/api/productperformance";

export interface ProductPerformance {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  profit: number;
}

export function ProductPerformanceTable() {
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProductPerformance; direction: "ascending" | "descending" } | null>(null);

  // Fetch products using React Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ["productPerformance"],
    queryFn: async () => {
      try {
        const data = await ProductPerformanceApi.getAll();
        console.log("Fetched products:", data);
        return Array.isArray(data) ? data : []; // ✅ Ensure data is an array
      } catch (error) {
        console.error("Error fetching products:", error);
        return []; // ✅ Return empty array instead of undefined
      }
    },
  });

  const products = Array.isArray(data) ? data : []; // ✅ Prevent non-iterable error

  // Sorting logic
  const sortedProducts = [...products].sort((a, b) => {
    if (!sortConfig) return 0;
    const key = sortConfig.key;
    const aValue = a[key] ?? 0;
    const bValue = b[key] ?? 0;

    if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
    return 0;
  });

  // Sorting handler
  const requestSort = (key: keyof ProductPerformance) => {
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
              { label: "Category", key: "category" },
              { label: "Sales", key: "sales" },
              { label: "Revenue", key: "revenue" },
              { label: "Profit", key: "profit" },
            ].map(({ label, key }) => (
              <th
                key={key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort(key as keyof ProductPerformance)}
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
              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                Loading products...
              </td>
            </tr>
          ) : isError ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-sm text-red-500">
                Error loading products. Please try again later.
              </td>
            </tr>
          ) : products.length > 0 ? (
            sortedProducts.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sales}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.revenue.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.profit.toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
