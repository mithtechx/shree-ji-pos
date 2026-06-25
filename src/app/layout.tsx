"use client";

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, History, LogOut, Tags, Lock, User } from 'lucide-react';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Guard state to keep terminal locked until credentials match
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Check if they previously logged in during this browser session
  useEffect(() => {
    const sessionToken = sessionStorage.getItem('shree_ji_auth');
    if (sessionToken === 'active') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'shreeji123') {
      sessionStorage.setItem('shree_ji_auth', 'active');
      setIsAuthenticated(true);
    } else {
      alert('Invalid Store Credentials! Please try again.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('shree_ji_auth');
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    router.push('/');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Products', path: '/inventory', icon: Tags },
    { name: 'Billing', path: '/billing', icon: ShoppingBag },
    { name: 'Bill History', path: '/history', icon: History },
  ];

  // 1. Terminals are LOCKED until authorized
  if (!isAuthenticated) {
    return (
      <html lang="en">
        <body className="bg-slate-900 flex items-center justify-center min-h-screen p-4 font-sans antialiased">
          <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mb-4 text-white shadow-md font-bold text-2xl">
                🏪
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">SHREE JI COLLECTION</h2>
              <p className="text-xs text-slate-500 mt-1 font-bold">POS Terminal Authorization System</p>
            </div>

            <form onSubmit={handleFormLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Operator ID</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username..." 
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-violet-600 focus:bg-white text-black font-semibold"
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
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 bg-slate-50 rounded-xl text-sm focus:outline-none focus:border-violet-600 focus:bg-white text-black font-semibold"
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
        </body>
      </html>
    );
  }

  // 2. Renders layout screens instantly ONCE unlocked successfully
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 font-sans antialiased">
        <div className="flex min-h-screen print:bg-white">
          {/* Permanent Sidebar Menu Panel */}
          <aside className="w-64 bg-[#111625] text-slate-300 flex flex-col justify-between p-4 border-r border-slate-800 print:hidden shrink-0">
            <div>
              <div className="py-4 border-b border-slate-800 mb-6 px-2">
                <h2 className="text-lg font-black text-white tracking-wider uppercase">SHREE JI COLLECTION</h2>
                <p className="text-[10px] text-slate-500 font-bold tracking-tight mt-0.5">Billing Software v1.0</p>
              </div>

              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => router.push(item.path)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                        isActive 
                          ? 'bg-violet-600 text-white shadow-md' 
                          : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Logout Trigger Component Row */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </aside>

          {/* Dynamic Content Core Router */}
          <main className="flex-1 min-w-0 p-8 print:p-0">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}