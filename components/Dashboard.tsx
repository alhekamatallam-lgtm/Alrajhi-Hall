import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { DashboardEntry, Booking } from '../types';
import StatCard from './StatCard';

interface DashboardProps {
  dashboardData: DashboardEntry[];
  bookings: Booking[];
}

const Dashboard: React.FC<DashboardProps> = ({ dashboardData, bookings }) => {
  const COLORS = ['#C8A44A', '#0B1F3A', '#6b7280', '#9ca3af', '#d1d5db'];

  const getIndicatorValue = (indicatorName: string): string | number => {
    const item = dashboardData.find(d => d['المؤشر'] === indicatorName);
    return item ? item['القيمة'] : 'غير متوفر';
  };

  const departmentBookings = useMemo(() => {
    const counts: { [key: string]: number } = {};
    bookings.forEach(booking => {
      const dept = booking['الإدارة'];
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, 'عدد الحجوزات': value }))
      .sort((a, b) => b['عدد الحجوزات'] - a['عدد الحجوزات'])
      .slice(0, 5);
  }, [bookings]);

  const meetingTypeData = [
    { name: 'اجتماعات داخلية', value: Number(getIndicatorValue('عدد الاجتماعات الداخلية')) || 0 },
    { name: 'اجتماعات خارجية', value: Number(getIndicatorValue('عدد الاجتماعات الخارجية')) || 0 },
  ];
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary">لوحة المؤشرات</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="إجمالي الاجتماعات" value={getIndicatorValue('عدد الاجتماعات الكلي')} />
        <StatCard title="الاجتماعات الداخلية" value={getIndicatorValue('عدد الاجتماعات الداخلية')} />
        <StatCard title="الاجتماعات الخارجية" value={getIndicatorValue('عدد الاجتماعات الخارجية')} />
        <StatCard title="أكثر يوم استخداماً" value={getIndicatorValue('أكثر يوم استخدامًا')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-primary">أكثر الإدارات حجزاً</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentBookings} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${value} حجز`, '']}/>
              <Legend />
              <Bar dataKey="عدد الحجوزات" fill="#0B1F3A" barSize={30} />
            </BarChart>
          </ResponsiveContainer>
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
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;