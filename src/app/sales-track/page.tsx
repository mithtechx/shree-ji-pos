"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Calendar, Receipt, IndianRupee, Filter, BarChart3, Percent } from 'lucide-react';

interface Bill {
  id: string;
  customer_name: string;
  customer_mobile: string | null;
  salesman_name: string;
  created_at: string;
  grand_total: number;
}

interface MonthlyAnalytics {
  monthKey: string;
  totalSales: number;
  percentageShare: number;
}

export default function SalesTrackPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [allBillsForAnalytics, setAllBillsForAnalytics] = useState<Bill[]>([]);
  const [filterType, setFilterType] = useState<'today' | 'month' | 'year' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSalesData();
  }, [filterType, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  useEffect(() => {
    fetchMonthlyAnalyticsData();
  }, []);

  const fetchSalesData = async () => {
    setLoading(true);
    let query = supabase.from('bills').select('*').order('created_at', { ascending: false });

    if (filterType === 'today') {
      const dayStart = `${selectedDate}T00:00:00.000Z`;
      const dayEnd = `${selectedDate}T23:59:59.999Z`;
      query = query.gte('created_at', dayStart).lte('created_at', dayEnd);
    } else if (filterType === 'month') {
      const [year, month] = selectedMonth.split('-');
      const monthStart = new Date(Number(year), Number(month) - 1, 1).toISOString();
      const monthEnd = new Date(Number(year), Number(month), 0, 23, 59, 59, 999).toISOString();
      query = query.gte('created_at', monthStart).lte('created_at', monthEnd);
    } else if (filterType === 'year') {
      const yearStart = `${selectedYear}-01-01T00:00:00.000Z`;
      const yearEnd = `${selectedYear}-12-31T23:59:59.999Z`;
      query = query.gte('created_at', yearStart).lte('created_at', yearEnd);
    } else if (filterType === 'custom' && startDate && endDate) {
      query = query.gte('created_at', `${startDate}T00:00:00.000Z`).lte('created_at', `${endDate}T23:59:59.999Z`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setBills(data);
    }
    setLoading(false);
  };

  const fetchMonthlyAnalyticsData = async () => {
    const { data, error } = await supabase.from('bills').select('grand_total, created_at');
    if (!error && data) {
      setAllBillsForAnalytics(data as Bill[]);
    }
  };

  const totalBills = bills.length;
  const totalSalesAmount = bills.reduce((sum, bill) => sum + (Number(bill.grand_total) || 0), 0);

  // Monthly Breakdown Calculations
  const lifetimeSalesTotal = allBillsForAnalytics.reduce((sum, b) => sum + (Number(b.grand_total) || 0), 0);
  const monthlyMap: Record<string, number> = {};

  allBillsForAnalytics.forEach((b) => {
    const d = new Date(b.created_at);
    const mKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthlyMap[mKey] = (monthlyMap[mKey] || 0) + (Number(b.grand_total) || 0);
  });

  const monthlyList: MonthlyAnalytics[] = Object.keys(monthlyMap).map((mKey) => {
    const monthAmt = monthlyMap[mKey];
    const pct = lifetimeSalesTotal > 0 ? (monthAmt / lifetimeSalesTotal) * 100 : 0;
    return {
      monthKey: mKey,
      totalSales: monthAmt,
      percentageShare: pct,
    };
  });

  const highestMonthSales = monthlyList.reduce((max, item) => (item.totalSales > max ? item.totalSales : max), 0);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <TrendingUp className="text-violet-500 w-7 h-7" /> Sales Track & Analytics
        </h1>
      </div>

      {/* FILTER BAR */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
            <Filter className="w-3 h-3 inline mr-1" /> Filter Period
          </label>
          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="today">Day-Wise</option>
            <option value="month">Month-Wise</option>
            <option value="year">Year-Wise</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {filterType === 'today' && (
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
            />
          </div>
        )}

        {filterType === 'month' && (
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
            />
          </div>
        )}

        {filterType === 'year' && (
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Select Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              placeholder="e.g. 2026"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
            />
          </div>
        )}

        {filterType === 'custom' && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
              />
            </div>
          </>
        )}
      </div>

      {/* SUMMARY CARDS BOXES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Bills Generated</p>
            <h2 className="text-3xl font-black text-white">{totalBills}</h2>
          </div>
          <div className="p-4 bg-violet-600/20 text-violet-400 rounded-2xl border border-violet-500/30">
            <Receipt className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Filtered Revenue Collected</p>
            <h2 className="text-3xl font-black text-emerald-400">₹{totalSalesAmount.toFixed(2)}</h2>
          </div>
          <div className="p-4 bg-emerald-600/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <IndianRupee className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* MONTH-WISE GRAPH & ANALYTICS SECTION */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <BarChart3 className="text-violet-400 w-5 h-5" /> Month-Wise Sales Breakdown & Share
        </h2>

        <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800 text-slate-400 text-xs font-bold uppercase border-b border-slate-700">
              <tr>
                <th className="p-3">Month</th>
                <th className="p-3 text-right">Revenue</th>
                <th className="p-3 text-right">Sales Share (%)</th>
                <th className="p-3">Monthly Graph</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-slate-200">
              {monthlyList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-500">
                    No monthly breakdown data available.
                  </td>
                </tr>
              ) : (
                monthlyList.map((item, idx) => {
                  const barWidth = highestMonthSales > 0 ? (item.totalSales / highestMonthSales) * 100 : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-white">{item.monthKey}</td>
                      <td className="p-3 text-right font-black text-emerald-400">
                        ₹{item.totalSales.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold text-violet-400">
                        {item.percentageShare.toFixed(1)}%
                      </td>
                      <td className="p-3 w-1/3">
                        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
                          <div
                            className="bg-violet-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED TABLE */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400 text-xs font-bold uppercase border-b border-slate-700">
            <tr>
              <th className="p-4">Customer Name</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">Salesman</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 font-medium text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">Loading sales records...</td>
              </tr>
            ) : bills.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">No bill records found for selected period.</td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-700/30 transition">
                  <td className="p-4 font-bold text-white">{bill.customer_name}</td>
                  <td className="p-4 text-slate-400">{bill.customer_mobile || 'N/A'}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-violet-900/40 text-violet-300 border border-violet-700/50 rounded-md text-xs">
                      {bill.salesman_name || 'Rahul'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{new Date(bill.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="p-4 text-right font-black text-emerald-400">₹{Number(bill.grand_total).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
