import { Category } from "@/types/product-types";

export interface AddCategoryPayload {
  name: string;
  description?: string;
  parentId?: string;
  image?: File | null;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Something went wrong");
  }
  return response.json();
};

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await fetch("/api/categories");
    return handleResponse(response);
  },
  getById: async (id: string): Promise<Category> => {
    const response = await fetch(`/api/categories/${id}`);
    return handleResponse(response);
  },
  addCategory: async (payload: AddCategoryPayload): Promise<Category> => {
    const formData = new FormData();
    formData.append("name", payload.name);
    if (payload.description) formData.append("description", payload.description);
    if (payload.parentId) formData.append("parentId", payload.parentId);
    if (payload.image) formData.append("image", payload.image);

    const response = await fetch("/api/categories", {
      method: "POST",
      body: formData,
    });
    return handleResponse(response);
  },
  deleteCategory: async (id: string): Promise<void> => {
    const response = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Something went wrong");
    }
  },
  updateCategory: async (id: string, name: string): Promise<Category> => {
    const response = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    return handleResponse(response);
  },
};
