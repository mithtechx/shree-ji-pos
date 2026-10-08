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
      .eq('attendance_date', selectedDate);

    const map: Record<string, { status: string; notes: string }> = {};
    SALESMEN.forEach((staff) => {
      map[staff] = { status: 'Full Day', notes: '' };
    });

    if (data) {
      data.forEach((row) => {
        map[row.staff_name] = { status: row.status, notes: row.notes || '' };
      });
    }

    setAttendanceMap(map);
  };

  const fetchMonthlySummary = async () => {
    const { data } = await supabase
      .from('staff_attendance')
      .select('*')
      .gte('attendance_date', `${selectedMonth}-01`)
      .lte('attendance_date', `${selectedMonth}-31`);

    if (data) {
      setMonthlyRecords(data);
    }
  };

  const handleStatusChange = (staff: string, status: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [staff]: { ...prev[staff], status },
    }));
  };

  const handleNotesChange = (staff: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [staff]: { ...prev[staff], notes },
    }));
  };

  const handleSaveAttendance = async () => {
    const upsertData = SALESMEN.map((staff) => ({
      staff_name: staff,
      attendance_date: selectedDate,
      status: attendanceMap[staff]?.status || 'Full Day',
      notes: attendanceMap[staff]?.notes || '',
    }));

    const { error } = await supabase
      .from('staff_attendance')
      .upsert(upsertData, { onConflict: 'staff_name,attendance_date' });

    if (!error) {
      alert('Attendance saved successfully!');
      fetchMonthlySummary();
    } else {
      alert('Failed to save attendance.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-violet-600" /> Staff Attendance
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Track daily attendance, leaves, and half-days for staff
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Entry Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-600" /> Daily Entry
            </h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold"
            />
          </div>

          <div className="space-y-3">
            {SALESMEN.map((staff) => (
              <div key={staff} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-slate-800">{staff}</span>
                  <select
                    value={attendanceMap[staff]?.status || 'Full Day'}
                    onChange={(e) => handleStatusChange(staff, e.target.value)}
                    className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                  >
                    <option value="Full Day">Full Day</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Leave">Leave</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Notes / Remarks..."
                  value={attendanceMap[staff]?.notes || ''}
                  onChange={(e) => handleNotesChange(staff, e.target.value)}
                  className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-medium"
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveAttendance}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-sm text-sm transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> SAVE TODAY'S ATTENDANCE
          </button>
        </div>

        {/* Monthly Summary Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-600" /> Monthly Summary
            </h2>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Staff Name</th>
                  <th className="p-3.5 text-center">Full Days</th>
                  <th className="p-3.5 text-center">Half Days</th>
                  <th className="p-3.5 text-center">Leaves</th>
                  <th className="p-3.5 text-center">Absents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {SALESMEN.map((staff) => {
                  const staffLogs = monthlyRecords.filter((r) => r.staff_name === staff);
                  const fullDays = staffLogs.filter((r) => r.status === 'Full Day').length;
                  const halfDays = staffLogs.filter((r) => r.status === 'Half Day').length;
                  const leaves = staffLogs.filter((r) => r.status === 'Leave').length;
                  const absents = staffLogs.filter((r) => r.status === 'Absent').length;

                  return (
                    <tr key={staff} className="hover:bg-slate-50">
                      <td className="p-3.5 font-bold text-slate-800">{staff}</td>
                      <td className="p-3.5 text-center text-emerald-600 font-bold">{fullDays}</td>
                      <td className="p-3.5 text-center text-amber-600 font-bold">{halfDays}</td>
                      <td className="p-3.5 text-center text-blue-600 font-bold">{leaves}</td>
                      <td className="p-3.5 text-center text-red-600 font-bold">{absents}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
