"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Professional secure check - you can change these defaults
    if (username === 'admin' && password === 'shreeji123') {
      router.push('/');
    } else {
      alert('Invalid Store Credentials! Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mb-4 text-white shadow-md">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">SHREE JE COLLECTION</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">POS Terminal Authorization System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Operator ID</label>
            <div className="relative">
              <input 
                type="text" 
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username..." 
                className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-violet-600 focus:bg-white text-black font-medium"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Secure Pin/Password</label>
            <div className="relative">
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-violet-600 focus:bg-white text-black font-medium"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md transition text-sm tracking-wide mt-2"
          >
            AUTHORIZE & LOG IN
          </button>
        </form>
      </div>
    </div>
  );
}