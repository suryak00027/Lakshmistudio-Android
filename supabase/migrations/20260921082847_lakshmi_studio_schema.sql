/*
# LAKSHMI STUDIO - Complete Database Schema

## Overview
Creates the full database schema for a photography studio management app.
Single-tenant (no auth) — the owner uses the app directly with anon-key access.

## Tables Created
1. settings — studio business info
2. customers — customer records
3. services — studio services with variants and prices
4. bills — studio billing records
5. bill_items — line items on a studio bill
6. events — event bookings
7. frame_orders — frame & lamination orders
8. payments — payment records linked to bills/events/frame orders
9. staff — studio staff
10. event_staff — staff assignments to events
11. attendance — daily attendance marks
12. salary_records — salary payments
13. salary_advances — salary advance records
14. expenses — business expenses

## Security
- RLS enabled on all tables with anon+authenticated full CRUD (single-tenant).
*/

-- Settings (single row)
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL DEFAULT 'LAKSHMI STUDIO',
  tagline text NOT NULL DEFAULT 'since 1999',
  phone text NOT NULL DEFAULT '9444349125',
  address text DEFAULT '',
  max_events_per_day integer NOT NULL DEFAULT 8,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE TO anon, authenticated USING (true);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_customers" ON customers;
CREATE POLICY "anon_select_customers" ON customers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_customers" ON customers;
CREATE POLICY "anon_delete_customers" ON customers FOR DELETE TO anon, authenticated USING (true);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  variant text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_services" ON services;
CREATE POLICY "anon_select_services" ON services FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_services" ON services;
CREATE POLICY "anon_insert_services" ON services FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_services" ON services;
CREATE POLICY "anon_update_services" ON services FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_services" ON services;
CREATE POLICY "anon_delete_services" ON services FOR DELETE TO anon, authenticated USING (true);

-- Bills
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number text NOT NULL DEFAULT '',
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL DEFAULT 'Walk-in Customer',
  customer_phone text DEFAULT '',
  total_amount numeric NOT NULL DEFAULT 0,
  amount_received numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'Cash',
  bill_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_bills" ON bills;
CREATE POLICY "anon_select_bills" ON bills FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bills" ON bills;
CREATE POLICY "anon_insert_bills" ON bills FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bills" ON bills;
CREATE POLICY "anon_update_bills" ON bills FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bills" ON bills;
CREATE POLICY "anon_delete_bills" ON bills FOR DELETE TO anon, authenticated USING (true);

-- Bill Items
CREATE TABLE IF NOT EXISTS bill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  variant text DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_bill_items" ON bill_items;
CREATE POLICY "anon_select_bill_items" ON bill_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bill_items" ON bill_items;
CREATE POLICY "anon_insert_bill_items" ON bill_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bill_items" ON bill_items;
CREATE POLICY "anon_update_bill_items" ON bill_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bill_items" ON bill_items;
CREATE POLICY "anon_delete_bill_items" ON bill_items FOR DELETE TO anon, authenticated USING (true);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'Other',
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL DEFAULT '',
  customer_phone text DEFAULT '',
  event_date date NOT NULL,
  start_time text DEFAULT '',
  end_time text DEFAULT '',
  location text DEFAULT '',
  services text[] DEFAULT '{}',
  total_amount numeric NOT NULL DEFAULT 0,
  advance_received numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Booked',
  owner_approved boolean DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE TO anon, authenticated USING (true);

-- Frame Orders
CREATE TABLE IF NOT EXISTS frame_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL DEFAULT '',
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL DEFAULT '',
  customer_phone text DEFAULT '',
  order_type text NOT NULL DEFAULT 'Frame',
  size text DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  material text DEFAULT '',
  total_price numeric NOT NULL DEFAULT 0,
  amount_received numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  delivery_date date,
  status text NOT NULL DEFAULT 'New',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE frame_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_frame_orders" ON frame_orders;
CREATE POLICY "anon_select_frame_orders" ON frame_orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_frame_orders" ON frame_orders;
CREATE POLICY "anon_insert_frame_orders" ON frame_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_frame_orders" ON frame_orders;
CREATE POLICY "anon_update_frame_orders" ON frame_orders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_frame_orders" ON frame_orders;
CREATE POLICY "anon_delete_frame_orders" ON frame_orders FOR DELETE TO anon, authenticated USING (true);

