import { Varient } from "@/types/product-types";

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Something went wrong");
  }
  return response.json();
};

export const varientApi = {
  getAll: async (): Promise<Varient[]> => {
    const response = await fetch("/api/products/color");
    const data = await handleResponse(response);
    return data.varients;
  },
  getById: async (id: string): Promise<Varient> => {
    const response = await fetch(`/api/products/color/${id}`);
    return handleResponse(response);
  },
  addVarient: async (varient: Varient): Promise<Varient> => {
    const response = await fetch("/api/products/color", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(varient),
    });
    return handleResponse(response);
  },
  updateVarient: async (id: string | undefined, varient: Varient): Promise<Varient> => {
    if(!id) throw new Error("Invalid varient id");
    const response = await fetch(`/api/products/color/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(varient),
    });
    return handleResponse(response);
  },
  deleteVarient: async (id: string): Promise<void> => {
    const response = await fetch(`/api/products/color/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Something went wrong");
    }
  },
}; 