"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react"
import { useCart } from "@/context/cart-context"
import MiniCart from "@/components/mini-cart"

export default function Navbar() {
  const cartContext = useCart()
  const cartItems = cartContext?.cartItems || []
  const cartCount = cartContext?.cartCount || 0
  const removeFromCart = cartContext?.removeFromCart || ((id: string) => {})
  const updateQuantity = cartContext?.updateQuantity || ((id: string, quantity: number) => {})

  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const toggleMiniCart = () => {
    setIsMiniCartOpen(!isMiniCartOpen)
    if (!isMiniCartOpen) {
      setIsMobileMenuOpen(false) // Close mobile menu if opening cart
    }
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    if (!isMobileMenuOpen) {
      setIsMiniCartOpen(false) // Close cart if opening mobile menu
    }
  }

  return (
    <header
      className={`sticky top-0 z-40 bg-white transition-shadow duration-300 ${isScrolled ? "shadow-md" : "border-b border-gray-100"}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="block">
              <Image
                src="https://res.cloudinary.com/dklqhgo8r/image/upload/v1741713365/omez9tvbpnwgmsnj3q3w.png"
                alt="RAAS The Creation Logo"
                width={120}
                height={50}
                className="h-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1">
            <ul className="flex space-x-8 lg:space-x-12">
              <li>
                <Link href="/" className="text-sm font-medium tracking-wide hover:text-[#a08452] transition-colors">
                  HOME
                </Link>
              </li>
              <li>
                <Link href="/shop" className="text-sm font-medium tracking-wide hover:text-[#a08452] transition-colors">
                  SHOP
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm font-medium tracking-wide hover:text-[#a08452] transition-colors"
                >
                  ABOUT
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm font-medium tracking-wide hover:text-[#a08452] transition-colors"
                >
                  CONTACT
                </Link>
              </li>
            </ul>
          </nav>

          {/* Icons */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              aria-label="Search"
              className="focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link
              href="/account/wishlists"
              aria-label="Wishlist"
              className="focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Heart className="h-5 w-5" />
            </Link>
            <button
              aria-label="Cart"
              className="focus:outline-none relative p-1 rounded-full hover:bg-gray-100 transition-colors"
              onClick={toggleMiniCart}
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#a08452] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <Link
              href="/account/orders"
              aria-label="Account"
              className="focus:outline-none p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-3">
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="block py-2 text-sm font-medium hover:text-[#a08452] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  HOME
                </Link>
              </li>
              <li>
                <Link
                  href="/shop"
                  className="block py-2 text-sm font-medium hover:text-[#a08452] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  SHOP
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="block py-2 text-sm font-medium hover:text-[#a08452] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ABOUT
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="block py-2 text-sm font-medium hover:text-[#a08452] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  CONTACT
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Mini Cart */}
      <MiniCart
        isOpen={isMiniCartOpen}
        onClose={() => setIsMiniCartOpen(false)}
        cartItems={cartItems}
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
      />
    </header>
  )
}

