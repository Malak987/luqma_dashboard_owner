import type {
  Activity,
  Category,
  Customer,
  Kpi,
  Localized,
  Notification,
  Order,
  OrderLine,
  Product,
  Restaurant,
  RevenueSeries,
  StatusSlice,
  TopCategory,
} from './types';

const l = (en: string, ar: string): Localized => ({ en, ar });

const line = (en: string, ar: string, quantity: number, unitPrice: number): OrderLine => ({
  name: l(en, ar),
  quantity,
  unitPrice,
});

const money = (value: number) => Math.round(value * 100) / 100;

interface OrderSeed {
  id: string;
  customer: Localized;
  restaurant: Localized;
  lines: OrderLine[];
  status: Order['status'];
  minutesAgo: number;
  payment: Order['payment'];
  address: Localized;
  deliveryFee?: number;
  serviceFee?: number;
  discount?: number;
}

function makeOrder(seed: OrderSeed): Order {
  const subtotal = money(
    seed.lines.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  );
  const deliveryFee = seed.deliveryFee ?? 15;
  const serviceFee = seed.serviceFee ?? 5;
  const discount = seed.discount ?? 0;

  return {
    ...seed,
    subtotal,
    deliveryFee,
    serviceFee,
    discount,
    total: money(subtotal + deliveryFee + serviceFee - discount),
  };
}

export const orders: Order[] = [
  makeOrder({
    id: 'LQ-10482',
    customer: l('Nour Hassan', 'نور حسن'),
    restaurant: l('Beit El Sham', 'بيت الشام'),
    lines: [
      line('Mixed Grill Platter', 'طبق مشاوي مشكل', 1, 185),
      line('Fattoush Salad', 'سلطة فتوش', 1, 45),
    ],
    status: 'preparing',
    minutesAgo: 8,
    payment: 'card',
    address: l('Zamalek, Cairo', 'الزمالك، القاهرة'),
  }),
  makeOrder({
    id: 'LQ-10481',
    customer: l('Omar Khaled', 'عمر خالد'),
    restaurant: l('Cairo Bites', 'كايرو بايتس'),
    lines: [
      line('Beef Burger', 'برجر لحم', 2, 95),
      line('Truffle Fries', 'بطاطس ترافل', 1, 45),
    ],
    status: 'on_the_way',
    minutesAgo: 14,
    payment: 'card',
    address: l('Maadi, Cairo', 'المعادي، القاهرة'),
  }),
  makeOrder({
    id: 'LQ-10480',
    customer: l('Salma Adel', 'سلمى عادل'),
    restaurant: l('Nile Greens', 'نايل جرينز'),
    lines: [
      line('Grilled Salmon', 'سلمون مشوي', 1, 220),
      line('Fattoush Salad', 'سلطة فتوش', 1, 55),
    ],
    status: 'delivered',
    minutesAgo: 22,
    payment: 'wallet',
    address: l('New Cairo', 'القاهرة الجديدة'),
  }),
  makeOrder({
    id: 'LQ-10479',
    customer: l('Youssef Ibrahim', 'يوسف إبراهيم'),
    restaurant: l('Forno Nero', 'فورنو نيرو'),
    lines: [line('Margherita Pizza', 'بيتزا مارغريتا', 2, 140)],
    status: 'pending',
    minutesAgo: 3,
    payment: 'cash',
    address: l('Heliopolis, Cairo', 'مصر الجديدة، القاهرة'),
  }),
  makeOrder({
    id: 'LQ-10478',
    customer: l('Mariam Tarek', 'مريم طارق'),
    restaurant: l('Yasmine Cafe', 'مقهى الياسمين'),
    lines: [
      line('Turkish Coffee', 'قهوة تركية', 2, 38),
      line('Om Ali', 'أم علي', 1, 65),
    ],
    status: 'delivered',
    minutesAgo: 35,
    payment: 'card',
    address: l('Sheikh Zayed', 'الشيخ زايد'),
  }),
  makeOrder({
    id: 'LQ-10477',
    customer: l('Ali Mostafa', 'علي مصطفى'),
    restaurant: l('Sea & Salt', 'بحر وملح'),
    lines: [line('Grilled Salmon', 'سلمون مشوي', 1, 240)],
    status: 'preparing',
    minutesAgo: 11,
    payment: 'card',
    address: l('Nasr City, Cairo', 'مدينة نصر، القاهرة'),
  }),
  makeOrder({
    id: 'LQ-10476',
    customer: l('Hana Samir', 'هنا سمير'),
    restaurant: l('Beit El Sham', 'بيت الشام'),
    lines: [
      line('Chicken Shawarma', 'شاورما دجاج', 3, 55),
      line('Fattoush Salad', 'سلطة فتوش', 1, 45),
    ],
    status: 'on_the_way',
    minutesAgo: 17,
    payment: 'cash',
    address: l('Zamalek, Cairo', 'الزمالك، القاهرة'),
  }),
  makeOrder({
    id: 'LQ-10475',
    customer: l('Karim Fathy', 'كريم فتحي'),
    restaurant: l('Cairo Bites', 'كايرو بايتس'),
    lines: [line('Beef Burger', 'برجر لحم', 1, 95)],
    status: 'cancelled',
    minutesAgo: 48,
    payment: 'card',
    address: l('Maadi, Cairo', 'المعادي، القاهرة'),
  }),
  makeOrder({
    id: 'LQ-10474',
    customer: l('Nour Hassan', 'نور حسن'),
    restaurant: l('Nile Greens', 'نايل جرينز'),
    lines: [
      line('Shakshuka', 'شكشوكة', 1, 70),
      line('Mango Smoothie', 'عصير مانجو', 1, 45),
    ],
    status: 'delivered',
    minutesAgo: 62,
    payment: 'wallet',
    address: l('New Cairo', 'القاهرة الجديدة'),
  }),
  makeOrder({
    id: 'LQ-10473',
    customer: l('Salma Adel', 'سلمى عادل'),
    restaurant: l('Yasmine Cafe', 'مقهى الياسمين'),
    lines: [line('Turkish Coffee', 'قهوة تركية', 1, 38)],
    status: 'delivered',
    minutesAgo: 74,
    payment: 'cash',
    address: l('Sheikh Zayed', 'الشيخ زايد'),
  }),
  makeOrder({
    id: 'LQ-10472',
    customer: l('Omar Khaled', 'عمر خالد'),
    restaurant: l('Forno Nero', 'فورنو نيرو'),
    lines: [line('Margherita Pizza', 'بيتزا مارغريتا', 1, 140)],
    status: 'delivered',
    minutesAgo: 90,
    payment: 'card',
    address: l('Heliopolis, Cairo', 'مصر الجديدة، القاهرة'),
  }),
  makeOrder({
    id: 'LQ-10471',
    customer: l('Mariam Tarek', 'مريم طارق'),
    restaurant: l('Sea & Salt', 'بحر وملح'),
    lines: [line('Grilled Salmon', 'سلمون مشوي', 2, 240)],
    status: 'delivered',
    minutesAgo: 110,
    payment: 'card',
    address: l('Nasr City, Cairo', 'مدينة نصر، القاهرة'),
  }),
];

