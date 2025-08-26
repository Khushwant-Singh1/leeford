"use client"

import { useState, useRef } from "react"
import { Plus, Edit, Trash2, Upload } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Category } from "@/types/product-types"
import { categoryApi, AddCategoryPayload } from "@/lib/api/categories"

export function CategoriesList() {
  const [formState, setFormState] = useState({ name: "", description: "", parentId: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.getAll,
  })

  const addCategoryMutation = useMutation({
    mutationFn: (payload: AddCategoryPayload) => categoryApi.addCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setFormState({ name: "", description: "", parentId: "" });
      setImageFile(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (category: { id: string; name: string }) => categoryApi.updateCategory(category.id, category.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setEditingCategory(null)
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoryApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })

  const handleAddCategory = () => {
    if (!formState.name.trim()) return;
    addCategoryMutation.mutate({ ...formState, image: imageFile });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
  }

  const handleUpdateCategory = (id: string, newName: string) => {
    if (!newName.trim()) return
    updateCategoryMutation.mutate({ id, name: newName })
  }

  const handleDeleteCategory = (id: string) => {
    deleteCategoryMutation.mutate(id)
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 space-y-4">
        <h2 className="text-xl font-semibold">Add New Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={formState.name}
            onChange={(e) => setFormState({ ...formState, name: e.target.value })}
            placeholder="Category Name"
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
          />
          <select
            value={formState.parentId}
            onChange={(e) => setFormState({ ...formState, parentId: e.target.value })}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
          >
            <option value="">Select Parent Category (optional)</option>
            {data?.map((cat: Category) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <textarea
          value={formState.description}
          onChange={(e) => setFormState({ ...formState, description: e.target.value })}
          placeholder="Category Description"
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
          rows={3}
        />
        <div className="flex items-center gap-4">
            <label htmlFor="category-image" className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <Upload size={18} />
                <span>{imageFile ? "Change Image" : "Upload Image"}</span>
            </label>
            <input id="category-image" ref={imageInputRef} type="file" accept="image/*" onChange={(e) => e.target.files && setImageFile(e.target.files[0])} className="hidden" />
            {imageFile && <span className="text-sm text-gray-600">{imageFile.name}</span>}
        </div>
        <button
          onClick={handleAddCategory}
          disabled={addCategoryMutation.isPending}
          className="px-4 py-2 bg-[#4f507f] text-white rounded-md hover:bg-[#3e3f63] transition-colors disabled:bg-gray-400 flex items-center gap-2"
        >
          <Plus size={20} />
          {addCategoryMutation.isPending ? "Adding..." : "Add Category"}
        </button>
      </div>
      <ul>
        {data?.map((category: Category) => (
          <li
            key={category.id}
            className="flex items-center justify-between px-6 py-4 border-b border-gray-200 last:border-b-0"
          >
            {editingCategory?.id === category.id ? (
              <div className="flex items-center flex-grow mr-4">
                <input
                  type="text"
                  defaultValue={category.name}
                  className="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUpdateCategory(category.id, e.currentTarget.value)
                    } else if (e.key === 'Escape') {
                      setEditingCategory(null)
                    }
                  }}
                  onBlur={(e) => handleUpdateCategory(category.id, e.target.value)}
                  autoFocus
                />
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.productCount} products</p>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleEditCategory(category)} 
                className="text-indigo-600 hover:text-indigo-900"
              >
                <Edit size={18} />
              </button>
              <button onClick={() => handleDeleteCategory(category.id)} className="text-red-600 hover:text-red-900">
                <Trash2 size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
