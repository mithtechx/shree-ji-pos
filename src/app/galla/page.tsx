"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wallet, Save, Trash2, MinusCircle, Calendar, CreditCard, IndianRupee } from 'lucide-react';

interface GallaLog {
  id: string;
  date: string;
  total_sales: number;
  total_expenses: number;
  cash_sales: number;
  online_sales: number;
  cash_expenses: number;
  online_expenses: number;
  extra_expenses: number;
  net_cash: number;
  notes?: string;
  created_at: string;
}

export default function GallaPage() {
  const [salesCashToday, setSalesCashToday] = useState<number>(0);
  const [salesOnlineToday, setSalesOnlineToday] = useState<number>(0);
  const [expensesCashToday, setExpensesCashToday] = useState<number>(0);
  const [expensesOnlineToday, setExpensesOnlineToday] = useState<number>(0);
  
  const [extraExpenses, setExtraExpenses] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [logs, setLogs] = useState<GallaLog[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchTodayData();
    fetchGallaHistory();
  }, []);

  const fetchTodayData = async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    // 1. Fetch Sales (Cash vs Online) from 'bills'
    const { data: billsData, error: billsError } = await supabase
      .from('bills')
      .select('grand_total, payment_mode')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (!billsError && billsData) {
      let cashTotal = 0;
      let onlineTotal = 0;

      billsData.forEach((b) => {
        const amt = Number(b.grand_total) || 0;
        if (b.payment_mode === 'Online') {
          onlineTotal += amt;
        } else {
          cashTotal += amt; // Default Cash
        }
      });

      setSalesCashToday(cashTotal);
      setSalesOnlineToday(onlineTotal);
    }

    // 2. Fetch Expenses (Cash vs Online) from 'expenses'
    const { data: expData, error: expError } = await supabase
      .from('expenses')
      .select('amount, payment_method')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay);

    if (!expError && expData) {
      let expCash = 0;
      let expOnline = 0;

      expData.forEach((e) => {
        const amt = Number(e.amount) || 0;
        if (e.payment_method === 'Online') {
          expOnline += amt;
        } else {
          expCash += amt;
        }
      });

      setExpensesCashToday(expCash);
      setExpensesOnlineToday(expOnline);
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

  const totalSalesToday = salesCashToday + salesOnlineToday;
  const totalExpensesToday = expensesCashToday + expensesOnlineToday;
  const extraAmt = parseFloat(extraExpenses) || 0;
  
  // Total overall balance vs Net physical cash in drawer
  const netInGallaCash = salesCashToday - expensesCashToday - extraAmt;
  const netOnlineTotal = salesOnlineToday - expensesOnlineToday;
  const grandTotalReconciled = totalSalesToday - totalExpensesToday - extraAmt;

  const handleSaveGalla = async () => {
    setIsSaving(true);
    try {
      const todayDate = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('galla_logs').insert([
        {
          date: todayDate,
          total_sales: totalSalesToday,
          total_expenses: totalExpensesToday,
          cash_sales: salesCashToday,
          online_sales: salesOnlineToday,
          cash_expenses: expensesCashToday,
          online_expenses: expensesOnlineToday,
          extra_expenses: extraAmt,
          net_cash: netInGallaCash,
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
            <Wallet className="text-violet-600 w-5 h-5" /> Daily Galla (Cash & Online Reconciliation)
          </h1>
          <p className="text-xs text-slate-500 font-medium">Reconcile today's physical cash register vs digital online receipts</p>
        </div>
      </div>

      {/* Overview Metric Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Store Collection</span>
          <h2 className="text-3xl font-black text-emerald-400">₹{grandTotalReconciled.toFixed(2)}</h2>
          <p className="text-[11px] text-slate-400 mt-2">Combined net cash + online earnings</p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Wallet className="w-4 h-4 text-emerald-600" /> Physical Cash In Galla Drawer
          </span>
          <h2 className="text-2xl font-black text-emerald-700">₹{netInGallaCash.toFixed(2)}</h2>
          <div className="mt-2 text-xs font-semibold text-emerald-900 space-y-0.5">
            <div>Sales: +₹{salesCashToday.toFixed(2)}</div>
            <div>Logged Exp: -₹{expensesCashToday.toFixed(2)}</div>
            {extraAmt > 0 && <div>Extra Unlogged: -₹{extraAmt.toFixed(2)}</div>}
          </div>
        </div>

        <div className="bg-violet-50 border border-violet-200 p-5 rounded-2xl">
          <span className="text-xs font-bold text-violet-800 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <CreditCard className="w-4 h-4 text-violet-600" /> Net Online / UPI Collection
          </span>
          <h2 className="text-2xl font-black text-violet-700">₹{netOnlineTotal.toFixed(2)}</h2>
          <div className="mt-2 text-xs font-semibold text-violet-900 space-y-0.5">
            <div>Online Sales: +₹{salesOnlineToday.toFixed(2)}</div>
            <div>Online Exp: -₹{expensesOnlineToday.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Input Adjustments */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase block mb-1 flex items-center gap-1">
              <MinusCircle className="w-3.5 h-3.5 text-red-500" /> Extra Unlogged Expenses (Cash Out)
            </label>
            <input
              type="number"
              value={extraExpenses}
              onChange={(e) => setExtraExpenses(e.target.value)}
              className="w-full text-base font-bold text-black border rounded-xl p-2.5 bg-white focus:outline-violet-600"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 uppercase block mb-1">Galla Reconciliation Notes</label>
            <input
              type="text"
              placeholder="Notes or details (e.g. Extra tea expense, cash handover)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm font-medium border rounded-xl p-2.5 bg-white text-black"
            />
          </div>
        </div>

        <button
          onClick={handleSaveGalla}
          disabled={isSaving}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 shadow"
        >
          <Save className="w-4 h-4" /> Save Galla Info Record
        </button>
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
                <th className="p-3 text-right">Cash In Galla</th>
                <th className="p-3 text-right">Online Collection</th>
                <th className="p-3 text-right">Total Sales</th>
                <th className="p-3 text-right">Total Expenses</th>
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
                    <td className="p-3 text-right font-black text-emerald-600">
                      ₹{Number(log.net_cash || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-bold text-violet-600">
                      ₹{(Number(log.online_sales || 0) - Number(log.online_expenses || 0)).toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-slate-700 font-bold">
                      ₹{Number(log.total_sales || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-red-500 font-bold">
                      ₹{Number(log.total_expenses || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-slate-600 text-xs">{log.notes || '-'}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleDeleteLog(log.id)} className="text-red-500 hover:text-red-700">
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
