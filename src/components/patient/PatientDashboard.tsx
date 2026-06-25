'use client';

import React from 'react';
import { CalendarDays, Pill, Activity } from 'lucide-react';
import BookingForm from './BookingForm';

export function PatientDashboard() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Health Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Tasks */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Pill className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Medication Schedule</h3>
            <p className="text-sm text-gray-500 mt-1">Paracetamol 500mg - 1 pill at 08:00 AM</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-4">
          <div className="bg-teal-100 p-3 rounded-lg">
            <Activity className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Vital Signs</h3>
            <p className="text-sm text-gray-500 mt-1">Blood Pressure: 120/80 mmHg (Normal)</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-4">
          <div className="bg-purple-100 p-3 rounded-lg">
            <CalendarDays className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-700">Upcoming Appointments</h3>
            <p className="text-sm text-gray-500 mt-1">10:30 AM, Jun 30 - Dr. Nguyen Van A</p>
          </div>
        </div>
      </div>

      {/* Booking Form Section */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Book New Appointment</h2>
        <BookingForm />
      </div>
    </div>
  );
}
