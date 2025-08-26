"use client";

import { useState } from "react";
import { Upload, X, Check, Plus, Trash2, ChevronRight } from "lucide-react";
import Image from "next/image";
import UploadPopup from "../UploadPopup";
import { Category } from "@/types/product-types";
import { Product as PrismaProduct, ProductStatus } from '@prisma/client';
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { categoryApi } from "@/lib/api/categories";
import cuid from "cuid";
import { varientApi } from "@/lib/api/varients";
import { productsApi } from "@/lib/api/products";
import { AddProductPayload } from "@/lib/api/products";

export function AddProductForm() {
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
  const [varientId, setVarientId] = useState<string>("");
  const [varientImgPopUp, setVarientImgPopUp] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [derror, setderror] = useState<string>("");

  const router = useRouter();

  const Sizes = [
    "SIZE_5",
    "SIZE_6",
    "SIZE_7",
    "SIZE_8",
    "SIZE_9",
    "SIZE_10",
    "SIZE_11",
    "SIZE_12",
  ];

  interface Variant {
    isOpen: boolean;
    id: string;
    color: string;
    customColor: boolean;
    images: {
      url: string;
      type: "IMAGE" | "VIDEO";
    }[];
    sizes: {
      id: string;
      name: string;
      quantity: number;
    }[];
  }
  const [variants, setVariants] = useState<Variant[]>([]);
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    sku: "",
    stockQuantity: "",
  });

    const [images, setImages] = useState<File[]>([]);

  const [product, setProduct] = useState<Omit<AddProductPayload, 'images'>>({
    title: "",
    description: "",
    shortDescription: "",
    price: 0,
    comparePrice: 0,
    sku: "",
    categoryId: "",
    stockQuantity: 0,
    lowStockThreshold: 10,
    isBestseller: false,
    status: ProductStatus.DRAFT,
    isNewProduct: true,
    status: "DRAFT",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });

  const validateProduct = () => {
    const newErrors = {
      title: "",
      description: "",
      price: "",
      category: "",
      sku: "",
      stockQuantity: "",
    };
    if (!product.title?.trim()) {
      newErrors.title = "Product title is required";
    }

    if (!product.description?.trim()) {
      newErrors.description = "Product description is required";
    }

    if (!product.price || product.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!product.categoryId?.trim()) {
      newErrors.category = "Please select a category";
      valid = false;
    }

    if (!product.sku?.trim()) {
      newErrors.sku = "SKU is required";
      valid = false;
    }

    if (product.stockQuantity === null || product.stockQuantity < 0) {
      newErrors.stockQuantity = "Stock quantity must be a non-negative number";
      valid = false;
    }

    if (images.length === 0) {
      newErrors.images = "At least one image is required";
      valid = false;
    }

    if (variants.length > 0) {
      const hasInvalidVariant = variants.some(
        (variant) =>
          !variant.color ||
          variant.images.length === 0 ||
          variant.sizes.length === 0
      );
      if (hasInvalidVariant) {
        newErrors.variants = "All variants must have color, images and sizes";
      }
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: cuid(),
        color: "",
        customColor: false,
        images: [],
        sizes: [
          {
            id: cuid(),
            name: "SIZE_5",
            quantity: 0,
          },
        ],
        isOpen: true,
      },
    ]);
  };

  const addSize = (variantId: string) => {
    setVariants(
      variants.map((variant) => {
        if (variant.id === variantId) {
          return {
            ...variant,
            sizes: [...variant.sizes, { id: cuid(), name: "", quantity: 0 }],
          };
        }
        return variant;
      })
    );
  };

  const removeVariant = (variantId: string) => {
    setVariants(variants.filter((v) => v.id !== variantId));
  };

  const removeSize = (variantId: string, sizeId: string) => {
    setVariants(
      variants.map((variant) => {
        if (variant.id === variantId) {
          return {
            ...variant,
            sizes: variant.sizes.filter((size) => size.id !== sizeId),
          };
        }
        return variant;
      })
    );
  };

  const handleAddVarientImage = (imageUrl: string) => {
    // In a real app, this would open a file picker
    setVariants(
      variants.map((variant) => {
        if (variant.id === varientId) {
          return {
            ...variant,
            images: [...variant.images, { url: imageUrl, type: "IMAGE" }],
          };
        }
        return variant;
      })
    );
    setVarientImgPopUp(false);
  };

  const handleRemoveVariantImage = (variantId: string, imageIndex: number) => {
    setVariants(
      variants.map((variant) => {
        if (variant.id === variantId) {
          const newImages = [...variant.images];
          newImages.splice(imageIndex, 1);
          return {
            ...variant,
            images: newImages,
          };
        }
        return variant;
      })
    );
  };

  const categoryQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getAll(),
  });

    const handleAddImage = (file: File) => {
    setImages(prev => [...prev, file]);
    setIsUploadPopupOpen(false);
  };

    const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  const variantMutation = useMutation({
    mutationFn: (variant: {
      productId: string;
      color: string;
      assets: {
        url: string;
        type: "IMAGE" | "VIDEO";
      }[];
      sizes: {
        size:
          | "SIZE_5"
          | "SIZE_6"
          | "SIZE_7"
          | "SIZE_8"
          | "SIZE_9"
          | "SIZE_10"
          | "SIZE_11"
          | "SIZE_12";
        stock: number;
      }[];
    }) => varientApi.addVarient(variant),
  });

    const productMutation = useMutation({
    mutationFn: (payload: AddProductPayload) => productsApi.addProduct(payload),
    onSuccess: () => {
      router.push(`/admin/products`);
    },
    onError: (error: any) => {
      // Assuming the error message from the API is helpful
      setErrors(prev => ({ ...prev, sku: error.message || 'An unexpected error occurred' }))
    }
  });

  const saveProduct = async () => {
    if (!validateProduct()) return;

    const payload: AddProductPayload = {
      ...product,
      price: product.price || 0,
      stockQuantity: product.stockQuantity || 0,
      isBestseller: product.isBestseller || false,
      isNewProduct: product.isNewProduct || false,
      images: images,
      // variants: variants, // Add variants logic here if needed
    };

    productMutation.mutate(payload);
  };
  return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* ... existing product info ... */}
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 text-[#4f507f]">Status</h2>
          <select
            name="status"
            value={product.status}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value={ProductStatus.DRAFT}>Draft</option>
            <option value={ProductStatus.PUBLISHED}>Published</option>
            <option value={ProductStatus.ARCHIVED}>Archived</option>
          </select>
        </div>
        {/* ... existing category and other sections ... */}
      </div>
    </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 text-[#4f507f]">
            Product Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Title
              </label>
              <input
                type="text"
                value={product.title || ''}
                onChange={(e) =>
                  setProduct({ ...product, title: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                placeholder="Enter product title"
              />
              {errors.title && (
                <p className="text-red-500 text-xs">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Long Description
              </label>
              <textarea
                rows={6}
                value={product.description || ''}
                onChange={(e) =>
                  setProduct({ ...product, description: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                placeholder="Enter detailed product description"
              />
              {errors.description && (
                <p className="text-red-500 text-xs">{errors.description}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Description
              </label>
              <textarea
                rows={3}
                value={product.shortDescription || ''}
                onChange={(e) =>
                  setProduct({ ...product, shortDescription: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                placeholder="Enter a brief summary"
              />
            </div>

          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 text-[#4f507f]">Media</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <Image
                  src={URL.createObjectURL(image)}
                  alt={`Product image ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-32 object-contain rounded-md border border-gray-200"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              </div>
            ))}

            <button
              onClick={() => setIsUploadPopupOpen(true)}
              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:text-[#4f507f] hover:border-[#4f507f] transition-colors">
              <Upload size={24} />
              <span className="mt-2 text-sm">Add Image</span>
            </button>
          </div>
          {errors.images && (
            <p className="text-red-500 text-xs">{errors.images}</p>
          )}
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 text-[#4f507f]">Pricing</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  Rs
                </span>
                <input
                  type="text"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^\d*\.?\d*$/.test(value)) {
                      setError("Please enter a valid number");
                      return;
                    }
                    setError("");
                    setProduct({
                      ...product,
                      price: value ? parseFloat(value) : 0,
                    });
                  }}
                  className={`w-full pl-8 pr-3 py-2 bg-white border ${
                    error ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]`}
                  placeholder="0.00"
                />
              </div>
              {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
              {errors.price && (
                <p className="mt-1 text-sm text-red-500">{errors.price}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discounted Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  Rs
                </span>
                <input
                  type="text"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^\d*\.?\d*$/.test(value)) {
                      setderror("Please enter a valid number");
                      return;
                    }
                    setderror("");
                    setProduct({
                      ...product,
                      comparePrice: value ? parseFloat(value) : 0,
                    });
                  }}
                  className={`w-full pl-8 pr-3 py-2 bg-white border ${
                    derror ? "border-red-500" : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]`}
                  placeholder="0.00"
                />
              </div>
              {derror && <p className="mt-1 text-sm text-red-500">{derror}</p>}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 text-[#4f507f]">Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU (Stock Keeping Unit)
              </label>
              <input
                type="text"
                value={product.sku || ''}
                onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                placeholder="Enter SKU"
              />
              {errors.sku && (
                <p className="text-red-500 text-xs">{errors.sku}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                value={product.stockQuantity || 0}
                onChange={(e) => setProduct({ ...product, stockQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                placeholder="0"
              />
              {errors.stockQuantity && (
                <p className="text-red-500 text-xs">{errors.stockQuantity}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={product.lowStockThreshold || 0}
                onChange={(e) => setProduct({ ...product, lowStockThreshold: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                placeholder="10"
              />
            </div>
          </div>
        </div>{" "}
      </div>{" "}
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 text-[#4f507f]">
            Organization
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories
              </label>
              <div className="space-y-2">
                {categoryQuery.isLoading ? (
                  <div className="flex items-center flex-1 justify-start">
                    {" "}
                    Loading...
                  </div>
                ) : (
                  categoryQuery.data?.map((category: Category) => (
                    <div
                      key={category.id}
                      onClick={() =>
                        setProduct({ ...product, categoryId: category.id })
                      }
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${
                        product.categoryId === category.id
                          ? "bg-[#edeefc] text-[#4f507f]"
                          : "hover:bg-gray-100"
                      }`}>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center ${
                          product.categoryId === category.id
                            ? "bg-[#4f507f] text-white"
                            : "border border-gray-300"
                        }`}>
                        {product.categoryId === category.id && (
                          <Check size={14} />
                        )}
                      </div>
                      <span>{category.name}</span>
                    </div>
                  ))
                )}
              </div>
              {errors.category && (
                <p className="text-red-500 text-xs">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Flags
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-bestseller"
                  checked={product.isBestseller || false}
                  onChange={(e) => setProduct({ ...product, isBestseller: e.target.checked })}
                  className="w-4 h-4 text-[#4f507f] bg-white rounded focus:ring-[#4f507f]"
                />
                <label htmlFor="is-bestseller" className="text-sm text-gray-700">
                  Bestseller
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-new-product"
                  checked={product.isNewProduct || false}
                  onChange={(e) => setProduct({ ...product, isNewProduct: e.target.checked })}
                  className="w-4 h-4 text-[#4f507f] bg-white rounded focus:ring-[#4f507f]"
                />
                <label htmlFor="is-new-product" className="text-sm text-gray-700">
                  New Product
                </label>
              </div>
            </div>
          </div>{" "}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 text-[#4f507f]">SEO</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Title
              </label>
              <input
                type="text"
                value={product.seoTitle || ''}
                onChange={(e) => setProduct({ ...product, seoTitle: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                placeholder="Enter SEO title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Description
              </label>
              <textarea
                rows={3}
                value={product.seoDescription || ''}
                onChange={(e) => setProduct({ ...product, seoDescription: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                placeholder="Enter SEO description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Keywords
              </label>
              <input
                type="text"
                value={product.seoKeywords || ''}
                onChange={(e) => setProduct({ ...product, seoKeywords: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                placeholder="e.g., keyword1, keyword2"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold mb-6 text-[#4f507f] flex items-center">
            <span className="inline-block w-2 h-2 bg-[#4f507f] rounded-full mr-2"></span>
            Status
          </h2>

          <div>
            <div className="flex space-x-4">
              <button
                onClick={() => setProduct({ ...product, status: "DRAFT" })}
                className={`px-4 py-2 rounded-md ${
                  product.status === "DRAFT"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                Draft
              </button>
              <button
                onClick={() => setProduct({ ...product, status: "PUBLISHED" })}
                className={`px-4 py-2 rounded-md ${
                  product.status === "PUBLISHED"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                Published
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-[#4f507f] text-white py-2 px-4 rounded-md hover:bg-[#3e3f63] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={saveProduct}
            disabled={productMutation.isPending}>
            {productMutation.isPending ? "Saving..." : "Save Product"}
          </button>
          <button
            type="button"
            className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
      {isUploadPopupOpen && (
        <UploadPopup
          onSuccess={handleAddImage}
          onClose={() => setIsUploadPopupOpen(false)}
        />
      )}
      {varientImgPopUp && (
        <UploadPopup
          onSuccess={handleAddVarientImage}
          onClose={() => setVarientImgPopUp(false)}
        />
      )}
    </div>
  );
}
