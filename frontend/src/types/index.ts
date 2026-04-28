// User Types
export interface User {
  id: number;
  restaurant_id: number;
  restaurant_name?: string;
  restaurant_code?: string;
  username: string;
  email?: string;
  full_name: string;
  role: 'admin' | 'manager' | 'waiter' | 'chef' | 'cashier';
  is_active: boolean;
  created_at?: string;
  last_login?: string;
}

export interface LoginCredentials {
  restaurant_code?: string;
  username: string;
  password: string;
}

export interface RestaurantSignupPayload {
  restaurant_name: string;
  admin_full_name: string;
  admin_username: string;
  admin_email?: string;
  password: string;
}

export interface RestaurantSignupResponse {
  restaurant_id: number;
  restaurant_name: string;
  restaurant_code: string;
  admin_user: User;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
  item_count: number;
}

// Menu Item Types
export interface MenuItemIngredient {
  id: number;
  inventory_item_id: number;
  quantity_required: number;
  name?: string;
  unit?: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  cost: number;
  profit_margin: number;
  category_id: number;
  category_name?: string;
  is_available: boolean;
  is_vegetarian: boolean;
  is_spicy: boolean;
  preparation_time: number;
  image_url?: string;
  ingredients: MenuItemIngredient[];
  created_at?: string;
}

// Table Types
export interface Table {
  id: number;
  table_number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  location?: string;
  current_order_id?: number;
  notes?: string;
}

// Order Types
export type OrderStatus = 'pending' | 'in_kitchen' | 'cooking' | 'ready' | 'served' | 'completed' | 'cancelled';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  menu_item_name: string;
  menu_item_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  special_instructions?: string;
  is_voided: boolean;
  created_at?: string;
}

export interface Order {
  id: number;
  order_number: string;
  order_type: OrderType;
  table_id?: number;
  table_number?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  discount_type?: string;
  discount_value: number;
  special_instructions?: string;
  item_count: number;
  items: OrderItem[];
  created_at?: string;
  updated_at?: string;
  kitchen_started_at?: string;
  ready_at?: string;
  served_at?: string;
  picked_up_at?: string;
  completed_at?: string;
  created_by: number;
  creator_name?: string;
  picked_up_by?: number;
  picked_up_by_name?: string;
}

export interface BulkUserCreatePayload {
  role: 'admin' | 'manager' | 'waiter' | 'chef' | 'cashier';
  shared_password: string;
  quantity: number;
  username_prefix: string;
  name_prefix: string;
  start_index?: number;
  names?: string[];
}

export interface BulkUserCreateResponse {
  created_users: User[];
  skipped_usernames: string[];
}

// Inventory Types
export interface InventoryItem {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  stock_value: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  supplier_id?: number;
  supplier_name?: string;
  is_active: boolean;
  is_low_stock: boolean;
  stock_status: string;
  created_at?: string;
}

export interface InventoryTransaction {
  id: number;
  inventory_item_id: number;
  inventory_item_name?: string;
  transaction_type: 'in' | 'out' | 'adjustment' | 'wastage';
  quantity: number;
  reference_type?: string;
  reference_id?: number;
  unit_cost: number;
  total_cost: number;
  notes?: string;
  created_by?: number;
  created_at?: string;
}

export interface StockPrediction {
  item_id: number;
  item_name: string;
  current_stock: number;
  unit: string;
  daily_usage_rate: number;
  days_until_stockout: number | null;
  predicted_stockout_date: string | null;
  risk_level: 'critical' | 'warning' | 'healthy';
  linked_menu_items: string[];
}

// Employee Types
export interface Employee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone?: string;
  address?: string;
  role: string;
  department?: string;
  base_salary: number;
  hourly_rate: number;
  hire_date?: string;
  termination_date?: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  attendance_rate: number;
  created_at?: string;
}

export interface Attendance {
  id: number;
  employee_id: number;
  employee_name?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
  check_in?: string;
  check_out?: string;
  hours_worked: number;
  overtime_hours: number;
  notes?: string;
  created_at?: string;
}

export interface Salary {
  id: number;
  employee_id: number;
  employee_name?: string;
  month: number;
  year: number;
  base_salary: number;
  overtime_pay: number;
  bonus: number;
  allowances: number;
  total_earnings: number;
  tax: number;
  insurance: number;
  other_deductions: number;
  total_deductions: number;
  net_salary: number;
  is_paid: boolean;
  paid_date?: string;
  created_at?: string;
}

// Payment Types
export interface Payment {
  id: number;
  order_id: number;
  order_number?: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  tip_amount: number;
  total_amount: number;
  payment_method: 'cash' | 'card' | 'online' | 'wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partial_refund';
  transaction_id?: string;
  refund_amount: number;
  refund_reason?: string;
  refunded_at?: string;
  cashier_id?: number;
  cashier_name?: string;
  created_at?: string;
  completed_at?: string;
}

export interface PaymentReceipt {
  payment_id: number;
  order_id: number;
  order_number: string;
  order_type: string;
  table_number?: string;
  customer_name?: string;
  items: OrderItem[];
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  tip_amount: number;
  total_amount: number;
  payment_method: string;
  cashier_name?: string;
  completed_at?: string;
}

export interface PublicMenuQrResponse {
  menu_url: string;
  qr_code_base64: string;
  content_type: string;
}

export interface BusinessSettings {
  tax_rate: number;
  currency: string;
}

// Expense Types
export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  receipt_number?: string;
  receipt_image?: string;
  supplier_id?: number;
  supplier_name?: string;
  notes?: string;
  created_by?: number;
  created_at?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
  payment_terms?: string;
  is_active: string;
  notes?: string;
  created_at?: string;
}

// Report Types
export interface DailyReport {
  date: string;
  total_sales: number;
  total_orders: number;
  total_expenses: number;
  net_profit: number;
  average_order_value: number;
  top_selling_items: Array<{
    id: number;
    name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  payment_breakdown: Record<string, number>;
}

export interface DashboardSummary {
  today_sales: number;
  today_orders: number;
  today_profit: number;
  active_tables: number;
  pending_orders: number;
  low_stock_count: number;
}

// AI Types
export interface AIInsight {
  type: 'positive' | 'warning' | 'alert' | 'info';
  title: string;
  message: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
