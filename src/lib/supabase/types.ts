// Hand-written types for the `justhazaar` schema. In a larger project, generate
// these with `supabase gen types typescript`.

export type UserRole = "BUYER" | "SELLER" | "CHURCH_ADMIN" | "PLATFORM_ADMIN";

export type Denomination =
  | "RCCG"
  | "WINNERS_CHAPEL"
  | "MFM"
  | "CAC"
  | "DEEPER_LIFE"
  | "CATHOLIC"
  | "ANGLICAN"
  | "METHODIST"
  | "PRESBYTERIAN"
  | "OTHER";

export type SellerStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type ChurchStatus = "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";
export type DeliveryType = "HOME_DELIVERY" | "CHURCH_PICKUP";
export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "SHIPPED"
  | "ARRIVED_AT_CHURCH"
  | "READY_FOR_PICKUP"
  | "PICKED_UP"
  | "DELIVERED"
  | "FAILED_PICKUP"
  | "CANCELLED"
  | "COMPLETED";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  home_church_branch_id: string | null;
  // Null until the user has finished onboarding. Email signups set this at
  // signup time; Google/OAuth users complete onboarding via /onboarding.
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Seller = {
  id: string;
  user_id: string;
  business_name: string;
  slug: string;
  cac_number: string | null;
  church_affiliation: Denomination | null;
  phone: string;
  city: string;
  state: string;
  description: string | null;
  logo_url: string | null;
  status: SellerStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type ChurchBranch = {
  id: string;
  admin_user_id: string;
  denomination: Denomination;
  branch_name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  contact_person: string;
  contact_phone: string;
  operating_days: string;
  operating_hours: string;
  pickup_capacity: number;
  status: ChurchStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductCategory = {
  id: string;
  slug: string;
  name: string;
  active: boolean;
  created_at: string;
};

export type DigitalProductType = "COURSE" | "EBOOK" | "TEMPLATE" | "OTHER";

export const DIGITAL_PRODUCT_TYPE_LABEL: Record<DigitalProductType, string> = {
  COURSE: "Course",
  EBOOK: "Ebook",
  TEMPLATE: "Template",
  OTHER: "Other digital product",
};

export type Product = {
  id: string;
  seller_id: string;
  category_id: string;
  slug: string;
  title: string;
  description: string;
  price_kobo: number;
  inventory_qty: number;
  available: boolean;
  is_digital: boolean;
  weight_grams: number | null;
  cover_image_url: string | null;
  product_type: DigitalProductType;
  paystack_payment_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductPickupLocation = {
  product_id: string;
  branch_id: string;
  created_at: string;
};

export type Order = {
  id: string;
  buyer_id: string;
  seller_id: string;
  delivery_type: DeliveryType;
  church_branch_id: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  pickup_code: string | null;
  pickup_token: string | null;
  status: OrderStatus;
  subtotal_kobo: number;
  platform_fee_kobo: number;
  logistics_fee_kobo: number;
  total_kobo: number;
  paystack_reference: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  title: string;
  price_kobo: number;
  quantity: number;
};
