export const PAYMENT_METHODS = [
  'Cash',
  'UPI',
  'Card',
  'Bank Transfer',
  'Other',
] as const;

export const EVENT_TYPES = [
  'Wedding',
  'Reception',
  'Birthday',
  'Engagement',
  'Corporate',
  'Other',
] as const;

export const EVENT_SERVICES = [
  'Photography',
  'Videography',
  'Candid Photography',
  'Drone',
  'Photobooth',
  'Album',
  'Other',
] as const;

export const EVENT_STATUSES = [
  'Booked',
  'Confirmed',
  'Completed',
  'Cancelled',
] as const;

export const FRAME_ORDER_TYPES = [
  'Frame',
  'Lamination',
  'Frame + Lamination',
  'Other',
] as const;

export const FRAME_ORDER_STATUSES = [
  'New',
  'Processing',
  'Ready',
  'Delivered',
  'Cancelled',
] as const;

export const STAFF_ROLES = [
  'Lead Photographer',
  'Photographer',
  'Second Photographer',
  'Videographer',
  'Cinematographer',
  'Drone Operator',
  'Photo Editor',
  'Video Editor',
  'Retoucher',
  'Album Designer',
  'Studio Manager',
  'Production Coordinator',
  'Lighting Technician',
  'Makeup Artist',
  'Photo Booth Attendant',
  'Set Designer',
  'Sales Executive',
  'Customer Relations',
  'Receptionist',
  'Lab Technician',
  'Equipment Manager',
  'Driver',
  'Office Assistant',
  'Intern',
] as const;

export const EVENT_STAFF_ROLES = [
  'Lead Photographer',
  'Photographer',
  'Second Photographer',
  'Videographer',
  'Cinematographer',
  'Drone Operator',
  'Photo Editor',
  'Video Editor',
  'Assistant',
  'Makeup Artist',
] as const;

export const ATTENDANCE_STATUSES = [
  { key: 'P', label: 'Present', color: 'success' },
  { key: 'A', label: 'Absent', color: 'error' },
  { key: 'L', label: 'Leave', color: 'warning' },
  { key: 'E', label: 'Event Duty', color: 'info' },
] as const;

export const EXPENSE_CATEGORIES = [
  'Salary',
  'Travel',
  'Fuel',
  'Electricity',
  'Rent',
  'Equipment',
  'Printing',
  'Paper Cost',
  'Printer Cartridge',
  'Frame Materials',
  'Frame',
  'Board',
  'Lamination Materials',
  'Maintenance',
  'Maintenance Box',
  'Food',
  'Advertising',
  'Chemicals',
  'Ink',
  'Other',
] as const;

export const STATUS_COLORS: Record<string, string> = {
  Confirmed: 'success',
  Booked: 'info',
  Pending: 'warning',
  Ready: 'success',
  Processing: 'info',
  Delivered: 'neutral',
  Completed: 'neutral',
  Cancelled: 'error',
  New: 'warning',
  Paid: 'success',
  'Partially Paid': 'warning',
  Active: 'success',
  Inactive: 'neutral',
};
