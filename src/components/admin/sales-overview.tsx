"use client"
import { DollarSign, TrendingUp, ShoppingCart, Users } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

export interface SalesOverview {
  totalRevenue: number
  salesGrowth: number
  totalOrders: number
  newCustomers: number
}

const fetchSalesOverview = async (): Promise<SalesOverview> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sales/all-time`)
  if (!response.ok) {
    throw new Error("Failed to fetch sales overview")
  }
  return response.json()
}

export function SalesOverview() {
  // Fetch sales overview
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ["salesOverview"],
    queryFn: fetchSalesOverview,
  })

  if (isLoading) {
    return <div className="text-center p-6">Loading...</div>
  }

  if (error) {
    return <div className="text-center p-6 text-red-500">Error fetching sales overview.</div>
  }

  const metricData = [
    {
      title: "Total Revenue",
      value: `$${metrics?.totalRevenue?.toLocaleString() ?? "0"}`,
      icon: DollarSign,
      changeType: "positive",
    },
    {
      title: "Sales Growth",
      value: `${metrics?.salesGrowth?.toFixed(2) ?? "0.00"}%`,
      icon: TrendingUp,
      change: (metrics?.salesGrowth ?? 0) > 0 ? `+${(metrics?.salesGrowth ?? 0).toFixed(2)}%` : `${(metrics?.salesGrowth ?? 0).toFixed(2)}%`,
      changeType:( metrics?.salesGrowth ?? 0)> 0 ? "positive" : "negative",
    },
    {
      title: "Total Orders",
      value: metrics?.totalOrders.toLocaleString(),
      icon: ShoppingCart,
      changeType: "positive",
    },
    {
      title: "Total Customers",
      value: metrics?.newCustomers.toLocaleString(),
      icon: Users,
      changeType: "positive",
    },
  ]

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-medium mb-4 text-[#4f507f]">Sales Overview</h2>
      <div className="grid grid-cols-2 gap-4">
        {metricData.map((metric, index) => (
          <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 mr-4">
              <metric.icon className="h-8 w-8 text-[#4f507f]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{metric.title}</p>
              <p className="text-2xl font-semibold text-gray-900">{metric.value}</p>
              <p className={`text-sm ${metric.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                {metric.change}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}