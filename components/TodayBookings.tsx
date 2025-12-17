import React, { useState, useMemo, useEffect } from 'react';
import { Booking } from '../types';
import { ClockIcon, UsersIcon, ArrowPathIcon, UserCircleIcon, LocationMarkerIcon, CheckCircleIcon } from './icons/Icons';
import BookingDetailsModal from './BookingDetailsModal';

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


// Component to render individual card
const BookingCard: React.FC<{ booking: Booking, onClick: () => void }> = ({ booking, onClick }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const { status, progress, timeStatus } = useMemo(() => {
        const startTime = parseCustomDateTime(booking['من']);
        const endTime = parseCustomDateTime(booking['إلى']);

        if (!startTime || !endTime) {
            return { status: 'وقت غير صالح', progress: 0, timeStatus: '' };
        }
        
        let statusText: string;
        let progressPercent = 0;
        let timeStatusText: string = '';

        if (now < startTime) {
            statusText = 'قادم';
            const diffMinutes = Math.round((startTime.getTime() - now.getTime()) / 60000);
            if (diffMinutes < 60) {
              timeStatusText = `يبدأ خلال ${diffMinutes} دقيقة`;
            } else {
              timeStatusText = `يبدأ الساعة ${startTime.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}`;
            }
        } else if (now > endTime) {
            statusText = 'منتهي';
            progressPercent = 100;
            timeStatusText = `انتهى الساعة ${endTime.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}`;
        } else {
            statusText = 'جارٍ الآن';
            const totalDuration = endTime.getTime() - startTime.getTime();
            const elapsed = now.getTime() - startTime.getTime();
            progressPercent = Math.min(100, (elapsed / totalDuration) * 100);
            const remainingMinutes = Math.round((endTime.getTime() - now.getTime()) / 60000);
            timeStatusText = `ينتهي خلال ${remainingMinutes} دقيقة`;
        }

        return { status: statusText, progress: progressPercent, timeStatus: timeStatusText };
    }, [booking, now]);

    const isFinished = status === 'منتهي';
    
    const getStatusColors = () => {
        switch (status) {
            case 'جارٍ الآن': return 'border-green-500 bg-green-50';
            case 'قادم': return 'border-blue-500 bg-blue-50';
            case 'منتهي': return 'border-gray-400 bg-gray-50';
            default: return 'border-gray-300 bg-gray-100';
        }
    };

    const getProgressBarColor = () => {
        switch (status) {
            case 'جارٍ الآن': return 'bg-green-500';
            case 'قادم': return 'bg-blue-500';
            case 'منتهي': return 'bg-gray-400';
            default: return 'bg-gray-300';
        }
    }

    return (
        <div 
            onClick={onClick}
            className={`bg-white rounded-lg shadow-md transition-all hover:shadow-xl hover:-translate-y-1 border-r-4 cursor-pointer flex flex-col text-text-dark ${getStatusColors()} ${isFinished ? 'opacity-70' : ''}`}
        >
            <div className="p-4 border-b flex justify-between items-start gap-2">
                <div>
                    <h3 className="text-lg font-bold text-primary">{booking['عنوان الاجتماع']}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <UserCircleIcon />
                        <span>{booking['اسم الموظف']} / {booking['الإدارة']}</span>
                    </div>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${status === 'جارٍ الآن' ? 'bg-green-100 text-green-800 animate-pulse' : status === 'قادم' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {status}
                </span>
            </div>

            <div className="p-4 space-y-3 flex-grow">
                <div className="flex items-center gap-3 text-sm">
                    <ClockIcon />
                    <p className="font-semibold text-text-dark font-mono tracking-wider">
                        {parseCustomDateTime(booking['من'])?.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })} - {parseCustomDateTime(booking['إلى'])?.toLocaleTimeString('ar-SA', { hour: 'numeric', minute: '2-digit' })}
                    </p>
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

            <div className="p-3 bg-gray-50 rounded-b-lg space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-600">
                    <span>{timeStatus}</span>
                    {isFinished && <CheckCircleIcon />}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className={`h-2.5 rounded-full transition-all duration-500 ${getProgressBarColor()}`} style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );
};


const TodayBookings: React.FC<{ bookings: Booking[], onRefresh: () => void, isRefreshing: boolean }> = ({ bookings, onRefresh, isRefreshing }) => {
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

    const todaysBookings = useMemo(() => {
        // Get today's date in 'YYYY-MM-DD' format, according to Riyadh timezone.
        const riyadhTodayString = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
        
        return bookings
            .filter(b => {
                // First, ensure the booking is approved.
                if (b['الحالة'] !== 'معتمد') {
                    return false;
                }
                
                // Attempt to parse the booking's start date string.
                const bookingDate = parseCustomDateTime(b['من']);
                
                // If the date is invalid or cannot be parsed, exclude it.
                if (!bookingDate) {
                    return false;
                }
                
                // Convert the parsed date object into the same 'YYYY-MM-DD' format.
                const bookingDateString = bookingDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Riyadh' });
                
                // Compare the booking's date string with today's date string.
                return bookingDateString === riyadhTodayString;
            })
            .sort((a, b) => {
                const timeA = parseCustomDateTime(a['من'])?.getTime() || 0;
                const timeB = parseCustomDateTime(b['من'])?.getTime() || 0;
                return timeA - timeB;
            });
    }, [bookings]);

    const handleBookingClick = (booking: Booking) => {
      setSelectedBooking(booking);
      setIsDetailsModalOpen(true);
    };
    
    const riyadhDateDisplay = new Date().toLocaleDateString('ar-SA', {
        timeZone: 'Asia/Riyadh',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary">حجوزات اليوم</h1>
                    <p className="text-lg text-gray-600">{riyadhDateDisplay} (توقيت الرياض)</p>
                </div>
                <button onClick={onRefresh} disabled={isRefreshing} className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg shadow-sm border hover:bg-gray-50 disabled:opacity-50">
                    {isRefreshing ? <div className="animate-spin"><ArrowPathIcon /></div> : <ArrowPathIcon />}
                    <span>{isRefreshing ? 'جاري التحديث...' : 'تحديث'}</span>
                </button>
            </div>

            {todaysBookings.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {todaysBookings.map(booking => (
                        <BookingCard key={booking['رقم الحجز']} booking={booking} onClick={() => handleBookingClick(booking)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white rounded-lg shadow-md">
                     <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 12.75h.008v.008H12v-.008z" />
                    </svg>
                    <h3 className="mt-4 text-xl font-medium text-gray-900">لا توجد حجوزات معتمدة لهذا اليوم</h3>
                    <p className="mt-2 text-sm text-gray-500">يبدو أن اليوم هادئ! لا توجد اجتماعات مجدولة حالياً.</p>
                </div>
            )}

            {isDetailsModalOpen && selectedBooking && (
                <BookingDetailsModal
                    booking={selectedBooking}
                    onClose={() => setIsDetailsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default TodayBookings;