"use client"

import { useState, useRef } from "react"
import { Plus, Edit, Trash2, Upload, ChevronDown, ChevronRight } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Category } from "@/types/product-types"
import { categoryApi, AddCategoryPayload } from "@/lib/api/categories"
import { subcategoryApi, AddSubcategoryPayload } from "@/lib/api/subcategories"

export function CategoriesList() {
  const [formState, setFormState] = useState({ name: "", description: "", parentId: "" });
  const [subcategoryFormState, setSubcategoryFormState] = useState({ name: "", description: "", parentId: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Category | null>(null);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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

  const addSubcategoryMutation = useMutation({
    mutationFn: (payload: AddSubcategoryPayload) => subcategoryApi.addSubcategory(payload),
    onSuccess: (newSubcategory) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setSubcategoryFormState({ name: "", description: "", parentId: "" });
      setShowSubcategoryForm(null);
      
      // Expand the parent category to show the new subcategory
      if (newSubcategory.parentId) {
        setExpandedCategories(prev => new Set([...prev, newSubcategory.parentId!]));
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

  const updateSubcategoryMutation = useMutation({
    mutationFn: ({ id, name, description }: { id: string; name: string; description?: string }) => 
      subcategoryApi.updateSubcategory(id, { name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setEditingSubcategory(null)
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoryApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })

  const deleteSubcategoryMutation = useMutation({
    mutationFn: (id: string) => subcategoryApi.deleteSubcategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })

  const handleAddCategory = () => {
    if (!formState.name.trim()) return;
    addCategoryMutation.mutate({ ...formState, image: imageFile });
  };

  const handleAddSubcategory = (parentId: string) => {
    if (!subcategoryFormState.name.trim()) return;
    addSubcategoryMutation.mutate({ 
      ...subcategoryFormState, 
      parentId 
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
  }

  const handleEditSubcategory = (subcategory: Category) => {
    setEditingSubcategory(subcategory)
  }

  const handleUpdateCategory = (id: string, newName: string) => {
    if (!newName.trim()) return
    updateCategoryMutation.mutate({ id, name: newName })
  }

  const handleUpdateSubcategory = (id: string, newName: string, description?: string) => {
    if (!newName.trim()) return
    updateSubcategoryMutation.mutate({ id, name: newName, description })
  }

  const handleDeleteCategory = (id: string) => {
    if (confirm("Are you sure you want to delete this category? This will also delete all its subcategories.")) {
      deleteCategoryMutation.mutate(id)
    }
  }

  const handleDeleteSubcategory = (id: string) => {
    if (confirm("Are you sure you want to delete this subcategory?")) {
      deleteSubcategoryMutation.mutate(id)
    }
  }

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!data) {
    return <div>No categories found</div>
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      {/* Main Category Form */}
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
            <option value="">Main Category</option>
            {data?.filter((cat: Category) => !cat.parentId).map((cat: Category) => (
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

      {/* Categories List */}
      <ul>
        {data
          ?.filter((category: Category) => !category.parentId)
          .map((parentCategory: Category) => {
            const subcategories = data.filter(
              (cat: Category) => cat.parentId === parentCategory.id
            );
            const isExpanded = expandedCategories.has(parentCategory.id);
            
            return (
              <li key={parentCategory.id} className="border-b border-gray-200 last:border-b-0">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCategoryExpansion(parentCategory.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                    <div>
                      {editingCategory?.id === parentCategory.id ? (
                        <input
                          type="text"
                          defaultValue={parentCategory.name}
                          onBlur={(e) => handleUpdateCategory(parentCategory.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateCategory(parentCategory.id, e.currentTarget.value)
                            }
                            if (e.key === 'Escape') {
                              setEditingCategory(null)
                            }
                          }}
                          className="text-lg font-medium text-gray-900 border border-gray-300 rounded px-2 py-1"
                          autoFocus
                        />
                      ) : (
                        <>
                          <h3 className="text-lg font-medium text-gray-900">{parentCategory.name}</h3>
                          <p className="text-sm text-gray-500">
                            {parentCategory._count?.products || 0} products • {subcategories.length} subcategories
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowSubcategoryForm(showSubcategoryForm === parentCategory.id ? null : parentCategory.id)}
                      className="text-green-600 hover:text-green-900 text-sm px-2 py-1 border border-green-300 rounded"
                    >
                      Add Subcategory
                    </button>
                    <button 
                      onClick={() => handleEditCategory(parentCategory)} 
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(parentCategory.id)} 
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Subcategory Form */}
                {showSubcategoryForm === parentCategory.id && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <h4 className="text-md font-medium mb-3">Add Subcategory to {parentCategory.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={subcategoryFormState.name}
                        onChange={(e) => setSubcategoryFormState({ ...subcategoryFormState, name: e.target.value })}
                        placeholder="Subcategory Name"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                      />
                      <textarea
                        value={subcategoryFormState.description}
                        onChange={(e) => setSubcategoryFormState({ ...subcategoryFormState, description: e.target.value })}
                        placeholder="Subcategory Description"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f507f]"
                        rows={1}
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleAddSubcategory(parentCategory.id)}
                        disabled={addSubcategoryMutation.isPending}
                        className="px-3 py-1 bg-[#4f507f] text-white rounded text-sm hover:bg-[#3e3f63] transition-colors disabled:bg-gray-400"
                      >
                        {addSubcategoryMutation.isPending ? "Adding..." : "Add"}
                      </button>
                      <button
                        onClick={() => setShowSubcategoryForm(null)}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Subcategories List */}
                {isExpanded && subcategories.length > 0 && (
                  <ul className="bg-gray-50">
                    {subcategories.map((subcategory: Category) => (
                      <li 
                        key={subcategory.id} 
                        className="flex items-center justify-between px-12 py-3 border-t border-gray-100"
                      >
                        <div className="flex items-center">
                          <span className="text-gray-400 mr-2">↳</span>
                          <div>
                            {editingSubcategory?.id === subcategory.id ? (
                              <input
                                type="text"
                                defaultValue={subcategory.name}
                                onBlur={(e) => handleUpdateSubcategory(subcategory.id, e.target.value, subcategory.description)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateSubcategory(subcategory.id, e.currentTarget.value, subcategory.description)
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingSubcategory(null)
                                  }
                                }}
                                className="border border-gray-300 rounded px-2 py-1"
                                autoFocus
                              />
                            ) : (
                              <>
                                <span className="font-medium">{subcategory.name}</span>
                                <p className="text-sm text-gray-500">
                                  {subcategory._count?.products || 0} products
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleEditSubcategory(subcategory)} 
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSubcategory(subcategory.id)} 
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  )
}
