"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { UserCheck, Filter, Calculator, Award, IndianRupee, Receipt, Percent } from 'lucide-react';

interface BillRecord {
  id: string;
  invoice_number: number;
  customer_name: string;
  salesman_name?: string;
  subtotal: number;
  discount_value: number;
  grand_total: number;
  created_at: string;
}

const SALESMEN_LIST = ['Rahul', 'Akash', 'Pavan', 'Junaid', 'Sales 5'];

export default function SalesmanCommissionPage() {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterType, setFilterType] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedSalesman, setSelectedSalesman] = useState<string>('ALL');

  // Commission Calculator States
  const [commissionPercent, setCommissionPercent] = useState<number>(2); // Default 2%
  const [customPercentInput, setCustomPercentInput] = useState<string>('2');

  useEffect(() => {
    fetchBills();
  }, [filterType, selectedDate, selectedMonth, selectedYear, startDate, endDate]);

  const fetchBills = async () => {
    setLoading(true);
    let query = supabase.from('bills').select('*').order('created_at', { ascending: false });

    if (filterType === 'today') {
      const dayStart = `${selectedDate}T00:00:00.000Z`;
      const dayEnd = `${selectedDate}T23:59:59.999Z`;
      query = query.gte('created_at', dayStart).lte('created_at', dayEnd);
    } else if (filterType === 'week') {
      const target = new Date(selectedDate);
      const weekStart = new Date(target);
      weekStart.setDate(target.getDate() - target.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      query = query.gte('created_at', weekStart.toISOString()).lte('created_at', weekEnd.toISOString());
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
    if (data) setBills(data);
    setLoading(false);
  };

  // Filter bills by selected salesman dropdown
  const filteredBills = useMemo(() => {
    if (selectedSalesman === 'ALL') return bills;
    return bills.filter(b => (b.salesman_name || 'Rahul') === selectedSalesman);
  }, [bills, selectedSalesman]);

  // Aggregate stats per salesman or filtered pool
  const totalFilteredSales = filteredBills.reduce((sum, b) => sum + Number(b.grand_total || 0), 0);
  const totalFilteredDiscount = filteredBills.reduce((sum, b) => sum + Number(b.discount_value || 0), 0);
  const calculatedCommissionAmount = (totalFilteredSales * commissionPercent) / 100;

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Award className="text-violet-500 w-7 h-7" /> Salesman Commission & Performance Tracker
          </h1>
          <p className="text-xs text-slate-400 font-medium">Track bills, sales volume, and compute commission payouts per salesman</p>
        </div>
      </div>

      {/* FILTER & SORT BAR */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
            <Filter className="w-3 h-3 inline mr-1" /> Period Sort
          </label>
          <select
            value={filterType}
            onChange={(e: any) => setFilterType(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="today">Day-Wise</option>
            <option value="week">Week-Wise</option>
            <option value="month">Month-Wise</option>
            <option value="year">Year-Wise</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {/* Dynamic Period Input */}
        {(filterType === 'today' || filterType === 'week') && (
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Reference Date</label>
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
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
            />
          </div>
        )}

        {filterType === 'custom' && (
          <div className="grid grid-cols-2 gap-2 sm:col-span-2">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">From</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">To</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" />
            </div>
          </div>
        )}

        {/* Salesman Filter */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
            <UserCheck className="w-3 h-3 inline mr-1" /> Select Salesman
          </label>
          <select
            value={selectedSalesman}
            onChange={(e) => setSelectedSalesman(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold"
          >
            <option value="ALL">All Salesmen Combined</option>
            {SALESMEN_LIST.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl flex items-center justify-between shadow">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Bills Handled</p>
            <h2 className="text-2xl font-black text-white mt-1">{filteredBills.length}</h2>
          </div>
          <div className="p-3 bg-violet-600/20 text-violet-400 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl flex items-center justify-between shadow">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Sales Volume</p>
            <h2 className="text-2xl font-black text-emerald-400 mt-1">₹{totalFilteredSales.toFixed(2)}</h2>
          </div>
          <div className="p-3 bg-emerald-600/20 text-emerald-400 rounded-xl">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl flex items-center justify-between shadow">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Discounts Given</p>
            <h2 className="text-2xl font-black text-red-400 mt-1">₹{totalFilteredDiscount.toFixed(2)}</h2>
          </div>
          <div className="p-3 bg-red-600/20 text-red-400 rounded-xl">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* BILLS LEDGER BREAKDOWN TABLE */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-900 border-b border-slate-700 font-bold text-sm flex items-center justify-between">
          <span>Salesman Bill Ledger Records</span>
          <span className="text-xs text-slate-400">Showing {filteredBills.length} bills</span>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/60 text-slate-400 text-xs font-bold uppercase border-b border-slate-700">
            <tr>
              <th className="p-4">Invoice ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Salesman</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Discount (₹)</th>
              <th className="p-4 text-right">Sale Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 font-medium text-slate-200">
            {loading ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading salesman records...</td></tr>
            ) : filteredBills.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">No bill records found for this selection.</td></tr>
            ) : (
              filteredBills.map((b) => {
                const sub = Number(b.subtotal || b.grand_total);
                const disc = Number(b.discount_value || 0);
                return (
                  <tr key={b.id} className="hover:bg-slate-700/30 transition">
                    <td className="p-4 font-mono font-bold text-violet-400">#{b.invoice_number}</td>
                    <td className="p-4 font-bold text-white">{b.customer_name}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-violet-900/40 text-violet-300 border border-violet-700/50 rounded-md text-xs font-bold">
                        {b.salesman_name || 'Rahul'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">{new Date(b.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="p-4 text-right text-red-400">-₹{disc.toFixed(2)}</td>
                    <td className="p-4 text-right font-black text-emerald-400">₹{Number(b.grand_total).toFixed(2)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* COMMISSION CALCULATOR WIDGET AT THE BOTTOM */}
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-white">
          <Calculator className="text-violet-400 w-5 h-5" /> Commission Payout Calculator
        </h2>
        <p className="text-xs text-slate-400">Select or enter custom commission rate percentage to calculate total earnings for {selectedSalesman === 'ALL' ? 'All Salesmen' : selectedSalesman}:</p>

        {/* Preloaded Quick Percent Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {[1, 2, 3, 4, 5].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setCommissionPercent(p); setCustomPercentInput(p.toString()); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                commissionPercent === p
                  ? 'bg-violet-600 text-white border-violet-500 shadow'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {p}% Commission
            </button>
          ))}

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-slate-400 uppercase">Custom %:</span>
            <input
              type="number"
              step="0.1"
              value={customPercentInput}
              onChange={(e) => {
                setCustomPercentInput(e.target.value);
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setCommissionPercent(val);
              }}
              className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-violet-500"
              placeholder="e.g. 2.5"
            />
          </div>
        </div>

        {/* Calculated Result Box */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase block">Calculation Breakdown</span>
            <p className="text-sm font-semibold text-slate-300 mt-1">
              Total Sales (₹{totalFilteredSales.toFixed(2)}) × Commission Rate ({commissionPercent}%)
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-400 uppercase block">Payable Commission Payout</span>
            <span className="text-3xl font-black text-emerald-400">₹{calculatedCommissionAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
