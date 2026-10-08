"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, Save, Trash2, MinusCircle, Calendar } from 'lucide-react';

interface GallaLog {
  id: string;
  date: string;
  total_sales: number;
  total_expenses: number;
  extra_expenses: number;
  net_cash: number;
  notes?: string;
  created_at: string;
}

export default function GallaPage() {
  const [salesToday, setSalesToday] = useState<number>(0);
  const [expensesToday, setExpensesToday] = useState<number>(0);
  const [extraExpenses, setExtraExpenses] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [logs, setLogs] = useState<GallaLog[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchTodayData();
    fetchGallaHistory();
  }, []);

  const fetchTodayData = async () => {
    // Local start & end of day ISO strings to match today's date
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    // 1. Fetch Today's Total Sales from 'bills' table using 'grand_total'
    const { data: billsData, error: billsError } = await supabase
      .from('bills')
      .select('grand_total')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (!billsError && billsData) {
      const totalSales = billsData.reduce((sum, b) => sum + (Number(b.grand_total) || 0), 0);
      setSalesToday(totalSales);
    }

    // 2. Fetch Today's Recorded Expenses from 'expenses' table
    const { data: expenseData, error: expError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (!expError && expenseData) {
      const totalExp = expenseData.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      setExpensesToday(totalExp);
    }
  };

  const fetchGallaHistory = async () => {
    const { data, error } = await supabase
      .from('galla_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLogs(data);
    }
  };

  const extraAmt = parseFloat(extraExpenses) || 0;
  const netCashInGalla = salesToday - expensesToday - extraAmt;

  const handleSaveGalla = async () => {
    setIsSaving(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('galla_logs').insert([
        {
          date: todayDate,
          total_sales: salesToday,
          total_expenses: expensesToday,
          extra_expenses: extraAmt,
          net_cash: netCashInGalla,
          notes: notes.trim(),
        },
      ]);

      if (error) throw error;

      setNotes('');
      setExtraExpenses('0');
      fetchGallaHistory();
      alert('Galla details saved successfully!');
    } catch (err: any) {
      console.error(err);
      alert(`Error saving Galla record: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    const { error } = await supabase.from('galla_logs').delete().eq('id', id);

    if (!error) {
      setLogs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Wallet className="text-violet-600 w-5 h-5" /> Daily Galla (Cash Register)
          </h1>
          <p className="text-xs text-slate-500 font-medium">Reconcile today's net cash balance and expenses</p>
        </div>
      </div>

      {/* Calculation Form */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-3.5 rounded-xl border">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Today's Sales</span>
            <span className="text-lg font-black text-emerald-600">+ ₹{salesToday.toFixed(2)}</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Logged Expenses</span>
            <span className="text-lg font-black text-red-500">- ₹{expensesToday.toFixed(2)}</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border">
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center gap-1">
              <MinusCircle className="w-3 h-3 text-red-500" /> Extra Unlogged Expenses
            </label>
            <input
              type="number"
              value={extraExpenses}
              onChange={(e) => setExtraExpenses(e.target.value)}
              className="w-full text-base font-bold text-black border rounded-md px-2 py-0.5 focus:outline-violet-600"
              placeholder="0.00"
            />
          </div>

          <div className="bg-violet-600 text-white p-3.5 rounded-xl border border-violet-700">
            <span className="text-[10px] font-bold uppercase block opacity-80">Net Cash in Galla</span>
            <span className="text-xl font-black">₹{netCashInGalla.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="md:col-span-3">
            <input
              type="text"
              placeholder="Notes or details (e.g. Extra tea expense, cash handover)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm font-medium bg-white text-black"
            />
          </div>

          <button
            onClick={handleSaveGalla}
            disabled={isSaving}
            className="py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Galla Info
          </button>
        </div>
      </div>

      {/* Saved Galla Logs Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1">
          <Calendar className="w-4 h-4 text-violet-600" /> Saved Galla Logs
        </h3>

        <div className="border rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3 text-right">Sales</th>
                <th className="p-3 text-right">Expenses</th>
                <th className="p-3 text-right">Extra Expenses</th>
                <th className="p-3 text-right">Net Cash</th>
                <th className="p-3">Notes</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y text-black font-medium">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-normal">
                    No Galla logs saved yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="p-3 text-xs text-slate-500 font-bold">
                      {new Date(log.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 text-right text-emerald-600 font-bold">
                      ₹{log.total_sales.toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-red-500 font-bold">
                      ₹{log.total_expenses.toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-orange-600 font-bold">
                      ₹{log.extra_expenses.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-black text-violet-900">
                      ₹{log.net_cash.toFixed(2)}
                    </td>
                    <td className="p-3 text-slate-600 text-xs">{log.notes || '-'}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
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
