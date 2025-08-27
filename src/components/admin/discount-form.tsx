"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Discount, DiscountType, DiscountApplicability, Product, Category } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";

// Extend the Discount type to include relations
type DiscountWithRelations = Discount & {
  products: { productId: string }[];
  categories: { categoryId: string }[];
};

// Form validation schema
const discountFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  discountType: z.nativeEnum(DiscountType),
  discountValue: z.number().min(0.01, "Value must be greater than 0"),
  applicability: z.nativeEnum(DiscountApplicability),
  minimumPurchase: z.number().min(0).optional(),
  maximumDiscount: z.number().min(0).optional(),
  validFrom: z.date(),
  validTo: z.date(),
  usageLimit: z.number().int().min(1).optional(),
  isActive: z.boolean(),
  productIds: z.array(z.string()),
  categoryIds: z.array(z.string()),
});

type DiscountFormValues = z.infer<typeof discountFormSchema>;

interface DiscountFormProps {
  discount?: DiscountWithRelations;
  onSuccess?: () => void;
}

// Reusable Multi-Select Combobox Component
interface MultiSelectComboboxProps {
  control: Control<DiscountFormValues>;
  name: keyof Pick<DiscountFormValues, "productIds" | "categoryIds">;
  label: string;
  options: { value: string; label: string }[];
  isLoading?: boolean;
}

