"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Receipt, Plus, Trash2, Calendar, IndianRupee } from 'lucide-react';

export default function ExpenseManagerPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // New Expense Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('General');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchExpenses();
  }, [filterPeriod, selectedDate]);

  const fetchExpenses = async () => {
    let query = supabase.from('expenses').select('*').order('expense_date', { ascending: false });

    if (filterPeriod === 'day') {
      query = query.eq('expense_date', selectedDate);
    } else if (filterPeriod === 'month') {
      const yearMonth = selectedDate.substring(0, 7);
      query = query.gte('expense_date', `${yearMonth}-01`).lte('expense_date', `${yearMonth}-31`);
    } else if (filterPeriod === 'year') {
      const year = selectedDate.substring(0, 4);
      query = query.gte('expense_date', `${year}-01-01`).lte('expense_date', `${year}-12-31`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setExpenses(data);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const { error } = await supabase.from('expenses').insert([
      {
        title,
        amount: parseFloat(amount),
        category,
        payment_mode: paymentMode,
        expense_date: expenseDate,
      },
    ]);

    if (!error) {
      setTitle('');
      setAmount('');
      fetchExpenses();
    } else {
      alert('Failed to add expense.');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      await supabase.from('expenses').delete().eq('id', id);
      fetchExpenses();
    }
  };

  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-violet-600" /> Expense Manager
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Log and track daily shop operating expenses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-violet-600" /> Add New Expense
          </h2>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Title / Details</label>
              <input
                type="text"
                required
                placeholder="e.g. Tea & Refreshments, Rent..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-white"
                >
                  <option value="General">General</option>
                  <option value="Rent">Rent</option>
                  <option value="Electricity">Electricity</option>
                  <option value="Tea/Snacks">Tea/Snacks</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Salary">Salary</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI / Online">UPI / Online</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Date</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-sm text-sm transition"
            >
              SAVE EXPENSE
            </button>
          </form>
        </div>

        {/* Expenses List & Filter */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Period:</label>
              <select
                value={filterPeriod}
                onChange={(e: any) => setFilterPeriod(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold bg-white"
              >
                <option value="day">Day-Wise</option>
                <option value="month">Month-Wise</option>
                <option value="year">Year-Wise</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {filterPeriod !== 'all' && (
              <input
                type={filterPeriod === 'year' ? 'number' : filterPeriod === 'month' ? 'month' : 'date'}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-semibold"
              />
            )}

            <div className="bg-violet-50 text-violet-700 px-4 py-2 rounded-xl border border-violet-200 font-black text-sm flex items-center gap-1">
              Total: ₹{totalExpense.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 font-semibold">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="p-3.5 text-xs text-slate-500 font-bold">{exp.expense_date}</td>
                      <td className="p-3.5 font-bold text-slate-800">{exp.title}</td>
                      <td className="p-3.5"><span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-semibold">{exp.category}</span></td>
                      <td className="p-3.5 text-xs font-semibold">{exp.payment_mode}</td>
                      <td className="p-3.5 text-right font-black text-red-600">₹{Number(exp.amount).toFixed(2)}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
