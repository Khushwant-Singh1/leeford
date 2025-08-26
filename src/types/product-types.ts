export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  status: "PUBLISHED" | "DRAFT";
  discountPrice?: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Size {
  id: string;
  size: string;
  stock: number;
  colorId: string;
}

export interface Asset {
  id: string;
  asset_url: string;
  type: string;
  colorId: string | null;
  productId: string | null;
}

export interface Varient {
  id: string;
  color: string;
  productId: string;
  assets: Asset[];
  sizes: Size[];
}
