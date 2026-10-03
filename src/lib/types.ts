export interface Settings {
  id: string;
  business_name: string;
  tagline: string;
  phone: string;
  address: string;
  max_events_per_day: number;
  logo_url: string;
  custom_event_types: string[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  notes: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  variant: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Bill {
  id: string;
  bill_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  amount_received: number;
  balance: number;
  payment_method: string;
  bill_date: string;
  notes: string;
  created_at: string;
}

export interface BillItem {
  id: string;
  bill_id: string;
  service_name: string;
  variant: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  created_at: string;
}

export interface Payment {
  id: string;
  bill_id: string | null;
  event_id: string | null;
  frame_order_id: string | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  note: string;
  created_at: string;
}

export interface EventRecord {
  id: string;
  event_type: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location: string;
  services: string[];
  total_amount: number;
  advance_received: number;
  balance: number;
  status: string;
  owner_approved: boolean;
  notes: string;
  created_at: string;
}

export interface EventStaff {
  id: string;
  event_id: string;
  staff_id: string;
  role: string;
  created_at: string;
}

export interface FrameOrder {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  order_type: string;
  size: string;
  quantity: number;
  material: string;
  total_price: number;
  amount_received: number;
  balance: number;
  delivery_date: string | null;
  status: string;
  notes: string;
  created_at: string;
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  role: string;
  monthly_salary: number;
  photo_url: string;
  custom_role: string;
  notes: string;
  status: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  staff_id: string;
  attendance_date: string;
  status: string;
  created_at: string;
}

export interface SalaryRecord {
  id: string;
  staff_id: string;
  amount: number;
  month: string;
  note: string;
  payment_date: string;
  created_at: string;
}

export interface SalaryAdvance {
  id: string;
  staff_id: string;
  amount: number;
  note: string;
  advance_date: string;
  created_at: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  expense_date: string;
  related_event_id: string | null;
  created_at: string;
}
