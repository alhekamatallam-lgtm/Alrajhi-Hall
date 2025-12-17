import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Room, Hospitality } from '../types';
import Modal from './Modal';
import BookingForm from './BookingForm';
import { PlusIcon, EditIcon, CalendarIcon, LocationMarkerIcon, UsersIcon, UserCircleIcon } from './icons/Icons';

interface BookingsProps {
  initialBookings: Booking[];
  rooms: Room[];
  hospitality: Hospitality[];
  isSubmitting: boolean;
  onAddBooking: (booking: Omit<Booking, 'رقم الحجز'>) => Promise<void>;
  onUpdateBooking: (booking: Booking) => Promise<void>;
}

/**
 * Parses a variety of custom datetime strings into a Date object.
 * Handles formats like "YYYY/MM/DD hh:mm AM/PM" and "h:mm:ss م YYYY/MM/DD".
 * Returns null if the string is invalid.
 * @param dateString The datetime string.
 */
const parseCustomDateTime = (dateString?: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;

  // Normalize Arabic PM/AM indicators and slashes
  const normalizedString = dateString.replace(/م/g, 'PM').replace(/ص/g, 'AM').replace(/\//g, '-');
  
  // Attempt to parse common formats directly
  // Handles "YYYY-MM-DD hh:mm AM/PM"
  let date = new Date(normalizedString);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Handle "h:mm:ss PM YYYY-MM-DD"
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

  // Fallback for any other valid date string JS can parse
  date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date;
  }

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


const Bookings: React.FC<BookingsProps> = ({ initialBookings, rooms, hospitality, onAddBooking, onUpdateBooking, isSubmitting }) => {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  // Filter states
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [filterStatus, setFilterStatus] = useState('');


  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  const uniqueRooms = useMemo(() => [...new Set(initialBookings.map(b => b['القاعة']))].sort(), [initialBookings]);
  const uniqueStatuses = useMemo(() => [...new Set(initialBookings.map(b => b['الحالة']))].sort(), [initialBookings]);


  const { upcomingBookings, pastBookings } = useMemo(() => {
    const now = new Date();
    
    const filtered = bookings.filter(booking => {
        // Date filter
        if (filterDate) {
            const meetingDate = parseCustomDateTime(booking['من']);
            if (!meetingDate || meetingDate.toISOString().split('T')[0] !== filterDate) return false;
        }
        // Room filter
        if (filterRoom && booking['القاعة'] !== filterRoom) return false;
        // Status filter
        if (filterStatus && booking['الحالة'] !== filterStatus) return false;
        // Search term filter
        if (searchTerm) {
            const searchTermLower = searchTerm.toLowerCase();
            const searchableContent = [
                booking['عنوان الاجتماع'],
                booking['اسم الموظف'],
                booking['الإدارة'],
                booking['رقم الحجز']
            ].join(' ').toLowerCase();
            if (!searchableContent.includes(searchTermLower)) return false;
        }
        return true;
    });

    const upcoming: Booking[] = [];
    const past: Booking[] = [];

    filtered.forEach(booking => {
      const meetingEndDate = parseCustomDateTime(booking['إلى']);
      if (!meetingEndDate || meetingEndDate >= now) {
        upcoming.push(booking);
      } else {
        past.push(booking);
      }
    });
    
    upcoming.sort((a, b) => {
        const dateA = parseCustomDateTime(a['من']);
        const dateB = parseCustomDateTime(b['من']);
        if (!dateA) return 1; if (!dateB) return -1;
        return dateA.getTime() - dateB.getTime();
    });

    past.sort((a, b) => {
        const dateA = parseCustomDateTime(a['من']);
        const dateB = parseCustomDateTime(b['من']);
        if (!dateA) return 1; if (!dateB) return -1;
        // FIX: Corrected `a.getTime()` to `dateA.getTime()` for proper date comparison.
        return dateB.getTime() - dateA.getTime();
    });

    return { upcomingBookings: upcoming, pastBookings: past };
  }, [bookings, filterDate, searchTerm, filterRoom, filterStatus]);

  const handleAddBooking = () => {
    setEditingBooking(null);
    setIsModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  const handleSaveBooking = async (booking: Booking) => {
    try {
      if (booking['رقم الحجز']) {
        await onUpdateBooking(booking);
      } else {
        const { 'رقم الحجز': _, ...newBookingData } = booking;
        await onAddBooking(newBookingData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Save failed, modal will remain open.");
    }
  };
  
  const getStatusChip = (status: string) => {
    switch (status) {
        case 'معتمد': return 'bg-green-100 text-green-800 border-green-300';
        case 'قيد الانتظار': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'مرفوض': return 'bg-red-100 text-red-800 border-red-300';
        default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const renderBookingCard = (booking: Booking) => (
    <div key={booking['رقم الحجز']} className="bg-white rounded-lg shadow-md transition-all hover:shadow-xl hover:-translate-y-1 border-r-4 border-secondary flex flex-col">
        <div className="p-4 border-b flex justify-between items-start gap-2">
            <div>
                <h3 className="text-lg font-bold text-primary">{booking['عنوان الاجتماع']}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <UserCircleIcon /> 
                    <span>{booking['اسم الموظف']} / {booking['الإدارة']}</span>
                </div>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap border ${getStatusChip(booking['الحالة'])}`}>
                {booking['الحالة']}
            </span>
        </div>

        <div className="p-4 space-y-4 flex-grow">
            <div className="flex items-center gap-3 text-sm">
                <CalendarIcon />
                <div>
                    <p className="font-semibold text-text-dark">{formatDate(booking['من'])}</p>
                    <p className="text-gray-600 font-mono tracking-wider">{formatTimeRange(booking['من'], booking['إلى'])}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <LocationMarkerIcon />
                <p className="font-semibold text-text-dark">{booking['القاعة']}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
                <UsersIcon />
                <p className="font-semibold text-text-dark">{booking['عدد الحضور']} حضور</p>
            </div>
        </div>

        <div className="p-3 bg-gray-50 rounded-b-lg flex justify-between items-center text-sm">
            <span className={`px-2 py-1 text-xs rounded-full ${booking['نوع الاجتماع'] === 'خارجي' ? 'bg-secondary text-white' : 'bg-blue-100 text-primary'}`}>
                {booking['نوع الاجتماع']}
            </span>
            <button onClick={() => handleEditBooking(booking)} className="flex items-center gap-2 text-secondary hover:opacity-80 font-semibold p-1">
                <EditIcon />
                <span>تعديل</span>
            </button>
        </div>
    </div>
  );

  const displayedBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-primary">إدارة الحجوزات</h1>
        <button onClick={handleAddBooking} className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition">
            <PlusIcon />
            <span>إضافة حجز جديد</span>
        </button>
      </div>
      
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input 
                  type="text"
                  placeholder="ابحث بالعنوان، الموظف، الإدارة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md shadow-sm w-full"
              />
              <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm w-full bg-white">
                  <option value="">كل القاعات</option>
                  {uniqueRooms.map(room => <option key={room} value={room}>{room}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 border border-gray-300 rounded-md shadow-sm w-full bg-white">
                  <option value="">كل الحالات</option>
                  {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
              <input 
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md shadow-sm w-full"
              />
          </div>
           {(filterDate || searchTerm || filterRoom || filterStatus) && (
                <button 
                    onClick={() => { setFilterDate(''); setSearchTerm(''); setFilterRoom(''); setFilterStatus(''); }}
                    className="mt-4 text-sm text-red-600 hover:text-red-800 p-2 rounded-md bg-red-100 hover:bg-red-200 transition"
                >
                    مسح جميع الفلاتر
                </button>
            )}
      </div>


      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            <button onClick={() => setActiveTab('upcoming')} className={`py-4 px-1 border-b-2 font-semibold ${activeTab === 'upcoming' ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              الاجتماعات القادمة ({upcomingBookings.length})
            </button>
            <button onClick={() => setActiveTab('past')} className={`py-4 px-1 border-b-2 font-semibold ${activeTab === 'past' ? 'border-secondary text-secondary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              الاجتماعات الماضية ({pastBookings.length})
            </button>
          </nav>
        </div>

        <div className="mt-6">
            {displayedBookings.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {displayedBookings.map(renderBookingCard)}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">لا توجد حجوزات</h3>
                    <p className="mt-1 text-sm text-gray-500">لا توجد حجوزات تطابق الفلاتر الحالية.</p>
                </div>
            )}
        </div>
      </div>

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)} title={editingBooking ? 'تعديل حجز' : 'إضافة حجز جديد'}>
          <BookingForm 
            booking={editingBooking} 
            onSave={handleSaveBooking} 
            onCancel={() => setIsModalOpen(false)} 
            rooms={rooms}
            hospitality={hospitality}
            allBookings={bookings}
            isSubmitting={isSubmitting}
          />
        </Modal>
      )}
    </div>
  );
};

export default Bookings;