export const recentOrders = orders.slice(0, 6);

export const kpis: Kpi[] = [
  {
    id: 'revenue',
    value: 184250,
    delta: 12.4,
    format: 'currency',
    spark: [22, 26, 24, 29, 27, 34, 38, 36, 42, 47, 44, 52],
  },
  {
    id: 'orders',
    value: 1284,
    delta: 8.1,
    format: 'number',
    spark: [18, 22, 20, 26, 24, 30, 28, 34, 33, 38, 42, 45],
  },
  {
    id: 'restaurants',
    value: 48,
    delta: 3.2,
    format: 'number',
    spark: [30, 30, 32, 32, 34, 36, 36, 38, 40, 42, 45, 48],
  },
  {
    id: 'average',
    value: 143.5,
    delta: -2.3,
    format: 'currency',
    spark: [48, 46, 49, 47, 45, 46, 44, 45, 43, 44, 42, 43],
  },
];

function isoDay(offsetFromNov23: number): string {
  const date = new Date(Date.UTC(2026, 10, 23));
  date.setUTCDate(date.getUTCDate() + offsetFromNov23);
  return date.toISOString().slice(0, 10);
}

function buildLabels(count: number, step: number): string[] {
  return Array.from({ length: count }, (_, index) => isoDay(-(count - 1 - index) * step));
}

const weekLabels = buildLabels(7, 1);
const monthLabels = buildLabels(10, 3);
const quarterLabels = buildLabels(10, 9);

export const revenueSeries: Record<'7d' | '30d' | '90d', RevenueSeries> = {
  '7d': {
    labels: weekLabels,
    current: [21200, 23800, 22400, 26800, 29750, 32600, 27700],
    previous: [19000, 21500, 20300, 23600, 26500, 29000, 24000],
  },
  '30d': {
    labels: monthLabels,
    current: [
      46800, 52400, 50100, 58800, 61200, 57400, 69800, 73500, 70900, 82100,
    ],
    previous: [
      42100, 47800, 45200, 52600, 54800, 51900, 62400, 65800, 63100, 72600,
    ],
  },
  '90d': {
    labels: quarterLabels,
    current: [
      146000, 158000, 151000, 172000, 184000, 176000, 198000, 214000, 207000,
      232000,
    ],
    previous: [
      132000, 141000, 136000, 154000, 163000, 155000, 174000, 189000, 182000,
      203000,
    ],
  },
};

