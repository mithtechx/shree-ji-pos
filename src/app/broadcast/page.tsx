"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Users, Image as ImageIcon, CheckCircle, MessageSquare, CheckSquare, Square } from 'lucide-react';

interface CustomerContact {
  customer_name: string;
  customer_mobile: string;
}

export default function BroadcastPage() {
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [selectedMobiles, setSelectedMobiles] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string>('Greetings from Shree Ji Collection! 🛍️ Check out our latest arrivals!');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSendingBatch, setIsSendingBatch] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchUniqueCustomers();
  }, []);

  const fetchUniqueCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bills')
      .select('customer_name, customer_mobile')
      .not('customer_mobile', 'is', null);

    if (!error && data) {
      const map = new Map();
      data.forEach(item => {
        const cleanMobile = item.customer_mobile?.replace(/\D/g, '');
        if (cleanMobile && cleanMobile.length >= 10 && !map.has(cleanMobile)) {
          map.set(cleanMobile, {
            customer_name: item.customer_name || 'Valued Customer',
            customer_mobile: cleanMobile
          });
        }
      });
      const uniqueList = Array.from(map.values()) as CustomerContact[];
      setContacts(uniqueList);
      // Select all by default
      setSelectedMobiles(new Set(uniqueList.map(c => c.customer_mobile)));
    }
    setLoading(false);
  };

  const toggleSelectAll = () => {
    if (selectedMobiles.size === contacts.length) {
      setSelectedMobiles(new Set());
    } else {
      setSelectedMobiles(new Set(contacts.map(c => c.customer_mobile)));
    }
  };

  const toggleSingleSelection = (mobile: string) => {
    const updated = new Set(selectedMobiles);
    if (updated.has(mobile)) {
      updated.delete(mobile);
    } else {
      updated.add(mobile);
    }
    setSelectedMobiles(updated);
  };

  // Start batch broadcast for either all or selected subset
  const startBatchBroadcast = (targetList: CustomerContact[]) => {
    if (targetList.length === 0) {
      alert('Please select at least one customer to message.');
      return;
    }
    setIsSendingBatch(true);
    setCurrentIndex(0);
    sendNextCustomer(0, targetList);
  };

  const sendNextCustomer = (index: number, list: CustomerContact[]) => {
    if (index >= list.length) {
      setIsSendingBatch(false);
      alert('🎉 Bulk broadcast queue finished successfully!');
      return;
    }

    setCurrentIndex(index);
    const contact = list[index];
    const phone = `91${contact.customer_mobile}`;
    
    let fullText = `Hello ${contact.customer_name}!\n\n${message}`;
    if (imageUrl.trim()) {
      fullText += `\n\n📷 Promo Image: ${imageUrl.trim()}`;
    }

    const encoded = encodeURIComponent(fullText);
    
    // Opens WhatsApp Web tab sequentially
    window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`, '_blank');

    // Move to next after 4 seconds
    setTimeout(() => {
      sendNextCustomer(index + 1, list);
    }, 4000);
  };

  const selectedContactsList = contacts.filter(c => selectedMobiles.has(c.customer_mobile));

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-violet-600 w-5 h-5" /> Bulk WhatsApp Campaign & Greetings
          </h1>
          <p className="text-xs text-slate-500 font-medium">Auto-extracted from your bill history database</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-violet-50 text-violet-700 px-4 py-2 rounded-xl text-xs font-bold border border-violet-200 flex items-center gap-2">
            <Users className="w-4 h-4" /> Total Unique: {contacts.length}
          </div>
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Selected: {selectedMobiles.size}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Campaign Controls */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 md:col-span-1">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Campaign Content</h3>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Message Template</label>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-black font-medium focus:outline-violet-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-violet-600" /> Image Link (Optional)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-black focus:outline-violet-600"
              placeholder="https://imgur.com/your-image.jpg"
            />
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => startBatchBroadcast(contacts)}
              disabled={isSendingBatch || contacts.length === 0}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSendingBatch ? 'Sending to All...' : '🚀 Send to All Customers'}
            </button>

            <button
              onClick={() => startBatchBroadcast(selectedContactsList)}
              disabled={isSendingBatch || selectedMobiles.size === 0}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSendingBatch ? 'Sending to Selected...' : `🎯 Send to Selected Only (${selectedMobiles.size})`}
            </button>
          </div>
        </div>

        {/* Target Contacts Preview & Selection Table */}
        <div className="md:col-span-2 border rounded-xl overflow-hidden bg-slate-50 flex flex-col">
          <div className="p-3 bg-slate-100 border-b font-bold text-xs uppercase text-slate-600 flex justify-between items-center">
            <span>Target Audience Preview ({contacts.length} numbers)</span>
            <button
              onClick={toggleSelectAll}
              className="text-violet-600 hover:underline text-xs font-bold flex items-center gap-1"
            >
              {selectedMobiles.size === contacts.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selectedMobiles.size === contacts.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="max-h-[450px] overflow-y-auto divide-y flex-1">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Fetching customer numbers from bills...</div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No mobile numbers found in bill history yet.</div>
            ) : (
              contacts.map((c, i) => {
                const isSelected = selectedMobiles.has(c.customer_mobile);
                return (
                  <div
                    key={i}
                    onClick={() => toggleSingleSelection(c.customer_mobile)}
                    className={`p-3 flex items-center justify-between text-sm cursor-pointer transition ${
                      currentIndex === i && isSendingBatch
                        ? 'bg-violet-100'
                        : isSelected
                        ? 'bg-white hover:bg-slate-100/80'
                        : 'bg-slate-100/50 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button type="button" className="text-violet-600">
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>
                      <div>
                        <span className="font-bold text-slate-800">{c.customer_name}</span>
                        <span className="text-xs text-slate-500 ml-2 font-mono">+91 {c.customer_mobile}</span>
                      </div>
                    </div>
                    {currentIndex === i && isSendingBatch && (
                      <span className="text-xs font-bold text-violet-600 animate-bounce">Sending now...</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
