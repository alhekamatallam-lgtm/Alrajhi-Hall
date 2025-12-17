
import { ApiData, Booking } from '../types';

// Updated API endpoint as per user request
const API_URL = 'https://script.google.com/macros/s/AKfycbzD283ME-AB6Ub_wiCGjm7ZdB1fxkUH4gJfX-NdfFRuGqt4FS6aRaWJuohrQsB31bWJKw/exec';

export const fetchData = async (): Promise<ApiData> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data as ApiData;
  } catch (error) {
    console.error("Failed to fetch data:", error);
    throw error;
  }
};

// Function to add a new booking
export const addBooking = async (newBookingData: Omit<Booking, 'رقم الحجز'>): Promise<any> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        sheet: 'Bookings',
        data: newBookingData,
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add booking: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to add booking:", error);
    throw error;
  }
};

// Function to update a full booking record
export const updateBooking = async (updatedBookingData: Booking): Promise<any> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      // The backend can infer it's an update if 'رقم الحجز' exists in the data.
      body: JSON.stringify({
        sheet: 'Bookings',
        data: updatedBookingData,
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update booking: ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to update booking:", error);
    throw error;
  }
};