export const statusDistribution: StatusSlice[] = [
  { status: 'delivered', count: 892 },
  { status: 'on_the_way', count: 146 },
  { status: 'preparing', count: 118 },
  { status: 'pending', count: 74 },
  { status: 'cancelled', count: 54 },
];

export const weeklyOrders = {
  labels: weekLabels,
  values: [142, 168, 155, 190, 214, 236, 179],
};

export const restaurants: Restaurant[] = [
  {
    id: 'r1',
    name: l('Beit El Sham', 'بيت الشام'),
    cuisine: l('Levantine', 'شامي'),
    location: l('Zamalek, Cairo', 'الزمالك، القاهرة'),
    rating: 4.9,
    orders: 428,
    revenue: 52300,
    growth: 14.2,
    status: 'active',
    branches: 3,
    tone: 0,
  },
  {
    id: 'r2',
    name: l('Cairo Bites', 'كايرو بايتس'),
    cuisine: l('Burgers', 'برجر'),
    location: l('Maadi, Cairo', 'المعادي، القاهرة'),
    rating: 4.7,
    orders: 356,
    revenue: 38700,
    growth: 9.6,
    status: 'active',
    branches: 2,
    tone: 1,
  },
  {
    id: 'r3',
    name: l('Nile Greens', 'نايل جرينز'),
    cuisine: l('Healthy', 'صحي'),
    location: l('New Cairo', 'القاهرة الجديدة'),
    rating: 4.8,
    orders: 291,
    revenue: 33400,
    growth: 18.4,
    status: 'active',
    branches: 1,
    tone: 2,
  },
  {
    id: 'r4',
    name: l('Yasmine Cafe', 'مقهى الياسمين'),
    cuisine: l('Cafe & Desserts', 'مقهى وحلويات'),
    location: l('Sheikh Zayed', 'الشيخ زايد'),
    rating: 4.6,
    orders: 248,
    revenue: 21600,
    growth: 4.8,
    status: 'active',
    branches: 2,
    tone: 3,
  },
  {
    id: 'r5',
    name: l('Sea & Salt', 'بحر وملح'),
    cuisine: l('Seafood', 'مأكولات بحرية'),
    location: l('Nasr City, Cairo', 'مدينة نصر، القاهرة'),
    rating: 4.8,
    orders: 187,
    revenue: 19800,
    growth: 6.1,
    status: 'active',
    branches: 1,
    tone: 0,
  },
  {
    id: 'r6',
    name: l('Forno Nero', 'فورنو نيرو'),
    cuisine: l('Italian', 'إيطالي'),
    location: l('Heliopolis, Cairo', 'مصر الجديدة، القاهرة'),
    rating: 4.5,
    orders: 132,
    revenue: 14200,
    growth: -1.4,
    status: 'pending',
    branches: 1,
    tone: 1,
  },
];

export const topRestaurants = [...restaurants]
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 4);

export const customers: Customer[] = [
  {
    id: 'c1',
    name: l('Nour Hassan', 'نور حسن'),
    email: 'nour.hassan@example.com',
    phone: '+20 100 123 4567',
    orders: 42,
    spend: 6840,
    lastOrderMinutes: 8,
    segment: 'vip',
    tone: 0,
  },
  {
    id: 'c2',
    name: l('Omar Khaled', 'عمر خالد'),
    email: 'omar.khaled@example.com',
    phone: '+20 101 234 5678',
    orders: 28,
    spend: 4210,
    lastOrderMinutes: 14,
    segment: 'regular',
    tone: 1,
  },
  {
    id: 'c3',
    name: l('Salma Adel', 'سلمى عادل'),
    email: 'salma.adel@example.com',
    phone: '+20 102 345 6789',
    orders: 61,
    spend: 10240,
    lastOrderMinutes: 22,
    segment: 'vip',
    tone: 2,
  },
  {
    id: 'c4',
    name: l('Youssef Ibrahim', 'يوسف إبراهيم'),
    email: 'youssef.ibrahim@example.com',
    phone: '+20 103 456 7890',
    orders: 3,
    spend: 460,
    lastOrderMinutes: 3,
    segment: 'new',
    tone: 3,
  },
  {
    id: 'c5',
    name: l('Mariam Tarek', 'مريم طارق'),
    email: 'mariam.tarek@example.com',
    phone: '+20 104 567 8901',
    orders: 19,
    spend: 2870,
    lastOrderMinutes: 35,
    segment: 'regular',
    tone: 0,
  },
  {
    id: 'c6',
    name: l('Ali Mostafa', 'علي مصطفى'),
    email: 'ali.mostafa@example.com',
    phone: '+20 105 678 9012',
    orders: 7,
    spend: 980,
    lastOrderMinutes: 11,
    segment: 'new',
    tone: 1,
  },
  {
    id: 'c7',
    name: l('Hana Samir', 'هنا سمير'),
    email: 'hana.samir@example.com',
    phone: '+20 106 789 0123',
    orders: 34,
    spend: 5120,
    lastOrderMinutes: 17,
    segment: 'regular',
    tone: 2,
  },
  {
    id: 'c8',
    name: l('Karim Fathy', 'كريم فتحي'),
    email: 'karim.fathy@example.com',
    phone: '+20 107 890 1234',
    orders: 2,
    spend: 230,
    lastOrderMinutes: 2880,
    segment: 'at_risk',
    tone: 3,
  },
];

