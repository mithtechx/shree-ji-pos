"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './lib/supabase';
import { ShoppingBag, Tags, History, AlertCircle, TrendingUp } from 'lucide-react';

export const revalidate = 0; // forces dashboard to fetch brand new data on every single page load 

export default function Dashboard() {
  const router = useRouter();
  const [totalProducts, setTotalProducts] = useState(0);
  const [todaySales, setTodaySales] = useState(0);

  useEffect(() => {
    async function loadStats() {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
      setTotalProducts(count || 0);

      // 1. Get the 24-hour window for the current local day
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      // 2. Query only the bills generated today
      const { data } = await supabase
        .from('bills')
        .select('grand_total')
        .gte('created_at', startOfToday.toISOString())
        .lte('created_at', endOfToday.toISOString());

      if (data) {
        setTodaySales(data.reduce((sum, b) => sum + Number(b.grand_total || 0), 0));
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Shree Ji Collection</h1>
          <p className="text-blue-100 text-sm mt-1 font-medium">Billing & Inventory Management System</p>
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
          🏪
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Total Products</span>
              <span className="text-3xl font-black text-slate-800">{totalProducts}</span>
              <span className="text-xs text-slate-400 block mt-1">Products in inventory</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Tags className="w-6 h-6"/></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Today's Sales</span>
              <span className="text-3xl font-black text-emerald-600">₹{todaySales.toFixed(2)}</span>
              <span className="text-xs text-emerald-500 block mt-1">Total sales today</span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp className="w-6 h-6"/></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Low Stock Products</span>
              <span className="text-3xl font-black text-amber-600">0</span>
              <span className="text-xs text-amber-500 block mt-1">No low stock products</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><AlertCircle className="w-6 h-6"/></div>
          </div>
        </div>
      </div>

      {/* Quick Actions Sections */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button 
            onClick={() => router.push('/inventory')}
            className="p-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm text-left flex flex-col justify-between h-32 transition group"
          >
            <Tags className="w-6 h-6 opacity-80" />
            <div>
              <p className="text-lg font-black">Add Product</p>
              <p className="text-xs font-normal text-blue-100 group-hover:underline">Add new product to inventory →</p>
            </div>
          </button>

          <button 
            onClick={() => router.push('/billing')}
            className="p-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-sm text-left flex flex-col justify-between h-32 transition group"
          >
            <ShoppingBag className="w-6 h-6 opacity-80" />
            <div>
              <p className="text-lg font-black">Create Bill</p>
              <p className="text-xs font-normal text-emerald-100 group-hover:underline">Generate new customer bill →</p>
            </div>
          </button>

          <button 
            onClick={() => router.push('/history')}
            className="p-5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-sm text-left flex flex-col justify-between h-32 transition group"
          >
            <History className="w-6 h-6 opacity-80" />
            <div>
              <p className="text-lg font-black">View Inventory</p>
              <p className="text-xs font-normal text-violet-100 group-hover:underline">Manage and view all products →</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}