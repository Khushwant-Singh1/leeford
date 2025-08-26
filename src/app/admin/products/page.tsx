import Link from "next/link"
import { Plus } from "lucide-react"
import { ProductsTable } from "@/components/admin/products-table"

export default function ProductsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#1c1c1c]">Products</h1>
        <Link
          href="/admin/products/add"
          className="flex items-center gap-2 px-4 py-2 bg-[#4f507f] text-white rounded-md hover:bg-[#3e3f63] transition-colors"
        >
          <Plus size={16} />
          <span>Add Product</span>
        </Link>
      </div>
      <ProductsTable />
    </div>
  )
}

