import React from 'react';
import { Hospitality as HospitalityType } from '../types';

interface HospitalityProps {
  hospitalityData: HospitalityType[];
}

const Hospitality: React.FC<HospitalityProps> = ({ hospitalityData }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">إدارة الضيافة</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-text-dark">
            <thead className="bg-background">
              <tr>
                <th className="p-3 text-sm font-semibold tracking-wide">نوع الاجتماع</th>
                <th className="p-3 text-sm font-semibold tracking-wide">نوع الضيافة</th>
                <th className="p-3 text-sm font-semibold tracking-wide">الملاحظات</th>
              </tr>
            </thead>
            <tbody>
              {hospitalityData.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                     <span className={`px-2 py-1 text-sm rounded-full ${item['نوع الاجتماع'] === 'خارجي' ? 'bg-secondary text-white' : 'bg-blue-100 text-primary'}`}>
                      {item['نوع الاجتماع']}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-primary">{item['نوع الضيافة']}</td>
                  <td className="p-3">{item['الملاحظات']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Hospitality;