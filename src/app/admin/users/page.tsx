import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

import UsersTable from "@/components/admin/users-table";

export default async function UsersPage() {
  const session = await auth();

  // Protect the page, only admins can access
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all the users in the system including their name, email, and role.
          </p>
        </div>
      </div>
      <UsersTable />
    </div>
  );
}
