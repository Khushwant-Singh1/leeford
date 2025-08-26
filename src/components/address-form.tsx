"use client"
import { useState } from "react"
import type React from "react"

import { ChevronDown } from "lucide-react"

export default function AddressForm() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    flat: "",
    area: "",
    city: "",
    pincode: "",
    state: "",
    isDefault: false,
  })

  const [errors, setErrors] = useState({
    name: "",
    mobile: "",
    flat: "",
    area: "",
    city: "",
    pincode: "",
    state: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, isDefault: e.target.checked }))
  }

  const validateForm = () => {
    let valid = true
    const newErrors = { ...errors }

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
      valid = false
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required"
      valid = false
    } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number"
      valid = false
    }

    if (!formData.flat.trim()) {
      newErrors.flat = "Flat/House no. is required"
      valid = false
    }

    if (!formData.area.trim()) {
      newErrors.area = "Area/Street is required"
      valid = false
    }

    if (!formData.city) {
      newErrors.city = "Please select a city"
      valid = false
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required"
      valid = false
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = "Please enter a valid 6-digit pincode"
      valid = false
    }

    if (!formData.state) {
      newErrors.state = "Please select a state"
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      // Submit form data
      console.log("Form submitted:", formData)
      // Reset form after submission
      setFormData({
        name: "",
        mobile: "",
        flat: "",
        area: "",
        city: "",
        pincode: "",
        state: "",
        isDefault: false,
      })
    }
  }

  return (
    <div>
      <h2 className="text-lg font-medium mb-6">Add a new address</h2>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter Name"
              className={`w-full px-4 py-3 border ${errors.name ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-1 focus:ring-[#795d2a]`}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-xs text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="mobile" className="block text-sm font-medium mb-1">
              Mobile Number
            </label>
            <input
              type="tel"
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Enter Mobile Number"
              className={`w-full px-4 py-3 border ${errors.mobile ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-1 focus:ring-[#795d2a]`}
              aria-invalid={errors.mobile ? "true" : "false"}
              aria-describedby={errors.mobile ? "mobile-error" : undefined}
            />
            {errors.mobile && (
              <p id="mobile-error" className="mt-1 text-xs text-red-500">
                {errors.mobile}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="flat" className="block text-sm font-medium mb-1">
              Flat, House no., Apartment
            </label>
            <input
              type="text"
              id="flat"
              name="flat"
              value={formData.flat}
              onChange={handleChange}
              className={`w-full px-4 py-3 border ${errors.flat ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-1 focus:ring-[#795d2a]`}
              aria-invalid={errors.flat ? "true" : "false"}
              aria-describedby={errors.flat ? "flat-error" : undefined}
            />
            {errors.flat && (
              <p id="flat-error" className="mt-1 text-xs text-red-500">
                {errors.flat}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="area" className="block text-sm font-medium mb-1">
              Area, Street, Village
            </label>
            <input
              type="text"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              className={`w-full px-4 py-3 border ${errors.area ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-1 focus:ring-[#795d2a]`}
              aria-invalid={errors.area ? "true" : "false"}
              aria-describedby={errors.area ? "area-error" : undefined}
            />
            {errors.area && (
              <p id="area-error" className="mt-1 text-xs text-red-500">
                {errors.area}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium mb-1">
              City
            </label>
            <div className="relative">
              <select
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${errors.city ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-1 focus:ring-[#795d2a] appearance-none`}
                aria-invalid={errors.city ? "true" : "false"}
                aria-describedby={errors.city ? "city-error" : undefined}
              >
                <option value="">Select City</option>
                <option value="delhi">Delhi</option>
                <option value="mumbai">Mumbai</option>
                <option value="bangalore">Bangalore</option>
                <option value="chennai">Chennai</option>
                <option value="kolkata">Kolkata</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.city && (
              <p id="city-error" className="mt-1 text-xs text-red-500">
                {errors.city}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="pincode" className="block text-sm font-medium mb-1">
              Pincode
            </label>
            <input
              type="text"
              id="pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder="Enter Pin Code"
              className={`w-full px-4 py-3 border ${errors.pincode ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-1 focus:ring-[#795d2a]`}
              aria-invalid={errors.pincode ? "true" : "false"}
              aria-describedby={errors.pincode ? "pincode-error" : undefined}
            />
            {errors.pincode && (
              <p id="pincode-error" className="mt-1 text-xs text-red-500">
                {errors.pincode}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="state" className="block text-sm font-medium mb-1">
              State
            </label>
            <div className="relative">
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${errors.state ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-1 focus:ring-[#795d2a] appearance-none`}
                aria-invalid={errors.state ? "true" : "false"}
                aria-describedby={errors.state ? "state-error" : undefined}
              >
                <option value="">Select State</option>
                <option value="delhi">Delhi</option>
                <option value="maharashtra">Maharashtra</option>
                <option value="karnataka">Karnataka</option>
                <option value="tamil-nadu">Tamil Nadu</option>
                <option value="west-bengal">West Bengal</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
            {errors.state && (
              <p id="state-error" className="mt-1 text-xs text-red-500">
                {errors.state}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <div className="relative flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="default-address"
                  name="default-address"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-gray-300 text-[#795d2a] focus:ring-[#795d2a]"
                />
              </div>
              <div className="ml-2 text-sm">
                <label htmlFor="default-address" className="font-medium text-gray-700">
                  Use as my default address
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-[#a08452] hover:bg-[#8c703d] text-white rounded"
            >
              Add New Address
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

