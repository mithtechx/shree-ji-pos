"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Tags, Search, RefreshCw, Barcode, Trash2, Layers, ShoppingBag } from 'lucide-react';

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
  
  // Form State Management
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('Mens Wear');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Focus Element references for streamlined data loops
  const nameRef = useRef<HTMLInputElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);

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

  const handleKeyDown = (e: React.KeyboardEvent, nextFieldRef: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Shift') {
      e.preventDefault();
      if (nextFieldRef && nextFieldRef.current) {
        nextFieldRef.current.focus();
        nextFieldRef.current.select();
      }
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !stock || !barcode) {
      alert("Please fill out Name, Barcode, Price, and Stock count!");
      return;
    }

    setIsLoading(true);

    const newProduct: Product = {
      product_name: name,
      product_code: barcode,
      barcode: barcode,
      category: category,
      size: size,
      color: color || 'Standard',
      price: Number(price),
      stock: Number(stock)
    };

    const { error } = await supabase.from('products').insert([newProduct]);

    if (error) {
      alert("Error saving item: " + error.message);
    } else {
      setName('');
      setBarcode('');
      setColor('');
      setPrice('');
      setStock('');
      fetchProducts();
      if (nameRef.current) nameRef.current.focus();
    }
    setIsLoading(false);
  };

  const handleUpdateStock = async (productId: string, currentStock: number, adjustment: number) => {
    const newStockLevel = Math.max(0, currentStock + adjustment);
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStockLevel })
        .eq('id', productId);

      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStockLevel } : p));
    } catch (error: any) {
      alert("Could not update product stock level: " + error.message);
    }
  };

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
    <div className="space-y-6 max-w-[1600px] mx-auto px-4 py-2 font-sans antialiased text-slate-900 selection:bg-violet-100">
      
      {/* HEADER ROW BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5">
            <Layers className="text-violet-600 w-6 h-6 stroke-[2.5]" /> Master Garment Inventory
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Cloud Transaction Sync Status Active • <span className="text-violet-600 font-bold">{products.length} catalog profiles</span> registered
          </p>
        </div>
        <button 
          onClick={fetchProducts} 
          className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all duration-200 shadow-sm active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sync Dataset
        </button>
      </div>

      {/* TOP SECTION: COMPACT HORIZONTAL INTAKE FORM */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md shadow-slate-100/50 overflow-hidden">
        <div className="bg-slate-50/70 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
            <Plus className="w-4 h-4 text-violet-600 stroke-[3]" /> Fast Registration Terminal
          </div>
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            Navigation Mode: <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono font-bold shadow-sm text-slate-600 text-[10px]">Shift Jump</kbd>
          </div>
        </div>
        
        <form onSubmit={handleAddProduct} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            
            {/* Item Name Profile */}
            <div className="md:col-span-4">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1">Item Description Name *</label>
              <input ref={nameRef} type="text" placeholder="e.g., Raymond Cotton Formal Shirt" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => handleKeyDown(e, barcodeRef)} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-50 transition-all duration-200" autoFocus/>
              <span className="text-[10px] text-slate-400 block mt-1 font-medium">Press <kbd className="font-sans font-bold bg-slate-100 px-1 rounded text-slate-600">Shift</kbd> to jump forward</span>
            </div>

            {/* SKU Barcode Reference */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1"><Barcode className="w-3 h-3 text-slate-400" /> Barcode *</label>
              <input ref={barcodeRef} type="text" placeholder="Scan tag string..." value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={e => handleKeyDown(e, priceRef)} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs font-bold text-slate-800 font-mono focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-50 transition-all duration-200"/>
              <span className="text-[10px] text-slate-400 block mt-1 font-medium">Press <kbd className="font-sans font-bold bg-slate-100 px-1 rounded text-slate-600">Shift</kbd> to skip</span>
            </div>

            {/* Department Group Category */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1">Category</label>
              <div className="relative">
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-50 transition-all duration-200">
                  <option>Mens Wear</option>
                  <option>Kids Wear</option>
                  <option>Ladies Wear</option>
                  <option>Sarees & Ethnic</option>
                  <option>Other Accessories</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Size Class Allocation */}
            <div className="md:col-span-1.5">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1">Size</label>
              <div className="relative">
                <select value={size} onChange={e => setSize(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-50 transition-all duration-200">
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
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Value Price Rate */}
            <div className="md:col-span-1.5">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1">Price Rate *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input ref={priceRef} type="number" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} onKeyDown={e => handleKeyDown(e, stockRef)} className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs font-bold text-slate-800 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-50 transition-all duration-200"/>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1 font-medium">Press <kbd className="font-sans font-bold bg-slate-100 px-1 rounded text-slate-600">Shift</kbd></span>
            </div>

            {/* Inventory Units Stock */}
            <div className="md:col-span-1">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wide mb-1">Stock *</label>
              <input ref={stockRef} type="number" placeholder="Pcs" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 text-xs font-bold text-slate-800 focus:outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-50 transition-all duration-200"/>
              <span className="text-[10px] text-slate-400 block mt-1 font-medium">Hit <kbd className="font-sans font-bold bg-slate-100 px-1 rounded text-slate-600">Enter</kbd></span>
            </div>

            {/* HIDDEN MEMORY MATRIX CAPTURE VALUE FOR INTEGRITY */}
            <div className="hidden">
              <input type="text" value={color} onChange={e => setColor(e.target.value)}/>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-dashed border-slate-100">
            <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white text-xs font-extrabold rounded-xl shadow-md shadow-violet-600/10 hover:shadow-violet-600/20 transition-all duration-200 tracking-wider flex items-center gap-2 uppercase">
              {isLoading ? "Writing to Cloud Matrices..." : "Commit Asset Entry"}
            </button>
          </div>
        </form>
      </div>

      {/* BOTTOM SECTION: MAIN ANALYTICS AND TABULAR DATA WORKSPACE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between">
        
        {/* Workspace Toolbar Filters */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <input type="text" placeholder="Search by item description name or flash barcode query..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-500 transition-all duration-200 shadow-inner"/>
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
            Showing <span className="text-slate-700 font-bold">{filteredProducts.length}</span> of {products.length} entries
          </div>
        </div>

        {/* Dense Responsive Matrix Grid Wrapper */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Labels Bar */}
            <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 grid grid-cols-12 gap-4 sticky top-0 z-10">
              <div className="col-span-5 flex items-center gap-1"><ShoppingBag className="w-3 h-3 text-slate-400" /> Garment Specifications</div>
              <div className="col-span-2 text-center">Category Details</div>
              <div className="col-span-1 text-center">Size Tag</div>
              <div className="col-span-2 text-right">Price Value</div>
              <div className="col-span-1 text-center">In Stock</div>
              <div className="col-span-1 text-center">Row Actions</div>
            </div>

            {/* Dynamic Content Mapping Rows */}
            <div className="divide-y divide-slate-100 bg-white text-xs text-slate-700 font-semibold">
              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-normal space-y-2">
                  <p className="text-sm font-bold text-slate-500">No matching garment rows detected</p>
                  <p className="text-xs text-slate-400">Refine your search term or initialize a fast registration sequence above.</p>
                </div>
              ) : (
                filteredProducts.map(p => (
                  <div key={p.id} className="px-5 py-3.5 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/50 transition-colors duration-150">
                    
                    {/* Item Profile Context */}
                    <div className="col-span-5 space-y-0.5">
                      <p className="font-bold text-slate-900 text-sm truncate tracking-tight">{p.product_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono font-bold tracking-wide">SKU: {p.barcode}</p>
                    </div>

                    {/* Department */}
                    <div className="col-span-2 text-center">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-200/40">
                        {p.category}
                      </span>
                    </div>

                    {/* Dimensions Size Label */}
                    <div className="col-span-1 text-center font-black text-slate-800 font-mono text-xs">
                      {p.size}
                    </div>

                    {/* Price Rates Currency */}
                    <div className="col-span-2 text-right font-black text-slate-900 font-mono text-sm tracking-tight">
                      ₹{Number(p.price).toFixed(2)}
                    </div>

                    {/* Inventory Level Toggles */}
                    <div className="col-span-1 text-center">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black inline-block tracking-wide ${p.stock > 10 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-rose-50 text-rose-700 border border-rose-200/50'}`}>
                        {p.stock} Pcs
                      </span>
                    </div>

                    {/* Active Controls Row Modifiers */}
                    <div className="col-span-1 flex items-center justify-end gap-1.5">
                      <button 
                        type="button"
                        title="Increment Batch (+10 Units)"
                        onClick={() => p.id && handleUpdateStock(p.id, Number(p.stock || 0), 10)}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white w-7 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm transition-all duration-150 active:scale-95"
                      >
                        +10
                      </button>
                      <button 
                        type="button"
                        title="Decrement Single (-1 Unit)"
                        onClick={() => p.id && handleUpdateStock(p.id, Number(p.stock || 0), -1)}
                        disabled={(p.stock || 0) <= 0}
                        className="bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-500 hover:text-white disabled:bg-slate-50 disabled:border-slate-100 disabled:text-slate-300 w-7 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm transition-all duration-150 active:scale-95"
                      >
                        -1
                      </button>
                      <button 
                        type="button"
                        title="Purge Record"
                        onClick={() => p.id && handleDeleteProduct(p.id, p.product_name)}
                        className="bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white p-1.5 rounded-lg transition-all duration-150 shadow-sm active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.2]" />
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
  );
}