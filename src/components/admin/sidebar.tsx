"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  Home,
  ShoppingCart,
  Package,
  BarChart2,
  Tag,
  Layers,
  Plus,
  List,
  Grid,
  TrendingUp,
  Users,
  MessageSquare,
  LogOut,
} from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <div className="w-[220px] bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2 font-semibold">
        <span className="h-6 w-6 rounded-full bg-[#4f507f]"></span>
        <span>Leeford</span>
      </div>

      <div className="p-4">
        <div className="text-sm text-gray-500 mb-2">Main</div>
        <div className="space-y-1">
          <NavItem href="/admin" icon={<Home size={18} />} label="Dashboard" active={isActive("/admin")} />
          <NavItem
            href="/admin/products"
            icon={<Package size={18} />}
            label="Products"
            active={isActive("/admin/products")}
          />
          <NavItem
            href="/admin/orders"
            icon={<ShoppingCart size={18} />}
            label="Orders"
            active={isActive("/admin/orders")}
          />
        </div>
      </div>

      <div className="p-4">
        <div className="text-sm text-gray-500 mb-2">Products</div>
        <div className="space-y-1">
          <NavItem
            href="/admin/products"
            icon={<Grid size={18} />}
            label="All Products"
            active={isActive("/admin/products")}
          />
          <NavItem
            href="/admin/products/add"
            icon={<Plus size={18} />}
            label="Add Product"
            active={isActive("/admin/products/add")}
          />
          <NavItem
            href="/admin/products/categories"
            icon={<Tag size={18} />}
            label="Categories"
            active={isActive("/admin/products/categories")}
          />
          <NavItem
            href="/admin/products/inventory"
            icon={<Layers size={18} />}
            label="Inventory"
            active={isActive("/admin/products/inventory")}
          />
        </div>
      </div>

      <div className="p-4">
        <div className="text-sm text-gray-500 mb-2">Orders</div>
        <div className="space-y-1">
          <NavItem
            href="/admin/orders"
            icon={<List size={18} />}
            label="All Orders"
            active={isActive("/admin/orders")}
          />
        </div>
      </div>

      <div className="p-4">
        <div className="text-sm text-gray-500 mb-2">Customers</div>
        <div className="space-y-1">
          <NavItem
            href="/admin/customers"
            icon={<Users size={18} />}
            label="All Customers"
            active={isActive("/admin/customers")}
          />
          <NavItem
            href="/admin/users"
            icon={<Users size={18} />}
            label="User Management"
            active={isActive("/admin/users")}
          />
          <NavItem
            href="/admin/testimonials"
            icon={<Plus size={18} />}
            label="Add Testimonial"
            active={isActive("/admin/testimonials")}
          />
        </div>
      </div>

      <div className="p-4">
        <div className="text-sm text-gray-500 mb-2">Analytics</div>
        <div className="space-y-1">
          <NavItem
            href="/admin/analytics/sales"
            icon={<BarChart2 size={18} />}
            label="Sales Performance"
            active={isActive("/admin/analytics/sales")}
          />
          <NavItem
            href="/admin/analytics/products"
            icon={<TrendingUp size={18} />}
            label="Product Performance"
            active={isActive("/admin/analytics/products")}
          />
        </div>
      </div>

      <div className="p-4">
        <div className="text-sm text-gray-500 mb-2">Communication</div>
        <div className="space-y-1">
          <NavItem
            href="/admin/contacts"
            icon={<MessageSquare size={18} />}
            label="Contacts"
            active={isActive("/admin/contacts")}
          />
        </div>
      </div>

      {/* <div className="p-4">
        <div className="text-sm text-gray-500 mb-2">Monitoring</div>
        <div className="space-y-1">
          <NavItem
            href="/admin/activity"
            icon={<Activity size={18} />}
            label="Activity Feed"
            active={isActive("/admin/activity")}
          />
        </div>
      </div> */}

      {/* <div className="p-4">
        <div className="text-sm text-gray-500 mb-2">Marketing</div>
        <div className="space-y-1">
          <NavItem
            href="/admin/discounts"
            icon={<Percent size={18} />}
            label="Discounts & Coupons"
            active={isActive("/admin/discounts")}
          />
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-gray-200">
        <NavItem
          href="/admin/settings"
          icon={<Settings size={18} />}
          label="Settings"
          active={isActive("/admin/settings")}
        />
      </div> */}
      <div className="mt-auto p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm w-full text-gray-700 hover:bg-gray-100"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

function NavItem({
  href,
  icon,
  label,
  active = false,
}: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${active ? "bg-[#edeefc] text-[#4f507f] font-medium" : "text-gray-700 hover:bg-gray-100"}`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

