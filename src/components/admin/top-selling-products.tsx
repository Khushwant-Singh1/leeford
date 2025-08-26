"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductPerformanceApi } from "@/lib/api/productperformance";

export function TopSellingProducts() {

  // Fetch products using React Query
  const { data: products = [], isLoading, isError } = useQuery({
    queryKey: ["productPerformance"],
    queryFn: async () => {
      try {
        const data = await ProductPerformanceApi.getAll();
        console.log("Fetched products:", data);
        if (!data) throw new Error("No data returned");
        return data;
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
  });

  if (isError) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-medium mb-4 text-[#4f507f]">
          Top Selling Products
        </h2>
        <div className="text-center py-8 text-red-500">
          Error loading products data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-medium mb-4 text-[#4f507f]">
        Top Selling Products
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sales
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading products...
                </td>
              </tr>
            ) : products.length > 0 ? (
              products.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sales}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${product.revenue}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
            {!isLoading && products.map((product, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sales}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{product.revenue}</td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>
    </div>
  );
}
