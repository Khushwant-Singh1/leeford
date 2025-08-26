"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

export type CartItem = {
  id: string
  name: string
  price: number
  originalPrice?: number
  quantity: number
  color: string
  size: string
  image: string
}

interface MiniCartProps {
  isOpen: boolean
  onClose: () => void
  cartItems: CartItem[]
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
}

export default function MiniCart({ isOpen, onClose, cartItems, removeFromCart, updateQuantity }: MiniCartProps) {
  const [mounted, setMounted] = useState(false)

  // Prevent hydration errors
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close cart on escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  if (!mounted) return null

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 md:inset-y-14 md:inset-x-auto md:top-14 md:right-4 md:left-auto md:h-5/6 md:w-full md:max-w-md bg-white shadow-xl z-50 overflow-hidden md:rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-center p-4 md:p-6 border-b">
                <h2 className="text-base md:text-xl font-medium">You have {cartItems.length} items in your cart</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close cart"
                >
                  <X className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </div>

              {/* Cart Items */}
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-grow py-12 px-6">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
                  <p className="text-gray-500 text-center mb-6">
                    Looks like you haven't added anything to your cart yet.
                  </p>
                  <Button className="bg-[#a08452] hover:bg-[#8c703d] text-white px-8" onClick={onClose}>
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
                    {cartItems.map((item) => (
                      <div key={item.id} className="pb-4 md:pb-6 border-b border-gray-200">
                        <div className="flex gap-4">
                          <div className="w-[80px] h-[100px] md:w-[100px] md:h-[120px] relative flex-shrink-0 rounded-md overflow-hidden">
                            <Image
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm md:text-base font-medium truncate">{item.name}</h3>
                            <div className="flex items-center mt-1">
                              <span className="text-sm md:text-base font-medium">₹{item.price.toFixed(2)}</span>
                              {item.originalPrice && (
                                <span className="ml-2 text-gray-500 line-through text-xs">
                                  ₹{item.originalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 space-y-1">
                              <p className="text-gray-600 text-xs">Size: {item.size}</p>
                              <p className="text-gray-600 text-xs">Qty: {item.quantity.toString().padStart(2, "0")}</p>
                              <p className="text-gray-600 text-xs">Color: {item.color}</p>
                            </div>

                            <div className="flex justify-between items-center mt-3">
                              <div className="flex items-center border border-gray-300 rounded">
                                <button
                                  className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                  aria-label="Decrease quantity"
                                >
                                  −
                                </button>
                                <input
                                  type="text"
                                  value={item.quantity.toString().padStart(2, "0")}
                                  readOnly
                                  className="w-6 md:w-8 text-center py-1 border-x border-gray-300 text-xs"
                                  aria-label="Quantity"
                                />
                                <button
                                  className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  aria-label="Increase quantity"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:text-red-600 transition-colors"
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart Footer */}
                  <div className="border-t p-4 md:p-6 bg-gray-50">
                    <div className="flex justify-between text-base md:text-lg font-medium mb-4">
                      <span>Subtotal</span>
                      <span>₹{calculateTotal().toFixed(0)}</span>
                    </div>

                    <div className="space-y-3">
                      <Link
                        href="/cart"
                        className="block w-full py-2 text-center border border-[#a08452] text-[#a08452] rounded-md font-medium hover:bg-[#a08452]/5 transition-colors text-sm md:text-base"
                        onClick={onClose}
                      >
                        View Cart
                      </Link>
                      <Link href="/checkout" onClick={onClose} className="block w-full">
                        <Button className="w-full bg-[#a08452] hover:bg-[#8c703d] text-white py-2 rounded-md transition-colors text-sm md:text-base">
                          Checkout
                        </Button>
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}