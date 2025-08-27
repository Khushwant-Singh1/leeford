"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronDown, ChevronRight, Package } from "lucide-react"
import { Category } from "@/types/product-types"
import { categoryApi } from "@/lib/api/categories"

export function CategoryBrowser() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: categoryApi.getAll,
  })

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  if (isLoading) {
    return <div className="p-4">Loading categories...</div>
  }

  const mainCategories = categories?.filter((cat: Category) => !cat.parentId) || []

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Package size={20} />
        Browse by Category
      </h3>
      
      <div className="space-y-2">
        {mainCategories.map((category: Category) => {
          const subcategories = categories?.filter((cat: Category) => cat.parentId === category.id) || []
          const isExpanded = expandedCategories.has(category.id)
          const isSelected = selectedCategory === category.id
          
          return (
            <div key={category.id} className="border border-gray-200 rounded-md">
              <div
                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
                  isSelected ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => handleCategorySelect(category.id)}
              >
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCategoryExpansion(category.id)
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <span className="font-medium">{category.name}</span>
                  <span className="text-sm text-gray-500">
                    ({category._count?.products || 0} products)
                  </span>
                </div>
                
                {subcategories.length > 0 && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    {subcategories.length} subcategories
                  </span>
                )}
              </div>
              
              {isExpanded && subcategories.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {subcategories.map((subcategory: Category) => {
                    const isSubSelected = selectedCategory === subcategory.id
                    
                    return (
                      <div
                        key={subcategory.id}
                        className={`flex items-center justify-between px-6 py-2 cursor-pointer hover:bg-gray-100 ${
                          isSubSelected ? 'bg-blue-50 text-blue-700' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCategorySelect(subcategory.id)
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">↳</span>
                          <span>{subcategory.name}</span>
                          <span className="text-sm text-gray-500">
                            ({subcategory._count?.products || 0} products)
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {selectedCategory && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            Selected: {categories?.find(cat => cat.id === selectedCategory)?.name}
            {categories?.find(cat => cat.id === selectedCategory)?.parentId && (
              <span className="ml-1">
                (under {categories?.find(cat => cat.id === categories?.find(c => c.id === selectedCategory)?.parentId)?.name})
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
