"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ThermalReceipt from '../components/ThermalReceipt';
import { History, Search, Printer, Eye, X } from 'lucide-react';

interface BillRecord {
  id: string;
  invoice_number: number;
  customer_name: string;
  customer_mobile: string;
  subtotal: number;
  discount_value: number;
  grand_total: number;
  created_at: string;
}

export default function BillHistoryLog() {
  const [bills, setBills] = useState<BillRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBill, setSelectedBill] = useState<BillRecord | null>(null);
  const [billItems, setBillItems] = useState<any[]>([]);

  const fetchBillHistory = async () => {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setBills(data);
  };

  useEffect(() => {
    fetchBillHistory();
  }, []);

  const handleViewBillDetails = async (bill: BillRecord) => {
    setSelectedBill(bill);
    // Fetch snapshot item records matching the target bill key link
    const { data } = await supabase
      .from('bill_items')
      .select('*')
      .eq('bill_id', bill.id);
    
    setBillItems(data || []);
  };

  const handleInstantReprint = () => {
    window.print();
  };

  const filteredBills = bills.filter(b => 
    b.invoice_number.toString().includes(searchQuery) ||
    b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.customer_mobile && b.customer_mobile.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <History className="text-violet-600 w-5 h-5"/> Customer Bill Ledger History
        </h2>
      </div>

      {/* Search Input Filter */}
      <div className="relative max-w-md print:hidden">
        <input 
          type="text" 
          placeholder="Search by Invoice #, Name, or Mobile Number..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-xl bg-white text-xs font-medium text-black focus:outline-none"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      {/* Main Ledger Table Grid View */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm print:hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b">
            <tr>
              <th className="p-3">Invoice ID</th>
              <th className="p-3">Customer Info</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Total Discount</th>
              <th className="p-3 text-right">Paid Amount</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-xs font-medium text-black divide-y bg-white">
            {filteredBills.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-normal">No past billing history matches your query parameters.</td>
              </tr>
            ) : (
              filteredBills.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-violet-700">#{b.invoice_number}</td>
                  <td className="p-3">
                    <p className="font-bold text-slate-800">{b.customer_name}</p>
                    <p className="text-[10px] text-slate-400">{b.customer_mobile || 'No Mobile'}</p>
                  </td>
                  <td className="p-3 text-slate-500">{new Date(b.created_at).toLocaleDateString('en-IN')}</td>
                  <td className="p-3 text-right text-red-500">₹{Number(b.discount_value).toFixed(2)}</td>
                  <td className="p-3 text-right font-black text-slate-900">₹{Number(b.grand_total).toFixed(2)}</td>
                  <td className="p-3 text-center space-x-2">
                    <button onClick={() => handleViewBillDetails(b)} className="p-1.5 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 rounded-lg text-slate-600 transition inline-flex items-center"><Eye className="w-3.5 h-3.5"/></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Detail Preview & Reprint Sheet Block Panel */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 print:static print:bg-white print:p-0">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto print:shadow-none print:p-0 print:max-h-full">
            
            <button onClick={() => setSelectedBill(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 print:hidden">
              <X className="w-5 h-5"/>
            </button>

            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 print:hidden">Invoice Receipt Preview</h3>
            
            {/* Embedded Active Printing Sheet Canvas */}
            <div className="border border-slate-200 p-2 bg-slate-50 rounded-xl mb-4 print:border-none print:p-0 print:bg-white">
              <ThermalReceipt 
                invoiceNumber={selectedBill.invoice_number}
                date={new Date(selectedBill.created_at).toLocaleDateString('en-IN')}
                customerName={selectedBill.customer_name}
                customerMobile={selectedBill.customer_mobile}
                items={billItems.length > 0 ? billItems : [{product_name: "Loading items...", quantity: 1, price: selectedBill.grand_total}]}
                subtotal={selectedBill.subtotal}
                discountValue={selectedBill.discount_value}
                grandTotal={selectedBill.grand_total}
              />
            </div>

            <button onClick={handleInstantReprint} className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl transition tracking-wider flex items-center justify-center gap-2 print:hidden">
              <Printer className="w-4 h-4"/> REPRINT HISTORIC BILL RECEIPT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}