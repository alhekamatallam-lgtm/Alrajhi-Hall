import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ApiData, ViewType, Booking } from './types';
import { fetchData, addBooking, updateBooking } from './services/apiService';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Bookings from './components/Bookings';
import Hospitality from './components/Hospitality';
import Rooms from './components/Rooms';
import Admin from './components/Admin';
import Modal from './components/Modal';
import Toast from './components/Toast';
import TodayBookings from './components/TodayBookings';

const navItems = [
    { id: 'dashboard', label: 'لوحة المؤشرات' },
    { id: 'bookings', label: 'الحجوزات' },
    { id: 'today', label: 'حجوزات اليوم' },
    { id: 'hospitality', label: 'الضيافة' },
    { id: 'rooms', label: 'القاعات' },
    { id: 'admin', label: 'إدارة الحجوزات' },
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Used for both mobile menu and desktop collapse

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Close sidebar if transitioning from mobile to desktop while it's open
      if (!mobile) {
        setIsSidebarOpen(false); // Resets to expanded on desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadData = useCallback(async (isBackgroundRefresh = false) => {
    if (isBackgroundRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const apiData = await fetchData();
      setData(apiData);
      setError(null);
    } catch (err) {
      setError('فشل في تحميل البيانات. يرجى المحاولة مرة أخرى.');
      console.error(err);
    } finally {
      if (isBackgroundRefresh) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
    }
    loadData(true);
  }, [view, loadData]);

  useEffect(() => {
    const handleFocus = () => loadData(true);
    window.addEventListener('focus', handleFocus);
    return () => {
        window.removeEventListener('focus', handleFocus);
    };
  }, [loadData]);

  const handleSetView = (newView: ViewType) => {
    if (newView === 'admin' && !isAdminAuthenticated) {
      setShowPasswordPrompt(true);
    } else {
      setView(newView);
    }
    if (isMobile) {
      setIsSidebarOpen(false); // Close mobile menu on navigation
    }
  };

  const handleAdminLogin = () => {
    if (passwordInput === 'admin') {
      setIsAdminAuthenticated(true);
      setShowPasswordPrompt(false);
      setView('admin');
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('كلمة المرور غير صحيحة.');
    }
  };
  
  const handleUpdateBooking = async (updatedBooking: Booking): Promise<void> => {
    if (!data) return;
    setIsSubmitting(true);
    try {
      const response = await updateBooking(updatedBooking);
      await loadData(true);
      setToast({ message: response.message || 'تم تحديث الحجز بنجاح!', type: 'success' });
    } catch (error: any) {
      console.error("Failed to update booking via API:", error);
      setToast({ message: error.message || 'حدث خطأ أثناء تحديث الحجز.', type: 'error' });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAddBooking = async (newBookingData: Omit<Booking, 'رقم الحجز'>): Promise<void> => {
    if (!data) return;
    setIsSubmitting(true);
    try {
      const response = await addBooking(newBookingData);
      await loadData(true);
      setToast({ message: response.message || 'تم طلب حجز القاعة بنجاح!', type: 'success' });
    } catch (error: any) {
      console.error("Failed to add booking via API:", error);
      setToast({ message: error.message || 'حدث خطأ أثناء إضافة الحجز.', type: 'error' });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderView = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-primary text-xl">
          <img 
            src="https://sekaya.org.sa/wp-content/uploads/2025/01/99.png" 
            alt="شعار التحميل" 
            className="h-24 animate-pulse mb-4"
          />
          <p>جار التحميل...</p>
        </div>
      );
    }
    if (error) return <div className="flex items-center justify-center h-full text-red-500 text-xl">{error}</div>;
    if (!data) return <div className="flex items-center justify-center h-full text-gray-500">لا توجد بيانات لعرضها.</div>;

    switch (view) {
      case 'dashboard': return <Dashboard dashboardData={data.Dashboard} bookings={data.Bookings} />;
      case 'bookings': return <Bookings initialBookings={data.Bookings} rooms={data.Rooms} hospitality={data.Hospitality} onAddBooking={handleAddBooking} onUpdateBooking={handleUpdateBooking} isSubmitting={isSubmitting} />;
      case 'today': return <TodayBookings bookings={data.Bookings} onRefresh={() => loadData(true)} isRefreshing={isRefreshing} />;
      case 'hospitality': return <Hospitality hospitalityData={data.Hospitality} />;
      case 'rooms': return <Rooms roomsData={data.Rooms} />;
      case 'admin': return <Admin allBookings={data.Bookings} rooms={data.Rooms} hospitality={data.Hospitality} onUpdateBooking={handleUpdateBooking} isSubmitting={isSubmitting} />;
      default: return <Dashboard dashboardData={data.Dashboard} bookings={data.Bookings} />;
    }
  };
  
  const activeViewLabel = navItems.find(item => item.id === view)?.label || '';

  return (
    <div className="flex h-screen bg-background text-text-dark overflow-hidden">
      <Sidebar 
        navItems={navItems}
        activeView={view} 
        setView={handleSetView} 
        isCollapsed={isMobile ? false : isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isRefreshing={isRefreshing}
        isMobile={isMobile}
        isMobileMenuOpen={isMobile ? isSidebarOpen : false}
      />
      <div className="flex-1 flex flex-col">
        {isMobile && <Header pageTitle={activeViewLabel} onMenuClick={() => setIsSidebarOpen(true)} />}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {renderView()}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showPasswordPrompt && (
        <Modal onClose={() => setShowPasswordPrompt(false)} title="تسجيل الدخول للمشرف">
          <div className="space-y-4">
            <p>الرجاء إدخال كلمة المرور للوصول إلى صفحة الإدارة.</p>
            <div>
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" autoFocus />
              {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            </div>
            <div className="pt-2 flex justify-end">
              <button onClick={handleAdminLogin} className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90">دخول</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default App;