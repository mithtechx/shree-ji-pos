"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Users, Image as ImageIcon, CheckCircle, MessageSquare } from 'lucide-react';

interface CustomerContact {
  customer_name: string;
  customer_mobile: string;
}

export default function BroadcastPage() {
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
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
      setContacts(Array.from(map.values()));
    }
    setLoading(false);
  };

  // Start automated batch queue right from the platform UI
  const startBatchBroadcast = () => {
    if (contacts.length === 0) return;
    setIsSendingBatch(true);
    setCurrentIndex(0);
    sendNextCustomer(0);
  };

  const sendNextCustomer = (index: number) => {
    if (index >= contacts.length) {
      setIsSendingBatch(false);
      alert('🎉 Bulk broadcast queue finished successfully!');
      return;
    }

    setCurrentIndex(index);
    const contact = contacts[index];
    const phone = `91${contact.customer_mobile}`;
    
    let fullText = `Hello ${contact.customer_name}!\n\n${message}`;
    if (imageUrl.trim()) {
      fullText += `\n\n📷 Promo Image: ${imageUrl.trim()}`;
    }

    const encoded = encodeURIComponent(fullText);
    
    // Opens WhatsApp Web tab for each customer sequentially
    window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encoded}`, '_blank');

    // Automatically move to the next customer after 4 seconds
    setTimeout(() => {
      sendNextCustomer(index + 1);
    }, 4000);
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-violet-600 w-5 h-5" /> Bulk WhatsApp Campaign & Greetings
          </h1>
          <p className="text-xs text-slate-500 font-medium">Auto-extracted from your bill history database</p>
        </div>
        <div className="bg-violet-50 text-violet-700 px-4 py-2 rounded-xl text-xs font-bold border border-violet-200 flex items-center gap-2">
          <Users className="w-4 h-4" /> Total Unique Customers: {contacts.length}
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

          <button
            onClick={startBatchBroadcast}
            disabled={isSendingBatch || contacts.length === 0}
            className={`w-full py-3.5 text-white font-bold text-sm rounded-xl shadow transition flex items-center justify-center gap-2 ${
              isSendingBatch ? 'bg-emerald-600 animate-pulse' : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            <Send className="w-4 h-4" />
            {isSendingBatch ? `Sending (${currentIndex + 1}/${contacts.length})...` : '🚀 Send to All Customers'}
          </button>
        </div>

        {/* Target Contacts Preview Table */}
        <div className="md:col-span-2 border rounded-xl overflow-hidden bg-slate-50">
          <div className="p-3 bg-slate-100 border-b font-bold text-xs uppercase text-slate-600">
            Target Audience Preview ({contacts.length} numbers)
          </div>
          <div className="max-h-[400px] overflow-y-auto divide-y">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">Fetching customer numbers from bills...</div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No mobile numbers found in bill history yet.</div>
            ) : (
              contacts.map((c, i) => (
                <div key={i} className={`p-3 flex items-center justify-between text-sm ${currentIndex === i && isSendingBatch ? 'bg-violet-100' : 'bg-white'}`}>
                  <div>
                    <span className="font-bold text-slate-800">{c.customer_name}</span>
                    <span className="text-xs text-slate-500 ml-2 font-mono">+91 {c.customer_mobile}</span>
                  </div>
                  {currentIndex === i && isSendingBatch && (
                    <span className="text-xs font-bold text-violet-600 animate-bounce">Sending now...</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
