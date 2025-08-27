import { Category } from "@/types/product-types";

export interface AddSubcategoryPayload {
  name: string;
  description?: string;
  parentId: string;
}

export interface UpdateSubcategoryPayload {
  name: string;
  description?: string;
  parentId?: string;
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Something went wrong");
  }
  return response.json();
};

export const subcategoryApi = {
  getAll: async (parentId?: string): Promise<Category[]> => {
    const url = parentId 
      ? `/api/subcategories?parentId=${parentId}`
      : '/api/subcategories';
    const response = await fetch(url);
    return handleResponse(response);
  },
  getById: async (id: string): Promise<Category> => {
    const response = await fetch(`/api/subcategories/${id}`);
    return handleResponse(response);
  },
  addSubcategory: async (payload: AddSubcategoryPayload): Promise<Category> => {
    const response = await fetch("/api/subcategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
  updateSubcategory: async (id: string, payload: UpdateSubcategoryPayload): Promise<Category> => {
    const response = await fetch(`/api/subcategories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
  deleteSubcategory: async (id: string): Promise<void> => {
    const response = await fetch(`/api/subcategories/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Something went wrong");
    }
  },
};
