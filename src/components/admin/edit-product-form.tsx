"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Image from "next/image";
import {
  Upload,
  X,
  Plus,
  Trash2,
  Check,
} from "lucide-react";

import { productsApi, AddProductPayload } from "@/lib/api/products";
import UploadPopup from "@/components/UploadPopup";

// Assuming Asset type from a central types file
// Based on usage and errors, it likely looks like this:
export interface Asset {
  id?: string;
  url: string;
  asset_url: string;
  type: "IMAGE" | "VIDEO";
  colorId?: string | null;
  productId?: string | null;
  file?: File; // Add file property for new uploads
}

type ProductFormData = {
  id?: string;
  name: string;
  description: string;
  price: number;
  status: "DRAFT" | "PUBLISHED";
  assets: Asset[];
  discountPrice: number;
  categoryId: string;
  subcategoryId: string;
  material: string;
  [key: string]: any; // Index signature for dynamic properties
};

interface ProductVariant {
  id: string;
  color: string;
  isOpen: boolean;
  customColor: boolean;
  images: Array<Asset>;
  sizes: Array<{ id: string; name: string; quantity: number }>;
  productId?: string;
}

interface FormErrors {
  name: string;
  description: string;
  price: string;
  variants: string;
  images: string;
  category: string;
  material: string;
}

interface EditProductFormProps {
  productId: string;
}

