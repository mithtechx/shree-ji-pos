"use client";

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiptItem {
  product_name: string;
  quantity: number;
  price: number;
}

interface ThermalReceiptProps {
  invoiceNumber: string | number;
  date: string;
  customerName?: string;
  customerMobile?: string;
  items: ReceiptItem[];
  subtotal: number;
  discountValue: number;
  grandTotal: number;
}

export default function ThermalReceipt({
  invoiceNumber,
  date,
  customerName = "Cash Customer",
  customerMobile = "",
  items,
  subtotal,
  discountValue,
  grandTotal
}: ThermalReceiptProps) {

  // Standard India UPI Intent String pointing to your phone number
  const upiString = `upi://pay?pa=9975379151@pthdfc&pn=SHREE%20JI%20COLLECTION&am=${grandTotal.toFixed(2)}&cu=INR`;

  return (
    <div className="bg-white text-black p-4 font-mono text-sm max-w-[80mm] mx-auto border border-dashed border-gray-400">
      <div className="text-center mb-3">
        <p className="text-xs font-bold">|| श्री रेणुका माता प्रसन्न ||</p>
        <h1 className="text-xl font-bold tracking-wide uppercase my-1">SHREE JI COLLECTION</h1>
        <p className="text-xs">Garment Clothing Shop</p>
        <p className="text-xs">----------------------------------------</p>
      </div>

      <div className="mb-3 space-y-0.5 text-xs">
        <div><strong>Invoice:</strong> #{invoiceNumber}</div>
        <div><strong>Date:</strong> {date}</div>
        <div><strong>Customer:</strong> {customerName}</div>
        {customerMobile && <div><strong>Mobile:</strong> {customerMobile}</div>}
      </div>

      <p className="text-xs text-center">----------------------------------------</p>

      <table className="w-full text-xs my-2 border-collapse">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="text-left py-1">Item</th>
            <th className="text-center py-1">Qty</th>
            <th className="text-right py-1">Price</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-dotted border-gray-200">
              <td className="py-1 max-w-[120px] truncate">{item.product_name}</td>
              <td className="text-center py-1">{item.quantity}</td>
              <td className="text-right py-1">₹{item.price.toFixed(2)}</td>
              <td className="text-right py-1">₹{(item.quantity * item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-xs text-center">----------------------------------------</p>

      <div className="space-y-1 text-xs px-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {discountValue > 0 && (
          <div className="flex justify-between text-red-600 font-semibold">
            <span>Discount:</span>
            <span>-₹{discountValue.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-bold border-t border-dashed border-black pt-1 mt-1">
          <span>GRAND TOTAL:</span>
          <span>₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <p className="text-xs text-center my-3">----------------------------------------</p>

      {/* UPI QR Printing Block */}
      <div className="flex flex-col items-center justify-center my-4">
        <p className="text-[10px] font-bold mb-1 uppercase tracking-tight">Scan to Pay with Any UPI App</p>
        <div className="p-1.5 bg-white border border-black rounded">
          <QRCodeSVG value={upiString} size={130} level="M" />
        </div>
        <p className="text-xs font-bold mt-2">AMOUNT: ₹{grandTotal.toFixed(2)}</p>
      </div>

      <div className="text-center text-[11px] mt-4 space-y-0.5">
        <p className="font-semibold">Thank You for Your Visit!</p>
        <p className="text-[9px] text-gray-500">Software by Shree Ji</p>
      </div>
    </div>
  );
}