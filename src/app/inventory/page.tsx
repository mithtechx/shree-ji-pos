"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Tags, Search, RefreshCw, Barcode, Trash2 } from 'lucide-react';

interface Product {
  id?: string;
  product_code: string;
  barcode: string;
  product_name: string;
  category: string;
  size: string;
  color: string;
  price: number;
  stock: number;
}

export default function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Mens Wear');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products from Supabase
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (data) setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle Form Submission to save item to Cloud
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !stock || !barcode) {
      alert("Please fill out Name, Barcode, Price, and Stock count!");
      return;
    }

    setIsLoading(true);

    const newProduct: Product = {
      product_name: name,
      product_code: code || barcode,
      barcode: barcode,
      category: category,
      size: size,
      color: color || 'Standard',
      price: Number(price),
      stock: Number(stock)
    };

    const { error } = await supabase.from('products').insert([newProduct]);

    setIsLoading(false);

    if (error) {
      alert("Error saving item: " + error.message);
    } else {
      setName('');
      setCode('');
      setBarcode('');
      setColor('');
      setPrice('');
      setStock('');
      fetchProducts();
      alert("Product safely uploaded to Shree Ji Cloud Inventory!");
    }
  };

  // Direct Quantities Delta Mutator
  const handleUpdateStock = async (productId: string, currentStock: number, adjustment: number) => {
    const newStockLevel = Math.max(0, currentStock + adjustment);
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStockLevel })
        .eq('id', productId);

      if (error) throw error;
      
      // Instantly updates UI array state locally
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStockLevel } : p));
    } catch (error: any) {
      alert("Could not update product stock level: " + error.message);
    }
  };

  // Permanent Delete Removal Call
  const handleDeleteProduct = async (productId: string, productName: string) => {
    const confirmDelete = confirm(`Are you absolutely sure you want to permanently delete "${productName}" from inventory?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error: any) {
      alert("Failed to delete product. Note: Items attached to old invoices cannot be deleted.");
    }
  };

  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Tags className="text-blue-600 w-5 h-5"/> Master Garment Inventory ({products.length} Items)
        </h2>
        <button onClick={fetchProducts} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-xl transition text-slate-700">
          <RefreshCw className="w-4 h-4"/>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-blue-600"/> Add Clothing Item
          </h3>
          
          <form onSubmit={handleAddProduct} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Item Name *</label>
              <input type="text" placeholder="e.g., Raymond Cotton Formal Shirt" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-sm font-medium text-black focus:outline-none focus:bg-white"/>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Barcode className="w-3 h-3"/> Barcode *</label>
                <input type="text" placeholder="Scan tag..." value={barcode} onChange={e => setBarcode(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs font-bold text-black focus:outline-none focus:bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Product Code</label>
                <input type="text" placeholder="e.g., SH-01" value={code} onChange={e => setCode(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs font-medium text-black focus:outline-none focus:bg-white"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs font-medium text-black focus:outline-none focus:bg-white">
                  <option>Mens Wear</option>
                  <option>Kids Wear</option>
                  <option>Ladies Wear</option>
                  <option>Sarees & Ethnic</option>
                  <option>Other Accessories</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Size</label>
                <select value={size} onChange={e => setSize(e.target.value)} className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-xs font-medium text-black focus:outline-none focus:bg-white">
                  <option>S</option>
                  <option>M</option>
                  <option>L</option>
                  <option>XL</option>
                  <option>XXL</option>
                  <option>32</option>
                  <option>34</option>
                  <option>36</option>
                  <option>Free Size</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Color</label>
                <input type="text" placeholder="Blue" value={color} onChange={e => setColor(e.target.value)} className="w-full px-2 py-2 border rounded-xl bg-slate-50 text-xs font-medium text-black focus:outline-none focus:bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price *</label>
                <input type="number" placeholder="₹ Rate" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-2 py-2 border rounded-xl bg-slate-50 text-xs font-bold text-black focus:outline-none focus:bg-white"/>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Qty *</label>
                <input type="number" placeholder="Pcs" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-2 py-2 border rounded-xl bg-slate-50 text-xs font-bold text-black focus:outline-none focus:bg-white"/>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl shadow-sm transition tracking-wider mt-2">
              {isLoading ? "SAVING TO CLOUD..." : "SAVE PRODUCT INVENTORY"}
            </button>
          </form>
        </div>

        {/* Right Data Grid with High Contrast Structural Layout Row Matrix */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="space-y-4">
            <div className="relative">
              <input type="text" placeholder="Search by item description name or flash barcode query..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-xl bg-slate-50 text-xs font-medium text-black focus:outline-none focus:bg-white"/>
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="border rounded-xl overflow-hidden max-h-[480px] overflow-y-auto">
              {/* Header Label Bar */}
              <div className="bg-slate-50 border-b p-3 text-[10px] font-bold uppercase text-slate-500 grid grid-cols-12 gap-2 sticky top-0 z-10">
                <div className="col-span-4">Product Profile</div>
                <div className="col-span-2 text-center">Size/Color</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-center">Stock</div>
                <div className="col-span-2 text-center">Actions</div>
              </div>

              {/* Data Items List */}
              <div className="divide-y divide-slate-100 bg-white text-xs text-black font-medium">
                {filteredProducts.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 font-normal">No registered products matched this search phrase.</div>
                ) : (
                  filteredProducts.map(p => (
                    <div key={p.id} className="p-3 grid grid-cols-12 gap-2 items-center hover:bg-slate-50/80">
                      <div className="col-span-4">
                        <p className="font-bold text-slate-800 truncate">{p.product_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">Barcode: {p.barcode}</p>
                      </div>
                      <div className="col-span-2 text-center text-slate-600 truncate">{p.size} / {p.color}</div>
                      <div className="col-span-2 text-right font-bold text-slate-900">₹{Number(p.price).toFixed(2)}</div>
                      <div className="col-span-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-block ${p.stock > 10 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                          {p.stock} Pcs
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <button 
                          type="button"
                          onClick={() => p.id && handleUpdateStock(p.id, Number(p.stock || 0), 10)}
                          className="bg-emerald-600 text-white hover:bg-emerald-700 w-7 h-6 rounded flex items-center justify-center text-[10px] font-black shadow-sm transition"
                        >
                          +10
                        </button>
                        <button 
                          type="button"
                          onClick={() => p.id && handleUpdateStock(p.id, Number(p.stock || 0), -1)}
                          disabled={(p.stock || 0) <= 0}
                          className="bg-amber-500 text-white hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 w-7 h-6 rounded flex items-center justify-center text-[10px] font-black shadow-sm transition"
                        >
                          -1
                        </button>
                        <button 
                          type="button"
                          onClick={() => p.id && handleDeleteProduct(p.id, p.product_name)}
                          className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white p-1 rounded transition border border-rose-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}