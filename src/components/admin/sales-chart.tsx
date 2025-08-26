"use client";

import { ProductPerformanceApi } from "@/lib/api/productperformance";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ProductPerformance } from "./product-performance-table";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Define types
interface Sale {
  date: string;
  totalOrders: number;
}

interface Product {
  id: string;
  name: string;
  sales: Sale[];
}

interface MonthlySalesData {
  name: string;
  sales: number;
}

export function SalesChart() {
  // Fetch products using React Query
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["productPerformance"],
    queryFn: async () => {
      try {
        const rawData: ProductPerformance[] = await ProductPerformanceApi.getAll();
        const data: Product[] = rawData.map((item) => ({
          id: item.id,
          name: item.name,
          sales: Array.isArray(item.sales)
            ? item.sales.filter((sale): sale is Sale => sale && typeof sale === "object" && "date" in sale && "totalOrders" in sale)
            : [], // If sales is invalid, return an empty array
        }));
        console.log("Fetched products:", data);
        return data;
      } catch (error) {
        console.error("Error fetching products:", error);
        return [];
      }
    },
  });

  // Aggregate sales data by month
  const monthlySales: MonthlySalesData[] = products
    .flatMap((product) => product.sales || []) // Ensure sales is always an array
    .reduce((acc: MonthlySalesData[], sale: Sale) => {
      if (!sale.date) return acc; // Skip invalid data
      const monthIndex = new Date(sale.date).getMonth();
      const monthName = monthNames[monthIndex];

      const existingMonth = acc.find((item) => item.name === monthName);
      if (existingMonth) {
        existingMonth.sales += sale.totalOrders;
      } else {
        acc.push({ name: monthName, sales: sale.totalOrders });
      }

      return acc;
    }, []);

  console.log("Monthly Sales:", monthlySales);

  const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "Monthly" | "Yearly">("Monthly");

  const tabs: ("Daily" | "Weekly" | "Monthly" | "Yearly")[] = ["Daily", "Weekly", "Monthly", "Yearly"];

  // ✅ Empty Data Handling: Ensure chart is always rendered
  const chartData = monthlySales.length > 0 ? monthlySales : monthNames.map((month) => ({ name: month, sales: 0 }));

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-[#4f507f]">Sales Trend</h2>
        <div className="flex space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-3 py-1 text-sm rounded-md ${
                activeTab === tab ? "bg-[#4f507f] text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#4f507f" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
