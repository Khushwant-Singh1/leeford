"use client"

import type React from "react"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "@/components/admin/sidebar"
// import { NotificationSidebar } from "@/components/admin/notification-sidebar"
import { Bell, Loader2 } from "lucide-react"
import QueryProvider from "@/lib/queryclient"
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isNotificationSidebarOpen, setIsNotificationSidebarOpen] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/login")
      return
    }

    if (session.user?.role !== "ADMIN") {
      router.push("/unauthorized")
      return
    }
  }, [session, status, router])

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!session || session.user?.role !== "ADMIN") {
    return null
  }

  return (
    <QueryProvider>
    <div className="flex min-h-screen bg-[#f9f9fa]">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsNotificationSidebarOpen(!isNotificationSidebarOpen)}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          >
            <Bell size={20} />
          </button>
        </div>
        {children}
      </main>
      {/* <NotificationSidebar isOpen={isNotificationSidebarOpen} onClose={() => setIsNotificationSidebarOpen(false)} /> */}
    </div>
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryProvider>
  )
}
