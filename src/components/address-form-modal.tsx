"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface AddressFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (addressData: any) => void
}

export default function AddressFormModal({ isOpen, onClose, onSubmit }: AddressFormModalProps) {
  const [isDefaultAddress, setIsDefaultAddress] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Get form data
    const formData = new FormData(e.target as HTMLFormElement)
    const addressData = {
      name: formData.get("name"),
      mobile: formData.get("mobile"),
      building: formData.get("building"),
      area: formData.get("area"),
      city: formData.get("city"),
      pincode: formData.get("pincode"),
      state: formData.get("state"),
      isDefault: isDefaultAddress,
    }

    onSubmit(addressData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-md max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-medium mb-6">Enter a New Address</h2>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter Name"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#a08452]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mobile Number</label>
              <input
                type="tel"
                name="mobile"
                placeholder="Enter Your Mobile Number"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#a08452]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Flat, House No, Building, Company, Apartment</label>
              <input
                type="text"
                name="building"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#a08452]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Area, Colony, Street, Sector, Village</label>
              <input
                type="text"
                name="area"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#a08452]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <select
                name="city"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#a08452] appearance-none"
                required
              >
                <option value="">Select City</option>
                <option value="delhi">Delhi</option>
                <option value="mumbai">Mumbai</option>
                <option value="bangalore">Bangalore</option>
                <option value="chennai">Chennai</option>
                <option value="kolkata">Kolkata</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pin Code</label>
              <input
                type="text"
                name="pincode"
                placeholder="Enter Pin Code"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#a08452]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <select
                name="state"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#a08452] appearance-none"
                required
              >
                <option value="">Select State</option>
                <option value="delhi">Delhi</option>
                <option value="maharashtra">Maharashtra</option>
                <option value="karnataka">Karnataka</option>
                <option value="tamil-nadu">Tamil Nadu</option>
                <option value="west-bengal">West Bengal</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="default-address" checked={isDefaultAddress} onCheckedChange={setIsDefaultAddress} />
              <label htmlFor="default-address" className="text-sm cursor-pointer">
                Use as My Default Address
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1 bg-[#a08452] hover:bg-[#8c703d] text-white py-3">
                Add New Address
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-gray-300 hover:bg-gray-50 py-3"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

