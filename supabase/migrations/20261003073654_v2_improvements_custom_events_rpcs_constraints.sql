-- Add custom_event_types column to settings for persistent custom event types
ALTER TABLE settings ADD COLUMN IF NOT EXISTS custom_event_types text[] DEFAULT '{}';

-- Add unique constraint on customers (name + phone) to prevent duplicates
-- Only when phone is not empty
CREATE UNIQUE INDEX IF NOT EXISTS customers_name_phone_uniq 
ON customers (lower(name), phone) 
WHERE phone != '';

-- Add unique constraint on staff (name + phone) 
CREATE UNIQUE INDEX IF NOT EXISTS staff_name_phone_uniq
ON staff (lower(name), phone)
WHERE phone != '';

-- Add unique constraint on bills bill_number
CREATE UNIQUE INDEX IF NOT EXISTS bills_bill_number_uniq ON bills (bill_number) WHERE bill_number != '';

-- Add unique constraint on frame_orders order_number
CREATE UNIQUE INDEX IF NOT EXISTS frame_orders_order_number_uniq ON frame_orders (order_number) WHERE order_number != '';

-- RPC function for atomic bill creation (bill + items + payment in one transaction)
CREATE OR REPLACE FUNCTION create_bill_with_items(
  p_bill_number text,
  p_customer_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_total_amount numeric,
  p_amount_received numeric,
  p_balance numeric,
  p_payment_method text,
  p_bill_date date,
  p_items jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bill_id uuid;
  v_item jsonb;
BEGIN
  -- Insert the bill
  INSERT INTO bills (bill_number, customer_id, customer_name, customer_phone, total_amount, amount_received, balance, payment_method, bill_date)
  VALUES (p_bill_number, p_customer_id, p_customer_name, p_customer_phone, p_total_amount, p_amount_received, p_balance, p_payment_method, p_bill_date)
  RETURNING id INTO v_bill_id;
  
  -- Insert bill items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO bill_items (bill_id, service_name, variant, quantity, price, discount, total)
    VALUES (
      v_bill_id,
      v_item->>'service_name',
      v_item->>'variant',
      (v_item->>'quantity')::integer,
      (v_item->>'price')::numeric,
      (v_item->>'discount')::numeric,
      (v_item->>'total')::numeric
    );
  END LOOP;
  
  -- Insert initial payment if amount received > 0
  IF p_amount_received > 0 THEN
    INSERT INTO payments (bill_id, amount, payment_method, payment_date, note)
    VALUES (v_bill_id, p_amount_received, p_payment_method, p_bill_date, 'Initial payment');
  END IF;
  
  RETURN jsonb_build_object('bill_id', v_bill_id, 'success', true);
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION create_bill_with_items TO anon, authenticated;

-- RPC for atomic frame order creation
CREATE OR REPLACE FUNCTION create_frame_order_with_payment(
  p_order_number text,
  p_customer_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_order_type text,
  p_size text,
  p_quantity integer,
  p_material text,
  p_total_price numeric,
  p_amount_received numeric,
  p_balance numeric,
  p_delivery_date date,
  p_notes text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  INSERT INTO frame_orders (order_number, customer_id, customer_name, customer_phone, order_type, size, quantity, material, total_price, amount_received, balance, delivery_date, status, notes)
  VALUES (p_order_number, p_customer_id, p_customer_name, p_customer_phone, p_order_type, p_size, p_quantity, p_material, p_total_price, p_amount_received, p_balance, p_delivery_date, 'New', p_notes)
  RETURNING id INTO v_order_id;
  
  IF p_amount_received > 0 THEN
    INSERT INTO payments (frame_order_id, amount, payment_method, payment_date, note)
    VALUES (v_order_id, p_amount_received, 'Cash', CURRENT_DATE, 'Advance payment');
  END IF;
  
  RETURN jsonb_build_object('order_id', v_order_id, 'success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION create_frame_order_with_payment TO anon, authenticated;

-- RPC for atomic event creation with advance payment
CREATE OR REPLACE FUNCTION create_event_with_payment(
  p_event_type text,
  p_customer_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_event_date date,
  p_start_time text,
  p_end_time text,
  p_location text,
  p_services text[],
  p_total_amount numeric,
  p_advance_received numeric,
  p_balance numeric,
  p_status text,
  p_owner_approved boolean,
  p_notes text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO events (event_type, customer_id, customer_name, customer_phone, event_date, start_time, end_time, location, services, total_amount, advance_received, balance, status, owner_approved, notes)
  VALUES (p_event_type, p_customer_id, p_customer_name, p_customer_phone, p_event_date, p_start_time, p_end_time, p_location, p_services, p_total_amount, p_advance_received, p_balance, p_status, p_owner_approved, p_notes)
  RETURNING id INTO v_event_id;
  
  IF p_advance_received > 0 THEN
    INSERT INTO payments (event_id, amount, payment_method, payment_date, note)
    VALUES (v_event_id, p_advance_received, 'Cash', CURRENT_DATE, 'Advance payment');
  END IF;
  
  RETURN jsonb_build_object('event_id', v_event_id, 'success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION create_event_with_payment TO anon, authenticated;
