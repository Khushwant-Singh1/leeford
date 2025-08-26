"use client"
import { useState } from "react"

export default function OrderSummary() {
  const [discountCode, setDiscountCode] = useState("")
  const [isDiscountApplied, setIsDiscountApplied] = useState(false)

  const subtotal = 10470
  const deliveryCharge = 70
  const discount = isDiscountApplied ? 0 : 0 // You can implement discount logic here
  const grandTotal = subtotal + deliveryCharge - discount

  const handleApplyDiscount = () => {
    if (discountCode.trim()) {
      setIsDiscountApplied(true)
      // Implement discount logic here
    }
  }

  return (
    <div className="border rounded-md p-6 bg-white sticky top-4">
      <h2 className="text-lg font-medium mb-4">Subtotal</h2>

      <div className="space-y-4">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-medium">₹{subtotal.toLocaleString()}</span>
        </div>

        <div>
          <p className="mb-2 text-sm">Enter Discount Code</p>
          <div className="flex">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="FLAT50"
              className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none text-sm"
            />
            <button
              className="bg-[#a08452] hover:bg-[#8c703d] text-white px-4 py-2 rounded-r-md text-sm"
              onClick={handleApplyDiscount}
            >
              Apply
            </button>
          </div>
        </div>

        <div className="flex justify-between">
          <span>Delivery Charge</span>
          <span className="font-medium">₹{deliveryCharge}</span>
        </div>

        {isDiscountApplied && discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span className="font-medium">-₹{discount}</span>
          </div>
        )}

        <div className="pt-4 border-t">
          <div className="flex justify-between text-lg font-medium">
            <span>Grand Total</span>
            <span>₹{grandTotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