export const categories: Category[] = [
  {
    id: 'cat1',
    name: l('Grills', 'مشويات'),
    items: 84,
    share: 32,
    status: 'active',
    icon: 'grill',
    tone: 0,
  },
  {
    id: 'cat2',
    name: l('Pizza', 'بيتزا'),
    items: 56,
    share: 24,
    status: 'active',
    icon: 'pizza',
    tone: 1,
  },
  {
    id: 'cat3',
    name: l('Seafood', 'مأكولات بحرية'),
    items: 38,
    share: 16,
    status: 'active',
    icon: 'seafood',
    tone: 2,
  },
  {
    id: 'cat4',
    name: l('Desserts', 'حلويات'),
    items: 47,
    share: 12,
    status: 'active',
    icon: 'dessert',
    tone: 3,
  },
  {
    id: 'cat5',
    name: l('Beverages', 'مشروبات'),
    items: 62,
    share: 9,
    status: 'active',
    icon: 'drinks',
    tone: 0,
  },
  {
    id: 'cat6',
    name: l('Breakfast', 'فطور'),
    items: 29,
    share: 4,
    status: 'active',
    icon: 'breakfast',
    tone: 1,
  },
  {
    id: 'cat7',
    name: l('Sandwiches', 'سندويشات'),
    items: 33,
    share: 2,
    status: 'active',
    icon: 'sandwich',
    tone: 2,
  },
  {
    id: 'cat8',
    name: l('Salads', 'سلطات'),
    items: 41,
    share: 1,
    status: 'hidden',
    icon: 'salad',
    tone: 3,
  },
];

export const products: Product[] = [
  {
    id: 'p1',
    name: l('Mixed Grill Platter', 'طبق مشاوي مشكل'),
    category: l('Grills', 'مشويات'),
    restaurant: l('Beit El Sham', 'بيت الشام'),
    price: 185,
    orders: 214,
    status: 'available',
    icon: 'grill',
  },
  {
    id: 'p2',
    name: l('Margherita Pizza', 'بيتزا مارغريتا'),
    category: l('Pizza', 'بيتزا'),
    restaurant: l('Forno Nero', 'فورنو نيرو'),
    price: 140,
    orders: 186,
    status: 'available',
    icon: 'pizza',
  },
  {
    id: 'p3',
    name: l('Grilled Salmon', 'سلمون مشوي'),
    category: l('Seafood', 'مأكولات بحرية'),
    restaurant: l('Sea & Salt', 'بحر وملح'),
    price: 240,
    orders: 143,
    status: 'available',
    icon: 'seafood',
  },
  {
    id: 'p4',
    name: l('Chicken Shawarma', 'شاورما دجاج'),
    category: l('Sandwiches', 'سندويشات'),
    restaurant: l('Beit El Sham', 'بيت الشام'),
    price: 55,
    orders: 312,
    status: 'available',
    icon: 'sandwich',
  },
  {
    id: 'p5',
    name: l('Fattoush Salad', 'سلطة فتوش'),
    category: l('Salads', 'سلطات'),
    restaurant: l('Nile Greens', 'نايل جرينز'),
    price: 45,
    orders: 98,
    status: 'low_stock',
    icon: 'salad',
  },
  {
    id: 'p6',
    name: l('Beef Burger', 'برجر لحم'),
    category: l('Sandwiches', 'سندويشات'),
    restaurant: l('Cairo Bites', 'كايرو بايتس'),
    price: 95,
    orders: 268,
    status: 'available',
    icon: 'sandwich',
  },
  {
    id: 'p7',
    name: l('Om Ali', 'أم علي'),
    category: l('Desserts', 'حلويات'),
    restaurant: l('Yasmine Cafe', 'مقهى الياسمين'),
    price: 65,
    orders: 154,
    status: 'available',
    icon: 'dessert',
  },
  {
    id: 'p8',
    name: l('Turkish Coffee', 'قهوة تركية'),
    category: l('Beverages', 'مشروبات'),
    restaurant: l('Yasmine Cafe', 'مقهى الياسمين'),
    price: 38,
    orders: 402,
    status: 'available',
    icon: 'drinks',
  },
  {
    id: 'p9',
    name: l('Shakshuka', 'شكشوكة'),
    category: l('Breakfast', 'فطور'),
    restaurant: l('Nile Greens', 'نايل جرينز'),
    price: 70,
    orders: 87,
    status: 'unavailable',
    icon: 'breakfast',
  },
  {
    id: 'p10',
    name: l('Mango Smoothie', 'عصير مانجو'),
    category: l('Beverages', 'مشروبات'),
    restaurant: l('Nile Greens', 'نايل جرينز'),
    price: 45,
    orders: 121,
    status: 'low_stock',
    icon: 'drinks',
  },
];

