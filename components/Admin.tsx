import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Room, Hospitality } from '../types';
import Modal from './Modal';
import BookingForm from './BookingForm';
import { EditIcon, UserCircleIcon, CalendarIcon, LocationMarkerIcon, UsersIcon, RefreshIcon } from './icons/Icons';

interface AdminProps {
  allBookings: Booking[];
  rooms: Room[];
  hospitality: Hospitality[];
  onUpdateBooking: (booking: Booking) => Promise<void>;
  isSubmitting: boolean;
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

const Admin: React.FC<AdminProps> = ({ allBookings, rooms, hospitality, onUpdateBooking, isSubmitting }) => {
  const [bookings, setBookings] = useState<Booking[]>(allBookings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    setBookings(allBookings);
  }, [allBookings]);

  const uniqueRooms = useMemo(() => [...new Set(allBookings.map(b => b['القاعة']))].sort(), [allBookings]);
  const uniqueStatuses = useMemo(() => ['معتمد', 'قيد الانتظار', 'مرفوض'], []);

  const filteredBookings = useMemo(() => {
    const sorted = [...bookings].sort((a, b) => {
      const dateA = parseCustomDateTime(a['من']);
      const dateB = parseCustomDateTime(b['من']);
      if (!dateA) return 1;
      if (!dateB) return -1;
      // FIX: Corrected `a.getTime()` to `dateA.getTime()` for proper date comparison.
      return dateB.getTime() - dateA.getTime();
    });

    return sorted.filter(booking => {
        if (filterDate) {
            const meetingDate = parseCustomDateTime(booking['من']);
            if (!meetingDate || meetingDate.toISOString().split('T')[0] !== filterDate) return false;
        }
        if (filterRoom && booking['القاعة'] !== filterRoom) return false;
        if (filterStatus && booking['الحالة'] !== filterStatus) return false;
        if (searchTerm) {
            const searchTermLower = searchTerm.toLowerCase();
            const searchableContent = [ booking['عنوان الاجتماع'], booking['اسم الموظف'], booking['الإدارة'], booking['رقم الحجز'] ].join(' ').toLowerCase();
            if (!searchableContent.includes(searchTermLower)) return false;
        }
        return true;
    });
  }, [bookings, filterDate, searchTerm, filterRoom, filterStatus]);

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  const handleSaveBooking = async (booking: Booking) => {
    try {
      if (booking['رقم الحجز']) {
        await onUpdateBooking(booking);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Save failed, modal will remain open.", error);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    const bookingToUpdate = allBookings.find(b => b['رقم الحجز'] === bookingId);
    if (bookingToUpdate) {
      setUpdatingStatusId(bookingId);
      try {
        const updatedBooking = { ...bookingToUpdate, 'الحالة': newStatus };
        await onUpdateBooking(updatedBooking);
      } catch (error) {
        console.error("Failed to update status", error);
      } finally {
        setUpdatingStatusId(null);
      }
    }
  };

  const getStatusChipAndSelectClasses = (status: string) => {
    switch (status) {
      case 'معتمد': return 'bg-green-100 text-green-800 border-green-300';
      case 'قيد الانتظار': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'مرفوض': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getStatusColorForBorder = (status: string) => {
    switch (status) {
        case 'معتمد': return '#4ade80'; // green-400
        case 'قيد الانتظار': return '#facc15'; // yellow-400
        case 'مرفوض': return '#f87171'; // red-400
        default: return '#9ca3af'; // gray-400
    }
  }

  const renderBookingCard = (booking: Booking) => (
    <div key={booking['رقم الحجز']} className="bg-white rounded-lg shadow-md transition-all hover:shadow-xl flex flex-col border-t-4 text-text-dark" style={{ borderColor: getStatusColorForBorder(booking['الحالة']) }}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-bold text-primary truncate">{booking['عنوان الاجتماع']}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <UserCircleIcon />
          <span className="truncate">{booking['اسم الموظف']} / {booking['الإدارة']}</span>
        </div>
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

      <div className="p-3 bg-gray-50 rounded-b-lg flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-auto">
          <select
            value={booking['الحالة']}
            onChange={(e) => handleStatusChange(booking['رقم الحجز'], e.target.value)}
            disabled={updatingStatusId === booking['رقم الحجز']}
            className={`w-full p-1.5 pr-8 text-sm font-semibold rounded-md appearance-none border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary ${getStatusChipAndSelectClasses(booking['الحالة'])}`}
          >
            {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
          </select>
          {updatingStatusId === booking['رقم الحجز'] && (
            <div className="absolute inset-y-0 left-2 flex items-center pr-2 pointer-events-none">
               <RefreshIcon />
            </div>
          )}
        </div>
        <button onClick={() => handleEditBooking(booking)} className="flex items-center gap-2 text-secondary hover:opacity-80 font-semibold p-1 w-full sm:w-auto justify-center">
          <EditIcon />
          <span>تعديل التفاصيل</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">إدارة جميع الحجوزات</h1>
      
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
        {filteredBookings.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBookings.map(renderBookingCard)}
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

      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)} title="تعديل حجز">
          <BookingForm 
            booking={editingBooking} 
            onSave={handleSaveBooking} 
            onCancel={() => setIsModalOpen(false)} 
            rooms={rooms}
            hospitality={hospitality}
            allBookings={allBookings}
            isSubmitting={isSubmitting}
          />
        </Modal>
      )}
    </div>
  );
};

export default Admin;