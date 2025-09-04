import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InvitationsTable } from "@/components/admin/invitations-table";

export default async function InvitationsPage() {
  const session = await auth();

  // Protect the page, only admins can access
  if (session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Invitations</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage pending user invitations. View who has been invited and track their acceptance status.
          </p>
        </div>
      </div>
      <InvitationsTable />
    </div>
  );
}
