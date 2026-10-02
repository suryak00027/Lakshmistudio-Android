import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type Language = 'en' | 'ta';

export const translations = {
  en: {
    // Sidebar
    'nav.main': 'Main',
    'nav.management': 'Management',
    'nav.system': 'System',
    'nav.dashboard': 'Dashboard',
    'nav.studio': 'Studio',
    'nav.events': 'Events',
    'nav.frames': 'Frames & Lamination',
    'nav.customers': 'Customers',
    'nav.staff': 'Staff',
    'nav.expenses': 'Expenses',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.darkMode': 'Dark Mode',
    'nav.lightMode': 'Light Mode',
    'nav.logout': 'Logout',
    'nav.owner': 'Owner / Admin',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.add': 'Add',
    'common.delete': 'Delete',
    'common.remove': 'Remove',
    'common.edit': 'Edit',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.saving': 'Saving...',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.back': 'Back',
    'common.close': 'Close',
    'common.optional': 'Optional',
    'common.notes': 'Notes',
    'common.name': 'Name',
    'common.phone': 'Phone',
    'common.role': 'Role',
    'common.salary': 'Salary',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.amount': 'Amount',
    'common.total': 'Total',
    'common.actions': 'Actions',
    'common.all': 'All',
    'common.none': 'None',
    'common.since': 'since 1999',

    // Staff page
    'staff.title': 'Staff',
    'staff.subtitle': 'Manage studio team, attendance and salary',
    'staff.addStaff': 'Add Staff',
    'staff.noStaff': 'No staff yet',
    'staff.noStaffMsg': 'Add your studio team members to manage attendance and salary.',
    'staff.namePlaceholder': 'Staff name',
    'staff.phonePlaceholder': 'Phone number',
    'staff.monthlySalary': 'Monthly Salary',
    'staff.salaryPlaceholder': '0',
    'staff.notesPlaceholder': 'Optional notes',
    'staff.addedSuccess': 'Staff added successfully',
    'staff.enterName': 'Please enter the staff name.',
    'staff.photoUnder5mb': 'Image must be under 5MB.',
    'staff.removePhoto': 'Remove photo',
    'staff.cropPhoto': 'Crop Staff Photo',
    'staff.perMonth': '/mo',
    'staff.backToStaff': 'Back to Staff',
    'staff.profile': 'Profile',
    'staff.eventAssignments': 'Event Assignments',
    'staff.noAssignments': 'No event assignments.',
    'staff.overview': 'overview',
    'staff.attendance': 'attendance',
    'staff.salaryTab': 'salary',
    'staff.salarySummary': 'Salary Summary',
    'staff.advances': 'Advances',
    'staff.paid': 'Paid',
    'staff.remaining': 'Remaining',
    'staff.salaryPayment': 'Salary Payment',
    'staff.salaryAdvance': 'Salary Advance',
    'staff.paymentHistory': 'Payment History',
    'staff.advanceHistory': 'Advance History',
    'staff.noPayments': 'No payments recorded.',
    'staff.noAdvances': 'No advances recorded.',
    'staff.recordSalaryPayment': 'Record Salary Payment',
    'staff.recordSalaryAdvance': 'Record Salary Advance',
    'staff.enterValidAmount': 'Please enter a valid amount.',
    'staff.salaryPaymentRecorded': 'Salary payment recorded',
    'staff.salaryAdvanceRecorded': 'Salary advance recorded',
    'staff.removeStaff': 'Remove Staff',
    'staff.removeConfirm': 'Are you sure you want to remove',
    'staff.cannotUndo': 'This cannot be undone.',
    'staff.notFound': 'Staff member not found.',
    'staff.memberRemoved': 'Staff member removed',
    'staff.present': 'Present',
    'staff.absent': 'Absent',
    'staff.leave': 'Leave',
    'staff.eventDuty': 'Event Duty',
    'staff.netPayable': 'Net Payable',
    'staff.advanceDeductionNote': 'Advances are deducted from monthly salary',

    // Settings page
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your studio configuration',
    'settings.businessInfo': 'Business Information',
    'settings.businessName': 'Business Name',
    'settings.tagline': 'Tagline',
    'settings.address': 'Address',
    'settings.maxEvents': 'Maximum Events Per Day',
    'settings.studioLogo': 'Studio Logo',
    'settings.clickToUpload': 'Click the camera icon to upload a logo',
    'settings.removeNewLogo': 'Remove new logo',
    'settings.saveSettings': 'Save Settings',
    'settings.savedSuccess': 'Settings saved successfully',
    'settings.logoUnder5mb': 'Logo must be under 5MB.',
    'settings.studioServices': 'Studio Services',
    'settings.addService': 'Add Service',
    'settings.serviceName': 'Service name',
    'settings.variant': 'Variant',
    'settings.price': 'Price',
    'settings.serviceAdded': 'Service added successfully',
    'settings.enterServiceName': 'Please enter a service name.',
    'settings.serviceRemoved': 'Service removed',
    'settings.eventTypes': 'Event Types',
    'settings.addEventType': 'Add Event Type',
    'settings.eventTypeExists': 'This event type already exists.',
    'settings.eventTypeAdded': 'Event type added',
    'settings.cropLogo': 'Crop Logo',
    'settings.language': 'Language',
    'settings.english': 'English',
    'settings.tamil': 'தமிழ்',

    // Dashboard
    'dashboard.greetingMorning': 'Good Morning',
    'dashboard.greetingAfternoon': 'Good Afternoon',
    'dashboard.greetingEvening': 'Good Evening',
    'dashboard.welcome': 'Welcome back to Lakshmi Studio',
    'dashboard.totalRevenue': 'Total Revenue',
    'dashboard.pendingPayments': 'Pending Payments',
    'dashboard.todayEvents': "Today's Events",
    'dashboard.upcomingEvents': 'Upcoming Events',
    'dashboard.activeOrders': 'Active Orders',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.newBill': 'New Bill',
    'dashboard.newEvent': 'New Event',
    'dashboard.newFrameOrder': 'New Frame Order',
    'dashboard.viewReports': 'View Reports',

    // Customers
    'customers.title': 'Customers',
    'customers.subtitle': 'Manage your customer relationships',
    'customers.addCustomer': 'Add Customer',
    'customers.noCustomers': 'No customers yet',
    'customers.noCustomersMsg': 'Add customers to track events and orders.',
    'customers.customerName': 'Customer name',
    'customers.customerPhone': 'Phone number',
    'customers.addedSuccess': 'Customer added successfully',
    'customers.enterName': 'Please enter a customer name.',

    // Events
    'events.title': 'Events',
    'events.subtitle': 'Manage event bookings and assignments',
    'events.addEvent': 'Add Event',
    'events.noEvents': 'No events yet',
    'events.eventType': 'Event Type',
    'events.customerName': 'Customer Name',
    'events.eventDate': 'Event Date',
    'events.location': 'Location',
    'events.totalAmount': 'Total Amount',
    'events.advanceReceived': 'Advance Received',
    'events.balance': 'Balance',
    'events.status': 'Status',
    'events.services': 'Services',

    // Frames
    'frames.title': 'Frames & Lamination',
    'frames.subtitle': 'Manage frame and lamination orders',
    'frames.addOrder': 'Add Order',
    'frames.noOrders': 'No orders yet',
    'frames.orderType': 'Order Type',
    'frames.size': 'Size',
    'frames.quantity': 'Quantity',
    'frames.material': 'Material',
    'frames.totalPrice': 'Total Price',
    'frames.deliveryDate': 'Delivery Date',

    // Expenses
    'expenses.title': 'Expenses',
    'expenses.subtitle': 'Track and manage studio expenses',
    'expenses.addExpense': 'Add Expense',
    'expenses.noExpenses': 'No expenses recorded yet',
    'expenses.category': 'Category',
    'expenses.description': 'Description',
    'expenses.paymentMethod': 'Payment Method',
    'expenses.expenseDate': 'Expense Date',

    // Reports
    'reports.title': 'Reports',
    'reports.subtitle': 'Financial overview and analytics',
    'reports.revenueOverview': 'Revenue Overview',
    'reports.expenseOverview': 'Expense Overview',
    'reports.profitLoss': 'Profit & Loss',
    'reports.exportReport': 'Export Report',

    // Studio
    'studio.title': 'Studio',
    'studio.subtitle': 'Create bills and manage point of sale',
    'studio.newBill': 'New Bill',
    'studio.billNumber': 'Bill Number',
    'studio.customer': 'Customer',
    'studio.items': 'Items',
    'studio.addItem': 'Add Item',
    'studio.subtotal': 'Subtotal',
    'studio.discount': 'Discount',
    'studio.grandTotal': 'Grand Total',
    'studio.amountReceived': 'Amount Received',
    'studio.balance': 'Balance',
    'studio.saveBill': 'Save Bill',
    'studio.selectCustomer': 'Select Customer',
    'studio.walkInCustomer': 'Walk-in Customer',
    'studio.addNewCustomer': 'Add New Customer',
  },
  ta: {
    // Sidebar
    'nav.main': 'முக்கிய',
    'nav.management': 'நிர்வாகம்',
    'nav.system': 'அமைப்பு',
    'nav.dashboard': 'டாஷ்போர்ட்',
    'nav.studio': 'ஸ்டுடியோ',
    'nav.events': 'நிகழ்வுகள்',
    'nav.frames': 'பிரேம் & லாமினேஷன்',
    'nav.customers': 'வாடிக்கையாளர்கள்',
    'nav.staff': 'ஊழியர்கள்',
    'nav.expenses': 'செலவுகள்',
    'nav.reports': 'அறிக்கைகள்',
    'nav.settings': 'அமைப்புகள்',
    'nav.darkMode': 'இருண்ட பயன்முறை',
    'nav.lightMode': 'வெளிச்ச பயன்முறை',
    'nav.logout': 'வெளியேறு',
    'nav.owner': 'உரிமையாளர் / நிர்வாகி',

    // Common
    'common.save': 'சேமி',
    'common.cancel': 'ரத்து',
    'common.add': 'சேர்',
    'common.delete': 'நீக்கு',
    'common.remove': 'அகற்று',
    'common.edit': 'திருத்து',
    'common.search': 'தேடு',
    'common.loading': 'ஏற்றுகிறது...',
    'common.saving': 'சேமிக்கிறது...',
    'common.confirm': 'உறுதிசெய்',
    'common.yes': 'ஆம்',
    'common.no': 'இல்லை',
    'common.back': 'பின்',
    'common.close': 'மூடு',
    'common.optional': 'விருப்பத்தேர்வு',
    'common.notes': 'குறிப்புகள்',
    'common.name': 'பெயர்',
    'common.phone': 'தொலைபேசி',
    'common.role': 'பங்கு',
    'common.salary': 'சம்பளம்',
    'common.status': 'நிலை',
    'common.date': 'தேதி',
    'common.amount': 'தொகை',
    'common.total': 'மொத்தம்',
    'common.actions': 'செயல்கள்',
    'common.all': 'அனைத்தும்',
    'common.none': 'எதுவுமில்லை',
    'common.since': '1999 முதல்',

    // Staff page
    'staff.title': 'ஊழியர்கள்',
    'staff.subtitle': 'ஸ்டுடியோ அணியை, வருகை மற்றும் சம்பளத்தை நிர்வகிக்கவும்',
    'staff.addStaff': 'ஊழியர் சேர்',
    'staff.noStaff': 'இன்னும் ஊழியர்கள் இல்லை',
    'staff.noStaffMsg': 'வருகை மற்றும் சம்பளத்தை நிர்வகிக்க உங்கள் ஸ்டுடியோ அணியைச் சேர்க்கவும்.',
    'staff.namePlaceholder': 'ஊழியர் பெயர்',
    'staff.phonePlaceholder': 'தொலைபேசி எண்',
    'staff.monthlySalary': 'மாதாந்திர சம்பளம்',
    'staff.salaryPlaceholder': '0',
    'staff.notesPlaceholder': 'விருப்பத்தேர்வு குறிப்புகள்',
    'staff.addedSuccess': 'ஊழியர் வெற்றிகரமாக சேர்க்கப்பட்டார்',
    'staff.enterName': 'ஊழியர் பெயரை உள்ளிடவும்.',
    'staff.photoUnder5mb': 'படம் 5MB க்கும் குறைவாக இருக்க வேண்டும்.',
    'staff.removePhoto': 'படத்தை அகற்று',
    'staff.cropPhoto': 'ஊழியர் படத்தை செதுக்கு',
    'staff.perMonth': '/மாதம்',
    'staff.backToStaff': 'ஊழியர்களுக்கு திரும்பு',
    'staff.profile': 'சுயவிவரம்',
    'staff.eventAssignments': 'நிகழ்வு ஒதுக்கீடுகள்',
    'staff.noAssignments': 'நிகழ்வு ஒதுக்கீடுகள் இல்லை.',
    'staff.overview': 'கண்ணோட்டம்',
    'staff.attendance': 'வருகை',
    'staff.salaryTab': 'சம்பளம்',
    'staff.salarySummary': 'சம்பள சுருக்கம்',
    'staff.advances': 'முன்பணம்',
    'staff.paid': 'செலுத்தப்பட்டது',
    'staff.remaining': 'மீதம்',
    'staff.salaryPayment': 'சம்பள செலுத்து',
    'staff.salaryAdvance': 'சம்பள முன்பணம்',
    'staff.paymentHistory': 'செலுத்து வரலாறு',
    'staff.advanceHistory': 'முன்பணம் வரலாறு',
    'staff.noPayments': 'செலுத்துகள் பதிவு செய்யப்படவில்லை.',
    'staff.noAdvances': 'முன்பணங்கள் பதிவு செய்யப்படவில்லை.',
    'staff.recordSalaryPayment': 'சம்பள செலுத்து பதிவு',
    'staff.recordSalaryAdvance': 'சம்பள முன்பணம் பதிவு',
    'staff.enterValidAmount': 'சரியான தொகையை உள்ளிடவும்.',
    'staff.salaryPaymentRecorded': 'சம்பள செலுத்து பதிவு செய்யப்பட்டது',
    'staff.salaryAdvanceRecorded': 'சம்பள முன்பணம் பதிவு செய்யப்பட்டது',
    'staff.removeStaff': 'ஊழியர் அகற்று',
    'staff.removeConfirm': 'நீக்க விரும்புகிறீர்களா',
    'staff.cannotUndo': 'இதை செயல்தவிர்க்க முடியாது.',
    'staff.notFound': 'ஊழியர் காணப்படவில்லை.',
    'staff.memberRemoved': 'ஊழியர் அகற்றப்பட்டார்',
    'staff.present': 'வருகை',
    'staff.absent': 'வரவில்லை',
    'staff.leave': 'விடுப்பு',
    'staff.eventDuty': 'நிகழ்வு கடமை',
    'staff.netPayable': 'நிகர செலுத்தத்தக்கது',
    'staff.advanceDeductionNote': 'முன்பணம் மாதாந்திர சம்பளத்திலிருந்து கழிக்கப்படும்',

    // Settings page
    'settings.title': 'அமைப்புகள்',
    'settings.subtitle': 'உங்கள் ஸ்டுடியோ கட்டமைப்பை நிர்வகிக்கவும்',
    'settings.businessInfo': 'வணிக தகவல்',
    'settings.businessName': 'வணிக பெயர்',
    'settings.tagline': 'குறிக்கோள்',
    'settings.address': 'முகவரி',
    'settings.maxEvents': 'ஒரு நாளைய அதிகபட்ச நிகழ்வுகள்',
    'settings.studioLogo': 'ஸ்டுடியோ லோகோ',
    'settings.clickToUpload': 'லோகோ பதிவேற்ற கேமரா ஐகானை க்ளிக் செய்யவும்',
    'settings.removeNewLogo': 'புதிய லோகோவை அகற்று',
    'settings.saveSettings': 'அமைப்புகளை சேமி',
    'settings.savedSuccess': 'அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன',
    'settings.logoUnder5mb': 'லோகோ 5MB க்கும் குறைவாக இருக்க வேண்டும்.',
    'settings.studioServices': 'ஸ்டுடியோ சேவைகள்',
    'settings.addService': 'சேவை சேர்',
    'settings.serviceName': 'சேவை பெயர்',
    'settings.variant': 'வகை',
    'settings.price': 'விலை',
    'settings.serviceAdded': 'சேவை வெற்றிகரமாக சேர்க்கப்பட்டது',
    'settings.enterServiceName': 'சேவை பெயரை உள்ளிடவும்.',
    'settings.serviceRemoved': 'சேவை அகற்றப்பட்டது',
    'settings.eventTypes': 'நிகழ்வு வகைகள்',
    'settings.addEventType': 'நிகழ்வு வகை சேர்',
    'settings.eventTypeExists': 'இந்த நிகழ்வு வகை ஏற்கனவே உள்ளது.',
    'settings.eventTypeAdded': 'நிகழ்வு வகை சேர்க்கப்பட்டது',
    'settings.cropLogo': 'லோகோ செதுக்கு',
    'settings.language': 'மொழி',
    'settings.english': 'English',
    'settings.tamil': 'தமிழ்',

    // Dashboard
    'dashboard.greetingMorning': 'காலை வணக்கம்',
    'dashboard.greetingAfternoon': 'மதிய வணக்கம்',
    'dashboard.greetingEvening': 'மாலை வணக்கம்',
    'dashboard.welcome': 'லட்சுமி ஸ்டுடியோவிற்கு மீண்டும் வரவேற்கிறோம்',
    'dashboard.totalRevenue': 'மொத்த வருவாய்',
    'dashboard.pendingPayments': 'நிலுவை செலுத்துகள்',
    'dashboard.todayEvents': 'இன்றைய நிகழ்வுகள்',
    'dashboard.upcomingEvents': 'வரவிருக்கும் நிகழ்வுகள்',
    'dashboard.activeOrders': 'செயலில் உள்ள ஆர்டர்கள்',
    'dashboard.recentActivity': 'சமீபத்திய செயல்பாடுகள்',
    'dashboard.quickActions': 'விரைவு செயல்கள்',
    'dashboard.newBill': 'புதிய பில்',
    'dashboard.newEvent': 'புதிய நிகழ்வு',
    'dashboard.newFrameOrder': 'புதிய பிரேம் ஆர்டர்',
    'dashboard.viewReports': 'அறிக்கைகளை காண்க',

    // Customers
    'customers.title': 'வாடிக்கையாளர்கள்',
    'customers.subtitle': 'உங்கள் வாடிக்கையாளர் உறவுகளை நிர்வகிக்கவும்',
    'customers.addCustomer': 'வாடிக்கையாளர் சேர்',
    'customers.noCustomers': 'இன்னும் வாடிக்கையாளர்கள் இல்லை',
    'customers.noCustomersMsg': 'நிகழ்வுகள் மற்றும் ஆர்டர்களை கண்காணிக்க வாடிக்கையாளர்களை சேர்க்கவும்.',
    'customers.customerName': 'வாடிக்கையாளர் பெயர்',
    'customers.customerPhone': 'தொலைபேசி எண்',
    'customers.addedSuccess': 'வாடிக்கையாளர் வெற்றிகரமாக சேர்க்கப்பட்டார்',
    'customers.enterName': 'வாடிக்கையாளர் பெயரை உள்ளிடவும்.',

    // Events
    'events.title': 'நிகழ்வுகள்',
    'events.subtitle': 'நிகழ்வு முன்பதிவுகள் மற்றும் ஒதுக்கீடுகளை நிர்வகிக்கவும்',
    'events.addEvent': 'நிகழ்வு சேர்',
    'events.noEvents': 'இன்னும் நிகழ்வுகள் இல்லை',
    'events.eventType': 'நிகழ்வு வகை',
    'events.customerName': 'வாடிக்கையாளர் பெயர்',
    'events.eventDate': 'நிகழ்வு தேதி',
    'events.location': 'இடம்',
    'events.totalAmount': 'மொத்த தொகை',
    'events.advanceReceived': 'பெறப்பட்ட முன்பணம்',
    'events.balance': 'நிலுவை',
    'events.status': 'நிலை',
    'events.services': 'சேவைகள்',

    // Frames
    'frames.title': 'பிரேம் & லாமினேஷன்',
    'frames.subtitle': 'பிரேம் மற்றும் லாமினேஷன் ஆர்டர்களை நிர்வகிக்கவும்',
    'frames.addOrder': 'ஆர்டர் சேர்',
    'frames.noOrders': 'இன்னும் ஆர்டர்கள் இல்லை',
    'frames.orderType': 'ஆர்டர் வகை',
    'frames.size': 'அளவு',
    'frames.quantity': 'அளவு',
    'frames.material': 'பொருள்',
    'frames.totalPrice': 'மொத்த விலை',
    'frames.deliveryDate': 'டெலிவரி தேதி',

    // Expenses
    'expenses.title': 'செலவுகள்',
    'expenses.subtitle': 'ஸ்டுடியோ செலவுகளை கண்காணித்து நிர்வகிக்கவும்',
    'expenses.addExpense': 'செலவு சேர்',
    'expenses.noExpenses': 'இன்னும் செலவுகள் பதிவு செய்யப்படவில்லை',
    'expenses.category': 'பிரிவு',
    'expenses.description': 'விளக்கம்',
    'expenses.paymentMethod': 'செலுத்து முறை',
    'expenses.expenseDate': 'செலவு தேதி',

    // Reports
    'reports.title': 'அறிக்கைகள்',
    'reports.subtitle': 'நிதி கண்ணோட்டம் மற்றும் பகுப்பாய்வு',
    'reports.revenueOverview': 'வருவாய் கண்ணோட்டம்',
    'reports.expenseOverview': 'செலவு கண்ணோட்டம்',
    'reports.profitLoss': 'லாப நஷ்டம்',
    'reports.exportReport': 'அறிக்கை ஏற்றுமதி',

    // Studio
    'studio.title': 'ஸ்டுடியோ',
    'studio.subtitle': 'பில்களை உருவாக்கி விற்பனை மையத்தை நிர்வகிக்கவும்',
    'studio.newBill': 'புதிய பில்',
    'studio.billNumber': 'பில் எண்',
    'studio.customer': 'வாடிக்கையாளர்',
    'studio.items': 'பொருட்கள்',
    'studio.addItem': 'பொருள் சேர்',
    'studio.subtotal': 'துணை மொத்தம்',
    'studio.discount': 'தள்ளை',
    'studio.grandTotal': 'மொத்த தொகை',
    'studio.amountReceived': 'பெறப்பட்ட தொகை',
    'studio.balance': 'நிலுவை',
    'studio.saveBill': 'பில் சேமி',
    'studio.selectCustomer': 'வாடிக்கையாளர் தேர்ந்தெடு',
    'studio.walkInCustomer': 'நேரடி வாடிக்கையாளர்',
    'studio.addNewCustomer': 'புதிய வாடிக்கையாளர் சேர்',
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface LanguageContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggle: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

const STORAGE_KEY = 'lakshmi-language';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ta' || saved === 'en') return saved;
    }
    return 'en';
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === 'en' ? 'ta' : 'en');
  }, [lang, setLang]);

  const t = useCallback((key: TranslationKey) => {
    return translations[lang][key] || translations.en[key] || key;
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
