"use client"

import { useState, useEffect } from "react"
import { Edit, Trash2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Discount, DiscountType } from "@prisma/client"
import { DiscountModal } from "./discount-modal"

interface DiscountWithRelations extends Discount {
  products: { productId: string }[]
  categories: { categoryId: string }[]
  _count?: { userUsages: number }
}

export function DiscountList() {
  const [discounts, setDiscounts] = useState<DiscountWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountWithRelations | null>(null)
  const { toast } = useToast()

  const fetchDiscounts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/discounts')
      if (!res.ok) throw new Error('Failed to fetch discounts')
      setDiscounts(await res.json())
    } catch (error) {
      console.error('Error:', error)
      toast({ title: 'Error', description: 'Failed to load discounts', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDiscounts() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return
    try {
      const res = await fetch(`/api/discounts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete discount')
      toast({ title: 'Success', description: 'Discount deleted' })
      fetchDiscounts()
    } catch (error) {
      console.error('Error:', error)
      toast({ title: 'Error', description: 'Failed to delete discount', variant: 'destructive' })
    }
  }

  const toggleStatus = async (discount: DiscountWithRelations) => {
    try {
      const res = await fetch(`/api/discounts/${discount.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !discount.isActive }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast({ title: 'Success', description: 'Status updated' })
      fetchDiscounts()
    } catch (error) {
      console.error('Error:', error)
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => {
          setSelectedDiscount(null)
          setIsModalOpen(true)
        }}>
          Create Discount
        </Button>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valid Until</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discounts.map((discount) => (
                <tr key={discount.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {discount.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {discount.discountType === DiscountType.PERCENTAGE ? 'Percentage' : 'Fixed Amount'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {discount.discountType === DiscountType.PERCENTAGE 
                      ? `${discount.discountValue}%` 
                      : `₹${discount.discountValue}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(discount.validTo), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                        discount.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => toggleStatus(discount)}
                    >
                      {discount.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => {
                        setSelectedDiscount(discount)
                        setIsModalOpen(true)
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(discount.id)} 
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DiscountModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        // FIX: Convert null to undefined to match the expected prop type
        discount={selectedDiscount || undefined}
        onSuccess={fetchDiscounts}
      />
    </div>
  )
}
