import React, { useState, useEffect, useMemo } from 'react';
import { Booking, Room, Hospitality } from '../types';

interface BookingFormProps {
  booking: Booking | null;
  rooms: Room[];
  hospitality: Hospitality[];
  allBookings: Booking[];
  isSubmitting?: boolean;
  onSave: (booking: Booking | Omit<Booking, 'رقم الحجز'>) => void;
  onCancel: () => void;
}

/**
 * Parses a variety of custom datetime strings into a Date object.
 * Returns null if the string is invalid.
 */
const parseCustomDateTime = (dateString?: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;
  const normalizedString = dateString.replace(/م/g, 'PM').replace(/ص/g, 'AM').replace(/\//g, '-');
  
  let date = new Date(normalizedString);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  const arabicFormatRegex = /(\d{1,2}:\d{2}:\d{2})\s*(AM|PM)\s*(\d{4}-\d{2}-\d{2})/;
  const match = normalizedString.match(arabicFormatRegex);
  if (match) {
    const time = match[1];
    const ampm = match[2];
    const datePart = match[3];
    date = new Date(`${datePart} ${time} ${ampm}`);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
};

const BookingForm: React.FC<BookingFormProps> = ({ booking, rooms, hospitality, allBookings, isSubmitting, onSave, onCancel }) => {
  const getInitialData = () => ({
    'رقم الحجز': '',
    'اسم الموظف': '',
    'الإدارة': '',
    'عنوان الاجتماع': '',
    'نوع الاجتماع': 'داخلي' as 'داخلي' | 'خارجي',
    'من': '',
    'إلى': '',
    'عدد الحضور': 1,
    'القاعة': rooms[0]?.['اسم القاعة'] || '',
    'الحالة': 'قيد الانتظار' as 'قيد الانتظار' | 'معتمد',
    'الضيافة': '',
    'الملاحظات': '',
    email: '',
  });

  const [formData, setFormData] = useState(getInitialData());
  const [bookingDate, setBookingDate] = useState(''); // YYYY-MM-DD
  const [startTime, setStartTime] = useState('');     // HH:mm
  const [endTime, setEndTime] = useState('');       // HH:mm
  const [emailPrefix, setEmailPrefix] = useState('');

  const employeeNames = useMemo(() => [...new Set(allBookings.map(b => b['اسم الموظف']))].sort(), [allBookings]);
  const departments = useMemo(() => [...new Set(allBookings.map(b => b['الإدارة']))].sort(), [allBookings]);

  useEffect(() => {
    if (booking) {
      const fromDate = parseCustomDateTime(booking['من']);
      const toDate = parseCustomDateTime(booking['إلى']);
      
      if (fromDate) {
          // Adjust for timezone offset to display local time in inputs
          fromDate.setMinutes(fromDate.getMinutes() - fromDate.getTimezoneOffset());
          const fromISO = fromDate.toISOString();
          setBookingDate(fromISO.split('T')[0]);
          setStartTime(fromISO.split('T')[1].slice(0, 5));
      } else {
           setBookingDate('');
           setStartTime('');
      }

      if (toDate) {
          toDate.setMinutes(toDate.getMinutes() - toDate.getTimezoneOffset());
          const toISO = toDate.toISOString();
          setEndTime(toISO.split('T')[1].slice(0, 5));
      } else {
          setEndTime('');
      }

      if (booking.email) {
          setEmailPrefix(booking.email.split('@')[0]);
      } else {
          setEmailPrefix('');
      }

      setFormData({ ...getInitialData(), ...booking });
    } else {
        setFormData(getInitialData());
        setBookingDate('');
        setStartTime('');
        setEndTime('');
        setEmailPrefix('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking, rooms]);

  useEffect(() => {
    const suggested = hospitality.find(h => h['نوع الاجتماع'] === formData['نوع الاجتماع']);
    if (suggested) {
      setFormData(prev => ({ ...prev, 'الضيافة': suggested['نوع الضيافة'] }));
    } else {
      setFormData(prev => ({ ...prev, 'الضيافة': '' }));
    }
  }, [formData['نوع الاجتماع'], hospitality]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'عدد الحضور' ? parseInt(value, 10) || 1 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Combine date and time back into ISO strings
    const fromISO = new Date(`${bookingDate}T${startTime}`).toISOString();
    const toISO = new Date(`${bookingDate}T${endTime}`).toISOString();

    const fullEmail = emailPrefix ? `${emailPrefix}@rajhifoundation.org` : '';

    const dataToSend = {
      ...formData,
      'من': fromISO,
      'إلى': toISO,
      'رقم الحجز': booking?.['رقم الحجز'] || '',
      email: fullEmail,
    };
    onSave(dataToSend as Booking);
  };
  
  const todayForInput = new Date();
  todayForInput.setMinutes(todayForInput.getMinutes() - todayForInput.getTimezoneOffset());
  const minDate = booking ? undefined : todayForInput.toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-primary mb-1">عنوان الاجتماع</label>
          <input type="text" name="عنوان الاجتماع" value={formData['عنوان الاجتماع']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div>
          <label className="block text-sm font-bold text-primary mb-1">اسم الموظف</label>
          <input list="employee-names" type="text" name="اسم الموظف" value={formData['اسم الموظف']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          <datalist id="employee-names">
            {employeeNames.map(name => <option key={name} value={name} />)}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-bold text-primary mb-1">البريد الإلكتروني</label>
          <div className="mt-1 flex rounded-md shadow-sm" dir="ltr">
             <input 
               type="text" 
               value={emailPrefix} 
               onChange={(e) => setEmailPrefix(e.target.value)}
               className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-secondary focus:border-secondary sm:text-sm"
               placeholder="username"
             />
             <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                @rajhifoundation.org
             </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-primary mb-1">الإدارة</label>
          <input list="departments" type="text" name="الإدارة" value={formData['الإدارة']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
           <datalist id="departments">
            {departments.map(dept => <option key={dept} value={dept} />)}
          </datalist>
        </div>

        <div className="md:col-span-2 bg-background p-4 rounded-lg border border-gray-200 space-y-4">
            <div>
                <label htmlFor="booking-date" className="block text-sm font-bold text-primary mb-1">تحديد اليوم</label>
                <input 
                    id="booking-date"
                    type="date" 
                    value={bookingDate} 
                    onChange={(e) => setBookingDate(e.target.value)} 
                    required 
                    className="appearance-none mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-secondary focus:border-secondary" 
                    min={minDate}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="start-time" className="block text-sm font-bold text-primary mb-1">من</label>
                    <input 
                        id="start-time"
                        type="time" 
                        value={startTime} 
                        onChange={(e) => {
                            setStartTime(e.target.value);
                            // Reset end time if it's before the new start time
                            if (endTime && e.target.value > endTime) {
                                setEndTime('');
                            }
                        }}
                        disabled={!bookingDate}
                        required 
                        className="appearance-none mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-100 focus:ring-secondary focus:border-secondary"
                    />
                </div>
                <div>
                    <label htmlFor="end-time" className="block text-sm font-bold text-primary mb-1">إلى</label>
                    <input 
                        id="end-time"
                        type="time" 
                        value={endTime} 
                        onChange={(e) => setEndTime(e.target.value)} 
                        disabled={!startTime}
                        min={startTime}
                        required 
                        className="appearance-none mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 disabled:bg-gray-100 focus:ring-secondary focus:border-secondary" 
                    />
                </div>
            </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-primary mb-1">القاعة</label>
          <select name="القاعة" value={formData['القاعة']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
            {rooms.map(r => <option key={r['اسم القاعة']} value={r['اسم القاعة']}>{r['اسم القاعة']}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-primary mb-1">نوع الاجتماع</label>
          <select name="نوع الاجتماع" value={formData['نوع الاجتماع']} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white">
            <option value="داخلي">داخلي</option>
            <option value="خارجي">خارجي</option>
          </select>
        </div>
         <div className="md:col-span-2">
          <label className="block text-sm font-bold text-primary mb-1">عدد الحضور</label>
          <input type="number" name="عدد الحضور" value={formData['عدد الحضور']} onChange={handleChange} required min="1" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
        </div>
        <div className="md:col-span-2">
            <label className="block text-sm font-bold text-primary mb-1">الضيافة المقترحة</label>
            <input type="text" name="الضيافة" value={formData['الضيافة']} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-primary mb-1">الملاحظات</label>
          <textarea name="الملاحظات" value={formData['الملاحظات']} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"></textarea>
        </div>
      </div>
      <div className="pt-4 flex justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50">
          إلغاء
        </button>
        <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-75 disabled:cursor-not-allowed">
          {isSubmitting ? 'جار الحفظ...' : 'حفظ'}
        </button>
      </div>
    </form>
  );
};

export default BookingForm;