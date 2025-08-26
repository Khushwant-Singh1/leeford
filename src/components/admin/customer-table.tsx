"use client"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Eye, Mail, Phone } from "lucide-react"
import { mockCustomers } from "@/lib/mockData"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  orders: number
  totalSpent: number
}

export function CustomerTable() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: () => Promise.resolve(mockCustomers as Customer[]),
  });

  if (isLoading) return <div>Loading customers...</div>;
  if (!customers) return <div>No customers found</div>;

  const customerList = customers;

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Orders
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Spent
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {customerList.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {customer.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {customer.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {customer.phone}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {customer.orders}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${customer.totalSpent.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => setSelectedCustomer(customer)}
                  className="text-indigo-600 hover:text-indigo-900"
                  title="View Details"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedCustomer && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
          onClick={() => setSelectedCustomer(null)}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Customer Details
              </h3>
              <div className="mt-2 px-7 py-3">
                <div className="flex items-center mb-2">
                  <Mail className="h-5 w-5 text-gray-500 mr-2" />
                  <p className="text-sm text-gray-500">
                    {selectedCustomer.email}
                  </p>
                </div>
                <div className="flex items-center mb-2">
                  <Phone className="h-5 w-5 text-gray-500 mr-2" />
                  <p className="text-sm text-gray-500">
                    {selectedCustomer.phone}
                  </p>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Total Orders:</span>{' '}
                    {selectedCustomer.orders}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Total Spent:</span> $
                    {selectedCustomer.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
