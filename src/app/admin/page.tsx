import { DashboardHeader } from "@/components/admin/dashboard-header";
import { ProductOverview } from "@/components/admin/product-overview";
import { RecentOrders } from "@/components/admin/recent-orders";
import { TopSellingProducts } from "@/components/admin/top-selling-products";
import { InventoryAlerts } from "@/components/admin/inventory-alerts";

export default function AdminDashboard() {
  return (
      <div className="p-6">
        <DashboardHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <ProductOverview />
          <InventoryAlerts />

        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <TopSellingProducts />
          <RecentOrders />
        </div>
      </div>
  );
}
