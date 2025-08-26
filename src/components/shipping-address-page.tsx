"use client"
import { useState } from "react"
import { Check } from "lucide-react"
import AddressForm from "./address-form"
import OrderSummary from "./order-summary"
import Navbar from "@/components/navbar"
import SiteFooter from "@/components/site-footer"
import Link from "next/link"

export default function ShippingAddressPage() {
  const [selectedAddress, setSelectedAddress] = useState<string>("1")

  const addresses = [
    {
      id: "1",
      name: "Abhishek Chaudhary",
      address: "204/2c & d , basement, jeewan nagar, New Delhi 110014",
    },
    {
      id: "2",
      name: "Abhishek Chaudhary",
      address: "204/2c & d , basement, jeewan nagar, New Delhi 110014",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-medium mb-8">Shipping Address</h1>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-10 max-w-xl">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-[#795d2a] text-white flex items-center justify-center mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <span className="text-xs">Address</span>
            </div>

            <div className="flex-1 border-t border-dashed border-gray-300 mx-2"></div>

            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
              </div>
              <span className="text-xs">Payment Method</span>
            </div>

            <div className="flex-1 border-t border-dashed border-gray-300 mx-2"></div>

            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <span className="text-xs">Review</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              {/* Select a delivery address */}
              <div className="mb-10">
                <h2 className="text-lg font-medium mb-2">Select a delivery address</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Is the address you'd like to use displayed below? If so, click the corresponding "Deliver to this
                  address" button. Or you can enter a new delivery address.
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-4 rounded-md ${selectedAddress === address.id ? "bg-[#ffefd4]" : "bg-[#fff8ea]"}`}
                    >
                      <div className="flex justify-between mb-2">
                        <h3 className="font-medium">{address.name}</h3>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            selectedAddress === address.id
                              ? "border-[#795d2a] bg-[#795d2a] text-white"
                              : "border-gray-300"
                          }`}
                          onClick={() => setSelectedAddress(address.id)}
                        >
                          {selectedAddress === address.id && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{address.address}</p>
                      <div className="flex gap-2">
                        <button className="px-4 py-1 text-sm border border-[#795d2a] text-[#795d2a] rounded flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Edit
                        </button>
                        <button className="px-4 py-1 text-sm border border-[#795d2a] text-[#795d2a] rounded flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-1"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <Link href="/payment">
                  <button className="w-full md:w-auto mt-6 px-6 py-3 bg-[#a08452] hover:bg-[#8c703d] text-white rounded">
                    Deliver Here
                  </button>
                </Link>
              </div>

              {/* Add a new address */}
              <AddressForm />
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-80 shrink-0">
              <OrderSummary />
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

