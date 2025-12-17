
export interface Booking {
  "رقم الحجز": string;
  "اسم الموظف": string;
  "الإدارة": string;
  "عنوان الاجتماع": string;
  "نوع الاجتماع": 'داخلي' | 'خارجي';
  "من": string; // Custom DateTime string e.g., "2025/11/12 02:00 PM"
  "إلى": string; // Custom DateTime string e.g., "3:00:00 م 2025/11/12"
  "عدد الحضور": number;
  "القاعة": string;
  "الحالة": 'قيد الانتظار' | 'معتمد' | 'مرفوض' | string;
  "الضيافة": string;
  "الملاحظات": string;
  "تاريخ العملية"?: string;
  "وقت العملية"?: string;
  email?: string;
}

export interface Hospitality {
  "نوع الاجتماع": 'داخلي' | 'خارجي';
  "نوع الضيافة": string;
  "الملاحظات": string;
}

export interface Room {
  "اسم القاعة": string;
  "الموقع": string;
  "السعة": number;
  "متاحة": 'نعم' | 'لا';
}

export interface DashboardEntry {
  "المؤشر": string;
  "القيمة": string | number;
  "الملاحظات": string;
}

export interface ApiData {
  Bookings: Booking[];
  Hospitality: Hospitality[];
  Rooms: Room[];
  Dashboard: DashboardEntry[];
}

export type ViewType = 'dashboard' | 'bookings' | 'hospitality' | 'rooms' | 'admin' | 'today';
