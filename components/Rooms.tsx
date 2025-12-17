import React from 'react';
import { Room } from '../types';

interface RoomsProps {
  roomsData: Room[];
}

const Rooms: React.FC<RoomsProps> = ({ roomsData }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">قاعات الاجتماعات</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roomsData.map((room) => {
          const isAvailable = room['متاحة'] === 'نعم';
          return (
            <div key={room['اسم القاعة']} className="bg-white p-6 rounded-lg shadow-md flex flex-col justify-between text-text-dark">
              <div>
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold text-primary">{room['اسم القاعة']}</h2>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isAvailable ? 'متاحة' : 'غير متاحة'}
                  </span>
                </div>
                <p className="text-gray-600 mt-2">السعة: {room['السعة']} شخص</p>
                <p className="text-gray-500 text-sm mt-1">الموقع: {room['الموقع']}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Rooms;