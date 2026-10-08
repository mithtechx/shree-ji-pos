"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Receipt, Plus, Trash2, IndianRupee, Wallet, CreditCard } from 'lucide-react';

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  payment_method: 'Cash' | 'Online';
  created_at: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Store Expense');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Online'>('Cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setExpenses(data);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    setLoading(true);
    const { error } = await supabase.from('expenses').insert([
      {
        title,
        amount: parseFloat(amount),
        category,
        payment_method: paymentMethod,
      },
    ]);

    if (!error) {
      setTitle('');
      setAmount('');
      setCategory('Store Expense');
      setPaymentMethod('Cash');
      fetchExpenses();
    } else {
      alert(`Error adding expense: ${error.message}`);
    }
    setLoading(false);
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (!error) {
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Receipt className="text-violet-500 w-7 h-7" /> Expenses Manager
        </h1>
        <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-right">
          <span className="text-xs text-slate-400 font-bold block uppercase">Total Logged Expenses</span>
          <span className="text-xl font-black text-red-400">₹{totalExpenseAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Expense Input Form */}
      <form onSubmit={handleAddExpense} className="bg-slate-800 p-5 rounded-2xl border border-slate-700 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Log New Expense</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title / Reason</label>
            <input
              type="text"
              required
              placeholder="e.g. Tea & Snacks, Electricity Bill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Amount (₹)</label>
            <input
              type="number"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="Store Expense">Store Expense</option>
              <option value="Staff Refreshment">Staff Refreshment</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Rent & Utility">Rent & Utility</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Payment Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border ${
                  paymentMethod === 'Cash'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" /> Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Online')}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 border ${
                  paymentMethod === 'Online'
                    ? 'bg-violet-600 text-white border-violet-500'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Online
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Log Expense Record
        </button>
      </form>

      {/* Expenses Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 text-slate-400 text-xs font-bold uppercase border-b border-slate-700">
            <tr>
              <th className="p-4">Reason / Title</th>
              <th className="p-4">Category</th>
              <th className="p-4">Payment Mode</th>
              <th className="p-4">Date</th>
              <th className="p-4 text-right">Amount</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 font-medium text-slate-200">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">No logged expenses found.</td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-700/30 transition">
                  <td className="p-4 font-bold text-white">{exp.title}</td>
                  <td className="p-4 text-slate-400">{exp.category}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                      exp.payment_method === 'Online' 
                        ? 'bg-violet-900/40 text-violet-300 border-violet-700/50' 
                        : 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50'
                    }`}>
                      {exp.payment_method || 'Cash'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{new Date(exp.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="p-4 text-right font-black text-red-400">₹{Number(exp.amount).toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleDeleteExpense(exp.id)} className="text-red-400 hover:text-red-300">
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
  );
}
