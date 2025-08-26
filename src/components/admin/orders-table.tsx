"use client"

import { useState } from "react"
import { Eye, Truck, CheckCircle, X } from "lucide-react"

const initialOrders = [
  {
    id: "1234",
    customer: "John Doe",
    date: "2023-06-01",
    total: 99.99,
    status: "Pending",
    items: [
      { name: "Product A", quantity: 2 },
      { name: "Product B", quantity: 1 },
    ],
  },
  {
    id: "1235",
    customer: "Jane Smith",
    date: "2023-06-02",
    total: 149.99,
    status: "Shipped",
    items: [{ name: "Product C", quantity: 3 }],
  },
  {
    id: "1236",
    customer: "Bob Johnson",
    date: "2023-06-03",
    total: 79.99,
    status: "Delivered",
    items: [
      { name: "Product D", quantity: 1 },
      { name: "Product E", quantity: 2 },
    ],
  },
  {
    id: "1237",
    customer: "Alice Brown",
    date: "2023-06-04",
    total: 199.99,
    status: "Pending",
    items: [{ name: "Product F", quantity: 4 }],
  },
  {
    id: "1238",
    customer: "Charlie Davis",
    date: "2023-06-05",
    total: 59.99,
    status: "Shipped",
    items: [{ name: "Product G", quantity: 1 }],
  },
]

interface Order {
  id: string
  customer: string
  date: string
  total: number
  status: string
  items: Item[]
}

interface Item {
  name: string
  quantity: number
}

export function OrdersTable() {
  const [orders, setOrders] = useState(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Shipped":
        return "bg-blue-100 text-blue-800"
      case "Delivered":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleShip = (id: string) => {
    setOrders(orders.map((order) => (order.id === id ? { ...order, status: "Shipped" } : order)))
  }

  const handleDeliver = (id: string) => {
    setOrders(orders.map((order) => (order.id === id ? { ...order, status: "Delivered" } : order)))
  }

  const handleCancel = (id: string) => {
    setOrders(orders.map((order) => (order.id === id ? { ...order, status: "Cancelled" } : order)))
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.total.toFixed(2)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onClick={() => setSelectedOrder(order)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                  <Eye size={18} />
                </button>
                {order.status === "Pending" && (
                  <button onClick={() => handleShip(order.id)} className="text-blue-600 hover:text-blue-900 mr-4">
                    <Truck size={18} />
                  </button>
                )}
                {order.status === "Shipped" && (
                  <button onClick={() => handleDeliver(order.id)} className="text-green-600 hover:text-green-900 mr-4">
                    <CheckCircle size={18} />
                  </button>
                )}
                {(order.status === "Pending" || order.status === "Shipped") && (
                  <button onClick={() => handleCancel(order.id)} className="text-red-600 hover:text-red-900">
                    <X size={18} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedOrder && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Order Details</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">Order ID: {selectedOrder.id}</p>
                <p className="text-sm text-gray-500">Customer: {selectedOrder.customer}</p>
                <p className="text-sm text-gray-500">Date: {selectedOrder.date}</p>
                <p className="text-sm text-gray-500">Total: ${selectedOrder.total.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Status: {selectedOrder.status}</p>
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-900">Items:</h4>
                  <ul className="list-disc list-inside">
                    {selectedOrder.items.map((item: Item, index: number) => (
                      <li key={index} className="text-sm text-gray-500">
                        {item.name} (x{item.quantity})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

