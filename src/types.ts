export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  ram: string;
  rom: string;
  purchase_price: number;
  selling_price: number;
  discount_price?: number;
  category?: string;
  profit_margin: number;
  quantity: number;
  image_urls: string[];
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface SliderItem {
  id: string;
  title: string;
  subtitle: string;
  discount: string;
  color: string;
  features: string[];
  imageUrl: string;
  order?: number;
}

export interface OfflineSale {
  id: string;
  customer_name: string;
  phone: string;
  nid: string;
  address: string;
  guarantor: string;
  product_id: string;
  product_name: string;
  image_file_ids: string[];
  sale_date: string;
  profit: number;
}

export interface OnlineOrder {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  product_id: string;
  product_name: string;
  payment_method: 'COD' | 'bKash' | 'Nagad';
  order_date: string;
  status: 'pending' | 'completed' | 'deleted';
}