export const topCategories: TopCategory[] = categories
  .slice(0, 5)
  .map((category) => ({
    name: category.name,
    orders: Math.round((1284 * category.share) / 100),
    share: category.share,
    tone: category.tone,
  }));

export const activity: Activity[] = [
  {
    id: 'a1',
    type: 'order',
    actor: l('Nour Hassan', 'نور حسن'),
    action: l('placed a new order', 'أنشأت طلبًا جديدًا'),
    target: l('LQ-10482', 'LQ-10482'),
    minutesAgo: 8,
  },
  {
    id: 'a2',
    type: 'restaurant',
    actor: l('Forno Nero', 'فورنو نيرو'),
    action: l('joined the platform', 'انضم إلى المنصة'),
    target: l('Onboarding', 'التسجيل'),
    minutesAgo: 26,
  },
  {
    id: 'a3',
    type: 'customer',
    actor: l('Youssef Ibrahim', 'يوسف إبراهيم'),
    action: l('created a new account', 'أنشأ حسابًا جديدًا'),
    target: l('Customers', 'العملاء'),
    minutesAgo: 41,
  },
  {
    id: 'a4',
    type: 'payout',
    actor: l('Beit El Sham', 'بيت الشام'),
    action: l('received a weekly payout', 'استلم دفعة أسبوعية'),
    target: l('EGP 12,400', '12,400 ج.م'),
    minutesAgo: 64,
  },
  {
    id: 'a5',
    type: 'alert',
    actor: l('Nile Greens', 'نايل جرينز'),
    action: l('marked an item as low stock', 'حدد عنصرًا بأنه منخفض المخزون'),
    target: l('Fattoush Salad', 'سلطة فتوش'),
    minutesAgo: 92,
  },
];

export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'order',
    title: l('New order received', 'تم استلام طلب جديد'),
    body: l('Order LQ-10482 from Nour Hassan is waiting for confirmation.', 'الطلب LQ-10482 من نور حسن بانتظار التأكيد.'),
    minutesAgo: 8,
    read: false,
  },
  {
    id: 'n2',
    type: 'stock',
    title: l('Low stock alert', 'تنبيه انخفاض المخزون'),
    body: l('Fattoush Salad is running low at Nile Greens.', 'سلطة فتوش على وشك النفاد في نايل جرينز.'),
    minutesAgo: 34,
    read: false,
  },
  {
    id: 'n3',
    type: 'customer',
    title: l('New customer milestone', 'إنجاز جديد للعملاء'),
    body: l('Luqma welcomed 312 new customers this month.', 'رحبت لقمة بـ 312 عميلًا جديدًا هذا الشهر.'),
    minutesAgo: 96,
    read: false,
  },
  {
    id: 'n4',
    type: 'system',
    title: l('Weekly report is ready', 'التقرير الأسبوعي جاهز'),
    body: l('Your weekly performance summary is available to review.', 'ملخص أدائك الأسبوعي متاح للمراجعة.'),
    minutesAgo: 180,
    read: true,
  },
];

export const restaurantDetailStats = {
  active: 48,
  pending: 5,
  averageRating: 4.7,
};

export const customerStats = {
  total: 8420,
  newThisMonth: 312,
  repeatRate: 38.2,
};