function MultiSelectCombobox({ control, name, label, options, isLoading }: MultiSelectComboboxProps) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field }) => {
                const selectedValues = new Set(field.value);
                const selectedOptions = options.filter(opt => selectedValues.has(opt.value));

                return (
                    <div className="space-y-2">
                        <Label>{label}</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between font-normal h-auto"
                                >
                                    <div className="flex gap-1 flex-wrap">
                                        {selectedOptions.length > 0 ? (
                                            selectedOptions.map(opt => (
                                                <Badge
                                                    variant="secondary"
                                                    key={opt.value}
                                                    className="mr-1"
                                                >
                                                    {opt.label}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span>Select {label.toLowerCase()}...</span>
                                        )}
                                    </div>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
                                    <CommandList>
                                        <CommandEmpty>{isLoading ? "Loading..." : `No ${label.toLowerCase()} found.`}</CommandEmpty>
                                        <CommandGroup>
                                            {options.map((option) => (
                                                <CommandItem
                                                    key={option.value}
                                                    onSelect={() => {
                                                        const newSelected = new Set(selectedValues);
                                                        if (newSelected.has(option.value)) {
                                                            newSelected.delete(option.value);
                                                        } else {
                                                            newSelected.add(option.value);
                                                        }
                                                        field.onChange(Array.from(newSelected));
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedValues.has(option.value) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {option.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                );
            }}
        />
    );
}


export function DiscountForm({ discount, onSuccess }: DiscountFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products and categories for the multi-select
  const { data: productsData, isLoading: isLoadingProducts } = useQuery<{ products: Product[] }>({
    queryKey: ['all-products'],
    queryFn: () => fetch('/api/products?limit=1000').then(res => res.json()),
  });

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['all-categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json()),
  });

  const productOptions = productsData?.products?.map((p: Product) => ({ 
    value: p.id, 
    label: p.title 
  })) || [];
  
  const categoryOptions = categoriesData?.map((c: Category) => ({ 
    value: c.id, 
    label: c.name 
  })) || [];


  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: discount ? {
      name: discount.name,
      code: discount.code,
      description: discount.description ?? undefined,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      applicability: discount.applicability,
      minimumPurchase: discount.minimumPurchase ?? undefined,
      maximumDiscount: discount.maximumDiscount ?? undefined,
      validFrom: new Date(discount.validFrom),
      validTo: new Date(discount.validTo),
      usageLimit: discount.usageLimit ?? undefined,
      isActive: discount.isActive,
      productIds: discount.products?.map(p => p.productId) || [],
      categoryIds: discount.categories?.map(c => c.categoryId) || [],
    } : {
      name: "",
      code: "",
      description: undefined,
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      applicability: DiscountApplicability.ALL_PRODUCTS,
      minimumPurchase: undefined,
      maximumDiscount: undefined,
      isActive: true,
      productIds: [],
      categoryIds: [],
      validFrom: new Date(),
      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimit: undefined,
    },
  });

  const { control, watch, handleSubmit, formState: { errors } } = form;
  const watchApplicability = watch("applicability");
  const watchDiscountType = watch("discountType");

  const onSubmit = async (data: DiscountFormValues) => {
    try {
      setIsLoading(true);
      const url = discount ? `/api/discounts/${discount.id}` : '/api/discounts';
      const method = discount ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          validFrom: data.validFrom?.toISOString(),
          validTo: data.validTo?.toISOString(),
          // Ensure arrays are always defined
          productIds: data.productIds || [],
          categoryIds: data.categoryIds || [],
        } as const),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save discount');
      }

      toast({
        title: discount ? 'Discount updated' : 'Discount created',
        description: discount ? 'Your discount has been updated.' : 'New discount created.',
      });

      if (onSuccess) onSuccess();
      else {
        router.push('/admin/discounts');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving discount:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save discount',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input {...form.register("name")} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Code *</Label>
            <Input {...form.register("code")} />
            {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea {...form.register("description")} />
           {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Discount Type *</Label>
            <Controller
              name="discountType"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DiscountType.PERCENTAGE}>Percentage</SelectItem>
                    <SelectItem value={DiscountType.FIXED_AMOUNT}>Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>
              {watchDiscountType === DiscountType.PERCENTAGE ? 'Discount % *' : 'Amount *'}
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...form.register("discountValue", { valueAsNumber: true })}
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                {watchDiscountType === DiscountType.PERCENTAGE ? '%' : '₹'}
              </div>
            </div>
            {errors.discountValue && <p className="text-sm text-red-500">{errors.discountValue.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Applies To *</Label>
          <Controller
            name="applicability"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger><SelectValue placeholder="Select applicability" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={DiscountApplicability.ALL_PRODUCTS}>All Products</SelectItem>
                  <SelectItem value={DiscountApplicability.SPECIFIC_PRODUCTS}>Specific Products</SelectItem>
                  <SelectItem value={DiscountApplicability.SPECIFIC_CATEGORIES}>Specific Categories</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {watchApplicability === DiscountApplicability.SPECIFIC_PRODUCTS && (
            <MultiSelectCombobox 
                control={control}
                name="productIds"
                label="Products"
                options={productOptions}
                isLoading={isLoadingProducts}
            />
        )}

        {watchApplicability === DiscountApplicability.SPECIFIC_CATEGORIES && (
            <MultiSelectCombobox 
                control={control}
                name="categoryIds"
                label="Categories"
                options={categoryOptions}
                isLoading={isLoadingCategories}
            />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Minimum Purchase (₹)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...form.register("minimumPurchase", { valueAsNumber: true })}
            />
            {errors.minimumPurchase && <p className="text-sm text-red-500">{errors.minimumPurchase.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Maximum Discount (₹)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...form.register("maximumDiscount", { valueAsNumber: true })}
            />
            {errors.maximumDiscount && <p className="text-sm text-red-500">{errors.maximumDiscount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Usage Limit</Label>
            <Input
              type="number"
              min="1"
              {...form.register("usageLimit", { valueAsNumber: true })}
            />
            {errors.usageLimit && <p className="text-sm text-red-500">{errors.usageLimit.message}</p>}
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Valid From *</Label>
            <Controller
              name="validFrom"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Valid To *</Label>
            <Controller
              name="validTo"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="isActive"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
          <Label htmlFor="isActive" className="!m-0">Active</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/discounts')}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Discount'}
        </Button>
      </div>
    </form>
  );
}
