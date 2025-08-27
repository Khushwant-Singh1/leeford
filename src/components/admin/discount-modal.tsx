"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DiscountForm } from "./discount-form";
import { Discount } from "@prisma/client";

interface DiscountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount?: Discount & {
    products: { productId: string }[];
    categories: { categoryId: string }[];
  };
  onSuccess?: () => void;
}

export function DiscountModal({ 
  open, 
  onOpenChange, 
  discount,
  onSuccess 
}: DiscountModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
    if (onSuccess) onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {discount ? 'Edit Discount' : 'Create New Discount'}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <DiscountForm 
            discount={discount} 
            onSuccess={handleSuccess} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
