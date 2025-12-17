
import React from 'react';
import { Booking } from '../types';
import Modal from './Modal';
import { UserCircleIcon, CalendarIcon, ClockIcon, LocationMarkerIcon, UsersIcon, InfoIcon, CoffeeIcon, EmailIcon } from './icons/Icons';

interface BookingDetailsModalProps {
  booking: Booking;
  onClose: () => void;
}

const parseCustomDateTime = (dateString?: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;
  const normalizedString = dateString.replace(/م/g, 'PM').replace(/ص/g, 'AM').replace(/\//g, '-');
  
  let date = new Date(normalizedString);
  if (!isNaN(date.getTime())) return date;
  
  const arabicFormatRegex = /(\d{1,2}:\d{2}:\d{2})\s*(AM|PM)\s*(\d{4}-\d{2}-\d{2})/;
  const match = normalizedString.match(arabicFormatRegex);
  if (match) {
    const time = match[1]; const ampm = match[2]; const datePart = match[3];
    date = new Date(`${datePart} ${time} ${ampm}`);
    if (!isNaN(date.getTime())) return date;
  }

  date = new Date(dateString);
  if (!isNaN(date.getTime())) return date;
  
  return null;
};

const formatDate = (dateString?: string): string => {
    if (!dateString) return 'غير محدد';
    const date = parseCustomDateTime(dateString);
    if (!date) return dateString;
    return date.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatTimeRange = (startString?: string, endString?: string): string => {
    if (!startString || !endString) return 'غير محدد';
    const startDate = parseCustomDateTime(startString);
    const endDate = parseCustomDateTime(endString);
    if (!startDate || !endDate) return 'غير محدد';
    
    const startTime = startDate.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTime = endDate.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit', hour12: true });

    return `${startTime} - ${endTime}`;
};

const getStatusChip = (status: string) => {
    switch (status) {
        case 'معتمد': return 'bg-green-100 text-green-800';
        case 'قيد الانتظار': return 'bg-yellow-100 text-yellow-800';
        case 'مرفوض': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: string | number | React.ReactNode;}> = ({ icon, label, value }) => (
    <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-light-gray">
        <div className="flex-shrink-0">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-semibold text-text-dark">{value}</p>
        </div>
    </div>
);

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose }) => {
  return (
    <Modal onClose={onClose} title={booking['عنوان الاجتماع']}>
        <div className="space-y-4">
            <div className="p-4 bg-light-gray rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem 
                        icon={<UserCircleIcon />}
                        label="الموظف المسؤول"
                        value={`${booking['اسم الموظف']} / ${booking['الإدارة']}`}
                    />
                    <DetailItem 
                        icon={<span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusChip(booking['الحالة'])}`}>{booking['الحالة']}</span>}
                        label="حالة الحجز"
                        value={booking['نوع الاجتماع'] === 'خارجي' ? <span className="font-bold text-secondary">اجتماع خارجي</span> : "اجتماع داخلي"}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                 <DetailItem 
                    icon={<CalendarIcon />}
                    label="التاريخ"
                    value={formatDate(booking['من'])}
                />
                 <DetailItem 
                    icon={<ClockIcon />}
                    label="الوقت"
                    value={<span className="font-mono tracking-wider">{formatTimeRange(booking['من'], booking['إلى'])}</span>}
                />
                 <DetailItem 
                    icon={<LocationMarkerIcon />}
                    label="القاعة"
                    value={booking['القاعة']}
                />
                <DetailItem 
                    icon={<UsersIcon />}
                    label="عدد الحضور"
                    value={`${booking['عدد الحضور']} شخص`}
                />
                {booking.email && (
                     <DetailItem 
                        icon={<EmailIcon />}
                        label="البريد الإلكتروني"
                        value={booking.email}
                    />
                )}
                {booking['الضيافة'] && (
                     <DetailItem 
                        icon={<CoffeeIcon />}
                        label="الضيافة"
                        value={booking['الضيافة']}
                    />
                )}
                 {booking['الملاحظات'] && (
                     <DetailItem 
                        icon={<InfoIcon />}
                        label="ملاحظات إضافية"
                        value={booking['الملاحظات']}
                    />
                )}
            </div>

            <div className="pt-4 flex justify-end">
                <button onClick={onClose} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-900">
                    إغلاق
                </button>
            </div>
        </div>
    </Modal>
  );
};

export default BookingDetailsModal;
