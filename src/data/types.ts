export interface Localized {
  en: string;
  ar: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
export type PaymentMethod = 'card' | 'cash' | 'wallet';
export type RestaurantStatus = 'active' | 'pending' | 'paused';
export type ProductStatus = 'available' | 'low_stock' | 'unavailable';
export type CustomerSegment = 'vip' | 'new' | 'regular' | 'at_risk';
export type ActivityType = 'order' | 'customer' | 'restaurant' | 'payout' | 'alert';
export type NotificationType = 'order' | 'stock' | 'customer' | 'system';

export interface OrderLine {
  name: Localized;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  customer: Localized;
  restaurant: Localized;
  lines: OrderLine[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  minutesAgo: number;
  payment: PaymentMethod;
  address: Localized;
}

export interface Restaurant {
  id: string;
  name: Localized;
  cuisine: Localized;
  location: Localized;
  rating: number;
  orders: number;
  revenue: number;
  growth: number;
  status: RestaurantStatus;
  branches: number;
  tone: 0 | 1 | 2 | 3;
}

export interface Customer {
  id: string;
  name: Localized;
  email: string;
  phone: string;
  orders: number;
  spend: number;
  lastOrderMinutes: number;
  segment: CustomerSegment;
  tone: 0 | 1 | 2 | 3;
}

export interface Category {
  id: string;
  name: Localized;
  items: number;
  share: number;
  status: 'active' | 'hidden';
  icon: CategoryIcon;
  tone: 0 | 1 | 2 | 3;
}

export type CategoryIcon =
  | 'grill'
  | 'pizza'
  | 'seafood'
  | 'dessert'
  | 'drinks'
  | 'breakfast'
  | 'sandwich'
  | 'salad';

export interface Product {
  id: string;
  name: Localized;
  category: Localized;
  restaurant: Localized;
  price: number;
  orders: number;
  status: ProductStatus;
  icon: CategoryIcon;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: Localized;
  body: Localized;
  minutesAgo: number;
  read: boolean;
}

export interface Activity {
  id: string;
  type: ActivityType;
  actor: Localized;
  action: Localized;
  target: Localized;
  minutesAgo: number;
}

export interface Kpi {
  id: 'revenue' | 'orders' | 'restaurants' | 'average';
  value: number;
  delta: number;
  format: 'currency' | 'number' | 'decimal';
  spark: number[];
}

export interface RevenueSeries {
  labels: string[];
  current: number[];
  previous: number[];
}

export interface StatusSlice {
  status: OrderStatus;
  count: number;
}

export interface TopCategory {
  name: Localized;
  orders: number;
  share: number;
  tone: 0 | 1 | 2 | 3;
}
