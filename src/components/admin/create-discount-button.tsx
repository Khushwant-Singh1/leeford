"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DiscountModal } from "./discount-modal"

interface CreateDiscountButtonProps {
  onSuccess?: () => void;
}

export function CreateDiscountButton({ onSuccess }: CreateDiscountButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2"
        type="button"
      >
        <Plus size={16} />
        Create Discount
      </Button>

      <DiscountModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          onSuccess?.()
          setIsModalOpen(false)
        }}
      />
    </>
  )
}