export function EditProductForm({ productId }: EditProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [product, setProduct] = useState<ProductFormData>({
    id: productId,
    name: "",
    description: "",
    price: 0,
    status: "DRAFT",
    assets: [],
    discountPrice: 0,
    categoryId: "",
    subcategoryId: "",
    material: "",
  });

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]); // Store new image files

  const updateProduct = useCallback((updates: Partial<ProductFormData>) => {
    setProduct((prev) => ({ ...prev, ...updates }));
  }, []);

  const {
    data: productData,
    isLoading: isLoadingProduct,
    error: productQueryError,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: async (): Promise<ProductFormData | null> => {
      if (!productId) return null;
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      const data = await response.json();
      return {
        ...data,
        name: data.title || "",
        categoryId: data.categoryId || "",
        subcategoryId: data.subcategoryId || "",
      };
    },
    enabled: !!productId,
  });

  useEffect(() => {
    if (productData) {
      setProduct((prev) => ({
        ...prev,
        ...productData,
        assets: productData.assets || [],
        discountPrice: productData.discountPrice || 0,
        status: productData.status || "DRAFT",
      }));
      // Assuming variants are fetched with the product or separately
      // setVariants(productData.variants || []);
    }
  }, [productData]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      product.assets.forEach(asset => {
        if (asset.file && asset.url.startsWith('blob:')) {
          URL.revokeObjectURL(asset.url);
        }
      });
      variants.forEach(variant => {
        variant.images.forEach(img => {
          if (img.file && img.url.startsWith('blob:')) {
            URL.revokeObjectURL(img.url);
          }
        });
      });
    };
  }, []);

  const [formErrors, setFormErrors] = useState<FormErrors>({
    name: "",
    description: "",
    price: "",
    variants: "",
    images: "",
    category: "",
    material: "",
  });

  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState<boolean>(false);
  const [variantId, setVariantId] = useState<string>("");
  const [variantImgPopUp, setVariantImgPopUp] = useState<boolean>(false);
  const [priceError, setPriceError] = useState<string>("");
  const [discountPriceError, setDiscountPriceError] = useState<string>("");

  const validateProduct = (): boolean => {
    const newErrors: FormErrors = {
        name: "", description: "", price: "", variants: "", images: "", category: "", material: ""
    };
    let isValid = true;

    if (!product.name.trim()) {
      newErrors.name = "Product name is required";
      isValid = false;
    }
    if (!product.description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    }
    if (isNaN(product.price) || product.price <= 0) {
      newErrors.price = "Please enter a valid price greater than 0";
      isValid = false;
    }
    if (!product.categoryId) {
      newErrors.category = "Please select a category";
      isValid = false;
    }
    if (!product.material.trim()) {
      newErrors.material = "Material is required";
      isValid = false;
    }
    if (variants.length === 0) {
      newErrors.variants = "At least one variant is required";
      isValid = false;
    } else {
      for (const variant of variants) {
        if (!variant.color.trim()) {
          newErrors.variants = "Variant color is required";
          isValid = false;
          break;
        }
        if (variant.images.length === 0) {
          newErrors.variants = "Each variant must have at least one image";
          isValid = false;
          break;
        }
      }
    }
    if (product.assets.length === 0) {
      newErrors.images = "At least one product image is required";
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: crypto.randomUUID(),
        color: "",
        isOpen: true,
        customColor: false,
        images: [],
        sizes: [{ id: crypto.randomUUID(), name: "", quantity: 0 }],
        productId: productId || "",
      },
    ]);
  };

  const handleAddImage = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    const newAsset: Asset = {
      url: imageUrl,
      asset_url: imageUrl,
      type: "IMAGE",
      file: file,
    };
    updateProduct({
      assets: [...product.assets, newAsset],
    });
    setNewImages(prev => [...prev, file]);
  };

  const handleRemoveImage = (index: number) => {
    const assetToRemove = product.assets[index];
    if (assetToRemove?.file) {
      // Remove from newImages array if it's a new upload
      setNewImages(prev => prev.filter(file => file !== assetToRemove.file));
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(assetToRemove.url);
    }
    const newAssets = product.assets.filter((_, i) => i !== index);
    updateProduct({ assets: newAssets });
  };

  const handleAddVarientImage = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    const newAsset: Asset = {
      url: imageUrl,
      asset_url: imageUrl,
      type: "IMAGE",
      colorId: variantId,
      file: file,
    };
    setVariants(
      variants.map((v) =>
        v.id === variantId ? { ...v, images: [...v.images, newAsset] } : v
      )
    );
  };

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  interface Category {
    id: string;
    name: string;
    parentId?: string;
  }

  const productMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Collect all image files (both new uploads and variant images)
      const allImageFiles: File[] = [];
      
      // Add main product images (only new files)
      data.assets.forEach(asset => {
        if (asset.file) {
          allImageFiles.push(asset.file);
        }
      });
      
      // Add variant images
      variants.forEach(variant => {
        variant.images.forEach(img => {
          if (img.file) {
            allImageFiles.push(img.file);
          }
        });
      });

      const payload: AddProductPayload = {
        title: data.name,
        description: data.description,
        price: Number(data.price),
        status: data.status || "DRAFT",
        comparePrice: data.discountPrice ? Number(data.discountPrice) : undefined,
        sku: `PROD-${Date.now()}`,
        stockQuantity: 0,
        categoryId: data.categoryId,
        isBestseller: false,
        isNewProduct: true,
        images: allImageFiles,
      };

      if (productId) {
        return productsApi.updateProduct(productId, payload);
      } else {
        return productsApi.addProduct(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`Product ${productId ? "updated" : "created"} successfully`);
      router.push("/admin/products");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to save product");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProduct()) {
      return;
    }
    productMutation.mutate(product);
  };

  if (isLoadingProduct) return <div>Loading...</div>;
  if (productQueryError) return <div>Error loading product</div>;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 text-[#4f507f]">
            Product Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name
              </label>
              <input
                type="text"
                value={product.name}
                onChange={(e) => updateProduct({ name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                placeholder="Enter product name"
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={product.description}
                onChange={(e) => updateProduct({ description: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                placeholder="Enter product description"
              />
              {formErrors.description && (
                <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 text-[#4f507f]">Media</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.assets?.map((image, index) => (
              <div key={index} className="relative group">
                <Image
                  src={image.url || image.asset_url || "/placeholder.png"}
                  alt={`Product image ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-32 object-contain rounded-md border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setIsUploadPopupOpen(true)}
              className="w-full h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:text-[#4f507f] hover:border-[#4f507f] transition-colors"
            >
              <Upload size={24} />
              <span className="mt-2 text-sm">Add Image</span>
            </button>
          </div>
          {formErrors.images && (
            <p className="text-red-500 text-xs mt-2">{formErrors.images}</p>
          )}
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4 text-[#4f507f]">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs</span>
                        <input
                            type="text"
                            value={product.price}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (!/^\d*\.?\d*$/.test(value)) {
                                    setPriceError("Please enter a valid number");
                                    return;
                                }
                                setPriceError("");
                                updateProduct({ price: value ? parseFloat(value) : 0 });
                            }}
                            className={`w-full pl-8 pr-3 py-2 bg-white border ${priceError ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]`}
                            placeholder="0.00"
                        />
                    </div>
                    {priceError && <p className="mt-1 text-sm text-red-500">{priceError}</p>}
                    {formErrors.price && <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discounted Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rs</span>
                        <input
                            type="text"
                            value={product.discountPrice}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (!/^\d*\.?\d*$/.test(value)) {
                                    setDiscountPriceError("Please enter a valid number");
                                    return;
                                }
                                setDiscountPriceError("");
                                updateProduct({ discountPrice: value ? parseFloat(value) : 0 });
                            }}
                            className={`w-full pl-8 pr-3 py-2 bg-white border ${discountPriceError ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]`}
                            placeholder="0.00"
                        />
                    </div>
                    {discountPriceError && <p className="mt-1 text-sm text-red-500">{discountPriceError}</p>}
                </div>
            </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#4f507f]">Product Variants</h2>
            <button
                type="button"
                onClick={addVariant}
                className="px-4 py-2 text-sm bg-[#4f507f] text-white rounded-md hover:bg-[#3e3f63] transition-colors duration-200 flex items-center gap-2"
            >
                <Plus size={16} />
                Add Color Variant
            </button>
          </div>
          {formErrors.variants && (
            <p className="text-red-500 text-xs mb-4">{formErrors.variants}</p>
          )}
          {/* Variant mapping and UI would go here */}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 text-[#4f507f]">Organization</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
              {isLoadingCategories ? (
                <div>Loading...</div>
              ) : (
                <div className="space-y-2">
                  {categories?.filter((cat: Category) => !cat.parentId).map((category: Category) => {
                    const subcategories = categories?.filter((subcat: Category) => subcat.parentId === category.id) || [];
                    return (
                        <div key={category.id} className="space-y-1">
                            <div onClick={() => updateProduct({ categoryId: category.id, subcategoryId: ''})} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${product.categoryId === category.id && !product.subcategoryId ? "bg-[#edeefc] text-[#4f507f]" : "hover:bg-gray-100"}`}>
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${product.categoryId === category.id && !product.subcategoryId ? "bg-[#4f507f] text-white" : "border border-gray-300"}`}>
                                    {product.categoryId === category.id && !product.subcategoryId && <Check size={14} />}
                                </div>
                                <span className="font-medium">{category.name}</span>
                            </div>
                            {subcategories.length > 0 && (
                                <div className="pl-6 space-y-1">
                                    {subcategories.map((subcategory: Category) => (
                                        <div key={subcategory.id} onClick={(e) => { e.stopPropagation(); updateProduct({ categoryId: category.id, subcategoryId: subcategory.id }); }} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${product.subcategoryId === subcategory.id ? "bg-[#edeefc] text-[#4f507f]" : "hover:bg-gray-100"}`}>
                                            <div className={`w-5 h-5 rounded-md flex items-center justify-center ${product.subcategoryId === subcategory.id ? "bg-[#4f507f] text-white" : "border border-gray-300"}`}>
                                                {product.subcategoryId === subcategory.id && <Check size={14} />}
                                            </div>
                                            <span>— {subcategory.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                  })}
                </div>
              )}
              {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                placeholder="Enter material"
                value={product.material}
                onChange={(e) => updateProduct({ material: e.target.value })}
              />
              {formErrors.material && <p className="text-red-500 text-xs mt-1">{formErrors.material}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 text-[#4f507f]">Status</h2>
          <div className="flex space-x-4">
            <button type="button" onClick={() => updateProduct({ status: "DRAFT" })} className={`px-4 py-2 rounded-md ${product.status === "DRAFT" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-800"}`}>Draft</button>
            <button type="button" onClick={() => updateProduct({ status: "PUBLISHED" })} className={`px-4 py-2 rounded-md ${product.status === "PUBLISHED" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>Published</button>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={productMutation.isPending} className="flex-1 bg-[#4f507f] text-white py-2 px-4 rounded-md hover:bg-[#3e3f63] transition-colors disabled:opacity-50">
            {productMutation.isPending ? "Saving..." : "Save Product"}
          </button>
          <button type="button" onClick={() => router.back()} className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors">
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
      {variantImgPopUp && (
        <UploadPopup
          onSuccess={handleAddVarientImage}
          onClose={() => setVariantImgPopUp(false)}
        />
      )}
    </form>
  );
}
