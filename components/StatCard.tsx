import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-gray-500 text-sm font-semibold uppercase">{title}</h3>
      <p className="text-2xl font-bold text-primary mt-2">{value}</p>
    </div>
  );
};

export default StatCard;