-- Payments (FKs to bills, events, frame_orders — all created above)
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid REFERENCES bills(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  frame_order_id uuid REFERENCES frame_orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Cash',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  note text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_payments" ON payments;
CREATE POLICY "anon_select_payments" ON payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_payments" ON payments;
CREATE POLICY "anon_update_payments" ON payments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_payments" ON payments;
CREATE POLICY "anon_delete_payments" ON payments FOR DELETE TO anon, authenticated USING (true);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text DEFAULT '',
  role text NOT NULL DEFAULT 'Photographer',
  monthly_salary numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_staff" ON staff;
CREATE POLICY "anon_select_staff" ON staff FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_staff" ON staff;
CREATE POLICY "anon_insert_staff" ON staff FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_staff" ON staff;
CREATE POLICY "anon_update_staff" ON staff FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_staff" ON staff;
CREATE POLICY "anon_delete_staff" ON staff FOR DELETE TO anon, authenticated USING (true);

-- Event Staff (FKs to events + staff — both created above)
CREATE TABLE IF NOT EXISTS event_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Photographer',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE event_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_event_staff" ON event_staff;
CREATE POLICY "anon_select_event_staff" ON event_staff FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_event_staff" ON event_staff;
CREATE POLICY "anon_insert_event_staff" ON event_staff FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_event_staff" ON event_staff;
CREATE POLICY "anon_update_event_staff" ON event_staff FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_event_staff" ON event_staff;
CREATE POLICY "anon_delete_event_staff" ON event_staff FOR DELETE TO anon, authenticated USING (true);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status text NOT NULL DEFAULT 'P',
  created_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, attendance_date)
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_attendance" ON attendance;
CREATE POLICY "anon_select_attendance" ON attendance FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_attendance" ON attendance;
CREATE POLICY "anon_insert_attendance" ON attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_attendance" ON attendance;
CREATE POLICY "anon_update_attendance" ON attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_attendance" ON attendance;
CREATE POLICY "anon_delete_attendance" ON attendance FOR DELETE TO anon, authenticated USING (true);

-- Salary Records
CREATE TABLE IF NOT EXISTS salary_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  month text NOT NULL DEFAULT '',
  note text DEFAULT '',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_salary_records" ON salary_records;
CREATE POLICY "anon_select_salary_records" ON salary_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_salary_records" ON salary_records;
CREATE POLICY "anon_insert_salary_records" ON salary_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_salary_records" ON salary_records;
CREATE POLICY "anon_update_salary_records" ON salary_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_salary_records" ON salary_records;
CREATE POLICY "anon_delete_salary_records" ON salary_records FOR DELETE TO anon, authenticated USING (true);

-- Salary Advances
CREATE TABLE IF NOT EXISTS salary_advances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  note text DEFAULT '',
  advance_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE salary_advances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_salary_advances" ON salary_advances;
CREATE POLICY "anon_select_salary_advances" ON salary_advances FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_salary_advances" ON salary_advances;
CREATE POLICY "anon_insert_salary_advances" ON salary_advances FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_salary_advances" ON salary_advances;
CREATE POLICY "anon_update_salary_advances" ON salary_advances FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_salary_advances" ON salary_advances;
CREATE POLICY "anon_delete_salary_advances" ON salary_advances FOR DELETE TO anon, authenticated USING (true);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'Other',
  description text DEFAULT '',
  amount numeric NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'Cash',
  expense_date date NOT NULL DEFAULT CURRENT_DATE,
  related_event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_expenses" ON expenses;
CREATE POLICY "anon_select_expenses" ON expenses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_expenses" ON expenses;
CREATE POLICY "anon_insert_expenses" ON expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_expenses" ON expenses;
CREATE POLICY "anon_update_expenses" ON expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_expenses" ON expenses;
CREATE POLICY "anon_delete_expenses" ON expenses FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_customer ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_frame_orders_status ON frame_orders(status);
CREATE INDEX IF NOT EXISTS idx_frame_orders_delivery ON frame_orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_payments_bill ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_event ON payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_frame ON payments(frame_order_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_salary_records_staff ON salary_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_salary_advances_staff ON salary_advances(staff_id);
CREATE INDEX IF NOT EXISTS idx_event_staff_event ON event_staff(event_id);
CREATE INDEX IF NOT EXISTS idx_event_staff_staff ON event_staff(staff_id);
