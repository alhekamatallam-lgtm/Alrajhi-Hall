import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Booking } from '../types';
import StatCard from './StatCard';

interface DashboardProps {
  bookings: Booking[];
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


const Dashboard: React.FC<DashboardProps> = ({ bookings }) => {
  const COLORS = ['#0B1F3A', '#C8A44A', '#6b7280', '#9ca3af', '#d1d5db'];

  const dashboardStats = useMemo(() => {
    const totalMeetings = bookings.length;
    const internalMeetings = bookings.filter(b => b['نوع الاجتماع'] === 'داخلي').length;
    const externalMeetings = bookings.filter(b => b['نوع الاجتماع'] === 'خارجي').length;

    const dayCounts: { [key: string]: number } = {};
    const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    bookings.forEach(booking => {
        const date = parseCustomDateTime(booking['من']);
        if (date) {
            const dayName = arabicDays[date.getDay()];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        }
    });

    let mostFrequentDay = 'لا يوجد';
    if (Object.keys(dayCounts).length > 0) {
        mostFrequentDay = Object.keys(dayCounts).reduce((a, b) => dayCounts[a] > dayCounts[b] ? a : b);
    }
    
    return {
        totalMeetings,
        internalMeetings,
        externalMeetings,
        mostFrequentDay,
    };
  }, [bookings]);


  const departmentBookings = useMemo(() => {
    const counts: { [key: string]: number } = {};
    bookings.forEach(booking => {
      const dept = booking['الإدارة'];
      if(dept) { // Ensure department is not null or empty
        counts[dept] = (counts[dept] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, 'عدد الحجوزات': value }))
      .sort((a, b) => b['عدد الحجوزات'] - a['عدد الحجوزات'])
      .slice(0, 5);
  }, [bookings]);

  const meetingTypeData = [
    { name: 'اجتماعات داخلية', value: dashboardStats.internalMeetings },
    { name: 'اجتماعات خارجية', value: dashboardStats.externalMeetings },
  ];
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">لوحة المؤشرات</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الاجتماعات" value={dashboardStats.totalMeetings} />
        <StatCard title="الاجتماعات الداخلية" value={dashboardStats.internalMeetings} />
        <StatCard title="الاجتماعات الخارجية" value={dashboardStats.externalMeetings} />
        <StatCard title="أكثر يوم استخداماً" value={dashboardStats.mostFrequentDay} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col" style={{ minHeight: '384px' }}>
          <h2 className="text-xl font-semibold mb-6 text-primary">أكثر الإدارات حجزاً</h2>
          {departmentBookings.length > 0 ? (
            <div className="space-y-4 flex-1">
              {departmentBookings.map((item, index) => {
                  const maxBookings = departmentBookings[0]['عدد الحجوزات'] || 1;
                  const percentage = (item['عدد الحجوزات'] / maxBookings) * 100;
                  return (
                      <div key={item.name} className="group transition-transform hover:scale-[1.02]" aria-label={`${item.name}: ${item['عدد الحجوزات']} حجوزات`}>
                          <div className="flex justify-between items-center mb-1.5">
                              <span className="text-md font-bold text-primary truncate" title={item.name}>
                                  <span className="text-secondary font-mono text-lg">{index + 1}.</span> {item.name}
                              </span>
                              <span className="font-mono text-gray-600 font-semibold text-lg">{item['عدد الحجوزات']}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                              <div
                                  className="bg-secondary h-3 rounded-full transition-all duration-500 ease-out group-hover:opacity-75"
                                  style={{ width: `${percentage}%` }}
                              ></div>
                          </div>
                      </div>
                  );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1">
                <p className="text-center text-gray-500">لا توجد بيانات حجز كافية لعرضها.</p>
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-primary">توزيع أنواع الاجتماعات</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={meetingTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {meetingTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} اجتماع`, name]}/>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;