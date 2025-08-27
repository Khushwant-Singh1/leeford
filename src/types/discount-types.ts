import { Discount, DiscountType, DiscountApplicability } from "@prisma/client";

export interface CreateDiscountInput {
  name: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  applicability: DiscountApplicability;
  minimumPurchase?: number;
  maximumDiscount?: number;
  validFrom: Date | string;
  validTo: Date | string;
  usageLimit?: number;
  minQuantity?: number;
  newDaysThreshold?: number;
  productIds?: string[];
  categoryIds?: string[];
}

export interface UpdateDiscountInput extends Partial<CreateDiscountInput> {
  isActive?: boolean;
}

export interface DiscountResponse extends Omit<Discount, 'validFrom' | 'validTo'> {
  validFrom: string;
  validTo: string;
  products: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

export interface ValidateDiscountInput {
  code: string;
  productIds?: string[];
  categoryIds?: string[];
  userId?: string;
  subtotal: number;
  quantity?: number;
}
