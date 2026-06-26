"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import ThermalReceipt from '../components/ThermalReceipt';
import { QRCodeSVG } from 'qrcode.react';
import { Trash2, Search, Smartphone, User, Barcode, Layers, Printer } from 'lucide-react';

interface CartItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  barcode: string;
}

export default function StandaloneBilling() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerName, setCustomerName] = useState('Cash Customer');
  const [customerMobile, setCustomerMobile] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [invoiceCounter, setInvoiceCounter] = useState(2001);

  const barcodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (barcodeRef.current) barcodeRef.current.focus();
  }, [cart]);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = barcodeInput.trim();
    if (!cleanCode) return;

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', cleanCode)
      .maybeSingle();

    if (error || !product) {
      alert(`Barcode "${cleanCode}" not found. Adding a quick test garment item!`);
      const mockGarment = {
        id: crypto.randomUUID(),
        product_name: `Garment Item (${cleanCode})`,
        price: 399.00,
        quantity: 1,
        barcode: cleanCode
      };
      setCart(prev => [...prev, mockGarment]);
      setBarcodeInput('');
      return;
    }

    setCart((prevCart) => {
      const idx = prevCart.findIndex(item => item.id === product.id);
      if (idx > -1) {
        const updated = [...prevCart];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prevCart, {
        id: product.id,
        product_name: product.product_name,
        price: Number(product.price),
        quantity: 1,
        barcode: product.barcode
      }];
    });

    setBarcodeInput('');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const calculatedDiscount = discountPercent > 0 ? (subtotal * discountPercent) / 100 : customDiscount;
  const grandTotal = Math.max(0, subtotal - calculatedDiscount);

  const upiString = `upi://pay?pa=9975379151@pthdfc&pn=SHREE%20JI%20COLLECTION&am=${grandTotal.toFixed(2)}&cu=INR`;

const handleCheckoutAndPrint = async () => {
    if (cart.length === 0) return;
    
    setIsPrinting(true);
    setInvoiceCounter(prev => prev + 1);

    try {
      // 1. Save the main bill using the database's exact expected column names
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert([{ 
          customer_name: customerName || "Cash Customer", 
          subtotal: subtotal || grandTotal,
          grand_total: grandTotal, // Explicitly named field to clear the constraint
          total_amount: grandTotal // Keeping this as a fallback parameter
        }])
        .select()
        .single();

      if (billError) throw billError;

      // 2. Map your items to save them into the bill_items history table
      const itemsToInsert = cart.map(item => ({
        bill_id: billData.id,
        product_id: item.id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // 3. Trigger print popup window after successful save
      setTimeout(() => {
        window.print();
        
        // 4. Reset state parameters for the next transaction
        setCart([]);
        setCustomerName('Cash Customer');
        if (typeof setCustomerMobile === 'function') setCustomerMobile('');
        if (typeof setDiscountPercent === 'function') setDiscountPercent(0);
        if (typeof setCustomDiscount === 'function') setCustomDiscount(0);
      }, 400);

    } catch (error) {
      console.error("Database connection failure:", error);
      alert("Failed to save bill history to database.");
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:p-0">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Layers className="text-violet-600 w-5 h-5"/> POS Active Counter
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><User className="w-3 h-3 inline mr-1"/> Customer Name</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-medium text-sm text-black"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><Smartphone className="w-3 h-3 inline mr-1"/> Mobile Number</label>
              <input type="text" placeholder="Optional..." value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-slate-50 font-medium text-sm text-black"/>
            </div>
          </div>

          <form onSubmit={handleBarcodeSubmit}>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><Barcode className="w-3 h-3 inline mr-1"/> Scan Garment Barcode</label>
            <div className="relative">
              <input ref={barcodeRef} type="text" placeholder="Scan or type product code..." value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl focus:border-violet-600 focus:bg-white text-sm font-medium text-black"/>
              <Search className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
            </div>
          </form>

          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 border-b">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y text-black font-medium">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-normal">Basket empty. Ready to scan items.</td>
                  </tr>
                ) : (
                  cart.map(item => (
                    <tr key={item.id}>
                      <td className="p-3">{item.product_name}</td>
                      <td className="p-3 text-center font-bold">{item.quantity}</td>
                      <td className="p-3 text-right">₹{item.price}</td>
                      <td className="p-3 text-right">₹{item.price * item.quantity}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => setCart(prev => prev.filter(i => i.id !== item.id))} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4 inline"/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border flex flex-col justify-between min-h-[400px]">
          <div>
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4">Discounts & Math</h3>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[5, 10, 15, 20].map(p => (
                <button key={p} type="button" onClick={() => { setDiscountPercent(p); setCustomDiscount(0); }} className={`py-2 text-xs font-bold rounded-lg border transition ${discountPercent === p ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700'}`}>{p}%</button>
              ))}
            </div>
            <input type="number" placeholder="Flat discount amount (₹)..." value={customDiscount || ''} onChange={e => { setCustomDiscount(Number(e.target.value)); setDiscountPercent(0); }} className="w-full px-3 py-2 border rounded-lg bg-white text-xs mb-4 text-black"/>

            <div className="space-y-2 text-xs font-bold text-slate-500 border-t pt-4">
              <div className="flex justify-between"><span>Subtotal:</span><span className="text-slate-800">₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-red-500"><span>Discount:</span><span>-₹{calculatedDiscount.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-black text-slate-900 border-t border-dashed pt-2 mt-2"><span>Grand Total:</span><span className="text-violet-700">₹{grandTotal.toFixed(2)}</span></div>
            </div>
          </div>

          {cart.length > 0 && (
            <div className="my-3 flex flex-col items-center justify-center bg-white p-3 rounded-xl border">
              <QRCodeSVG value={upiString} size={100} level="M" />
              <span className="text-[10px] font-mono font-bold mt-1 text-slate-600">Scan QR Code: ₹{grandTotal.toFixed(2)}</span>
            </div>
          )}

          <button onClick={handleCheckoutAndPrint} disabled={cart.length === 0 || isPrinting} className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2">
            <Printer className="w-4 h-4"/> {isPrinting ? "SAVING..." : "PRINT THERMAL BILL"}
          </button>
        </div>
      </div>

      <div className="hidden print:block bg-white">
        <ThermalReceipt invoiceNumber={invoiceCounter} date={new Date().toLocaleDateString('en-IN')} customerName={customerName} customerMobile={customerMobile} items={cart} subtotal={subtotal} discountValue={calculatedDiscount} grandTotal={grandTotal} />
      </div>
    </div>
  );
}