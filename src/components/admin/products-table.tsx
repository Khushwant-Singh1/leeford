"use client";

import Link from "next/link";
import { Edit, Trash2, Copy, Eye, EyeOff, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import cuid from "cuid";
import { productApi, Product } from "@/lib/api/productdetails";
import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";

export function ProductsTable() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", currentPage, itemsPerPage, debouncedSearchTerm],
    queryFn: () =>
      productApi.getProducts(currentPage, itemsPerPage, debouncedSearchTerm),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const copyMutation = useMutation({
    mutationFn: async (product: Product) => {
      // FIX: Create a FormData object to match the API client's expected type.
      const formData = new FormData();
      formData.append("title", `${product.title} (Copy)`);
      formData.append("sku", `${product.sku}-COPY-${cuid().slice(0, 5)}`);
      formData.append("price", String(product.price));
      formData.append("stockQuantity", "0"); // Copies start with 0 stock
      formData.append("status", "DRAFT");
      // Append other necessary fields from your product model here
      formData.append("description", product.description || "Copied product description.");
      
      await productApi.addProduct(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({
      id,
      newStatus,
    }: {
      id: string;
      newStatus: "PUBLISHED" | "DRAFT" | "ARCHIVED";
    }) => productApi.updateStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const products = data?.products || [];
  const { totalPages } = data?.pagination || { totalPages: 1 };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search products..."
          className="w-full bg-white p-2 pl-10 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
      </div>

      {isLoading && <div className="flex justify-center p-4">Loading...</div>}
      {!isLoading && !products.length && (
        <div className="p-4">No products found</div>
      )}
      {error && (
        <div className="text-red-500 p-4">Error loading products</div>
      )}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product: Product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="relative w-20 h-20">
                    <Image
                      src={product.images?.[0]?.url || "/placeholder.png"}
                      alt={product.title || "Product image"}
                      fill
                      className="object-cover rounded"
                      sizes="80px"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{product.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  ₹{product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.status === "PUBLISHED"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/products/edit/${product.id}`}
                      className="text-indigo-600 hover:text-indigo-900 transition-colors"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() =>
                        product.id && deleteMutation.mutate(product.id)
                      }
                      className="text-red-600 hover:text-red-900 transition-colors"
                      disabled={!product.id}
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => copyMutation.mutate(product)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => {
                        if (!product.id) return;
                        const newStatus =
                          product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
                        toggleStatusMutation.mutate({
                          id: product.id,
                          newStatus,
                        });
                      }}
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                      disabled={!product.id}
                    >
                      {product.status === "PUBLISHED" ? (
                        <Eye size={18} />
                      ) : (
                        <EyeOff size={18} />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 bg-white p-4 rounded-lg shadow">
        <div className="mb-4 sm:mb-0">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 bg-white py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-gray-700"
          >
            <option value="5">5 per page</option>
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>

        <div className="flex justify-center space-x-3">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 flex items-center space-x-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors duration-200 ${
                    currentPage === pageNum
                      ? "bg-indigo-600 text-white font-medium shadow-md"
                      : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 flex items-center space-x-1"
          >
            <span>Next</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
