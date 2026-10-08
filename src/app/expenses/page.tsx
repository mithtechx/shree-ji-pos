"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Receipt, Plus, Trash2, IndianRupee } from 'lucide-react';

interface ExpenseItem {
  id: string;
  title?: string;
  category: string;
  amount: number;
  description?: string;
  created_at: string;
}

export default function ExpenseManagerPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [category, setCategory] = useState('Tea / Snacks');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    try {
      const expenseTitle = description.trim() || category;

      const { error } = await supabase
        .from('expenses')
        .insert([{
          title: expenseTitle,
          category,
          amount: parseFloat(amount),
          description: description.trim()
        }]);

      if (error) throw error;

      setAmount('');
      setDescription('');
      fetchExpenses();
    } catch (err: any) {
      console.error(err);
      alert(`Error adding expense: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (!error) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Receipt className="text-violet-600 w-5 h-5" /> Shop Expense Manager
          </h1>
          <p className="text-xs text-slate-500 font-medium">Record daily operational expenditures</p>
        </div>
        <div className="bg-violet-50 border border-violet-100 px-4 py-2 rounded-xl text-right">
          <span className="text-[10px] font-bold uppercase text-violet-600 block">Total Expenses</span>
          <span className="text-lg font-black text-violet-900">₹{totalExpense.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white text-sm font-semibold text-black"
          >
            <option value="Tea / Snacks">Tea / Snacks</option>
            <option value="Stock Purchases">Stock Purchases</option>
            <option value="Rent">Rent</option>
            <option value="Electricity">Electricity</option>
            <option value="Salary / Advance">Salary / Advance</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><IndianRupee className="w-3 h-3 inline mr-1" /> Amount</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white text-sm font-semibold text-black"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Notes</label>
          <input
            type="text"
            placeholder="Details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white text-sm font-medium text-black"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-lg transition flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </form>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Category</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y text-black font-medium">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 font-normal">No recorded expenses yet.</td>
              </tr>
            ) : (
              expenses.map(item => (
                <tr key={item.id}>
                  <td className="p-3 text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="p-3 font-bold">{item.category}</td>
                  <td className="p-3 text-slate-600">{item.description || item.title || '-'}</td>
                  <td className="p-3 text-right font-black text-slate-800">₹{item.amount.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDeleteExpense(item.id)} className="text-red-500 hover:text-red-700">
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
