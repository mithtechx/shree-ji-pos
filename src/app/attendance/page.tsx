"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarCheck, Save, Users, Calendar } from 'lucide-react';

const SALESMEN = ['Rahul', 'Akash', 'Ashish', 'Sales 4', 'Sales 5'];

export default function StaffAttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7));
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; notes: string }>>({});
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);

  useEffect(() => {
    fetchDailyAttendance();
  }, [selectedDate]);

  useEffect(() => {
    fetchMonthlySummary();
  }, [selectedMonth]);

  const fetchDailyAttendance = async () => {
    const { data } = await supabase
      .from('staff_attendance')
      .select('*')
      .eq('date', selectedDate);

    const map: Record<string, { status: string; notes: string }> = {};
    SALESMEN.forEach(staff => {
      map[staff] = { status: 'Present', notes: '' };
    });

    if (data) {
      data.forEach((row: any) => {
        map[row.staff_name] = { status: row.status, notes: row.notes || '' };
      });
    }
    setAttendanceMap(map);
  };

  const fetchMonthlySummary = async () => {
    const startDate = `${selectedMonth}-01`;
    const endDate = `${selectedMonth}-31`;

    const { data } = await supabase
      .from('staff_attendance')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    setMonthlyRecords(data || []);
  };

  const handleStatusChange = (staff: string, status: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [staff]: { ...prev[staff], status }
    }));
  };

  const handleNotesChange = (staff: string, notes: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [staff]: { ...prev[staff], notes }
    }));
  };

  const handleSaveAttendance = async () => {
    try {
      const payload = SALESMEN.map(staff => ({
        date: selectedDate,
        staff_name: staff,
        status: attendanceMap[staff]?.status || 'Present',
        notes: attendanceMap[staff]?.notes || ''
      }));

      const { error } = await supabase
        .from('staff_attendance')
        .upsert(payload, { onConflict: 'date,staff_name' });

      if (error) throw error;

      alert('Attendance saved successfully!');
      fetchMonthlySummary();
    } catch (err: any) {
      console.error(err);
      alert(`Error saving attendance: ${err.message}`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Users className="text-violet-600 w-5 h-5" /> Staff Attendance Register
          </h1>
          <p className="text-xs text-slate-500 font-medium">Manage daily staff presence and monthly tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border rounded-lg bg-slate-50 text-sm font-semibold text-black"
          />
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b">
            <tr>
              <th className="p-3">Staff Name</th>
              <th className="p-3">Status</th>
              <th className="p-3">Notes / Remarks</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y text-black font-medium">
            {SALESMEN.map(staff => (
              <tr key={staff}>
                <td className="p-3 font-bold text-slate-800">{staff}</td>
                <td className="p-3">
                  <select
                    value={attendanceMap[staff]?.status || 'Present'}
                    onChange={(e) => handleStatusChange(staff, e.target.value)}
                    className="px-3 py-1.5 border rounded-lg bg-slate-50 text-xs font-bold text-black"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Leave">Leave</option>
                  </select>
                </td>
                <td className="p-3">
                  <input
                    type="text"
                    placeholder="Optional notes..."
                    value={attendanceMap[staff]?.notes || ''}
                    onChange={(e) => handleNotesChange(staff, e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg bg-slate-50 text-xs font-medium text-black"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveAttendance}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl transition flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Attendance
        </button>
      </div>

      <div className="border-t pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-violet-600" /> Monthly Summary
          </h2>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 border rounded-lg bg-slate-50 text-sm font-semibold text-black"
          />
        </div>

        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Staff Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y text-black font-medium">
              {monthlyRecords.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">No attendance records found for selected month.</td>
                </tr>
              ) : (
                monthlyRecords.map(record => (
                  <tr key={record.id || `${record.date}-${record.staff_name}`}>
                    <td className="p-3">{record.date}</td>
                    <td className="p-3 font-bold">{record.staff_name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        record.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                        record.status === 'Absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{record.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
