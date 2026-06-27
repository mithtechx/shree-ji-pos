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
      // Clear forms on success
      setName('');
      setCode('');
      setBarcode('');
      setColor('');
      setPrice('');
      setStock('');
      fetchProducts(); // Refresh list instantly
      alert("Product safely uploaded to Shree Ji Cloud Inventory!");
    }
  };

  // ACTION 1: Update Product Stock Level Directly
  const handleUpdateStock = async (productId: string, currentStock: number, adjustment: number) => {
    const newStockLevel = Math.max(0, currentStock + adjustment);
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStockLevel })
        .eq('id', productId);

      if (error) throw error;
      
      // Update local state array to refresh the UI immediately
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStockLevel } : p));
    } catch (error: any) {
      console.error("Failed to alter stock quantities:", error);
      alert("Could not update product stock level: " + error.message);
    }
  };

  // ACTION 2: Permanently Delete Product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    const confirmDelete = confirm(`Are you absolutely sure you want to permanently delete "${productName}" from inventory?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      // Filter deleted product out of view state array instantly
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error: any) {
      console.error("Item removal sequence caught an error:", error);
      alert("Failed to delete product. Note: Items attached to old bill histories cannot be deleted.");
    }
  };

  // Filter list based on search query
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
        {/* Left Form: Add New Items */}
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

        {/* Right Table: Search and View existing item stock profiles */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="relative">
              <input type="text" placeholder="Search by item description name or flash barcode query..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-xl bg-slate-50 text-xs font-medium text-black focus:outline-none focus:bg-white"/>
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

            <div className="border rounded-xl overflow-hidden max-h-[440px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Product Profile</th>
                    <th className="p-3 text-center">Size/Color</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-center">Available Stock</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y text-black font-medium bg-white">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-normal">No registered products matched this search phrase.</td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="p-3">
                          <p className="font-bold text-slate-800">{p.product_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Barcode: {p.barcode}</p>
                        </td>
                        <td className="p-3 text-center text-slate-600">{p.size} / {p.color}</td>
                        <td className="p-3 text-right font-bold text-slate-900">₹{Number(p.price).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold block w-fit mx-auto ${p.stock > 10 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            {p.stock} Pcs
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                            {/* Add 10 Stock */}
                            <button 
                              onClick={() => p.id && handleUpdateStock(p.id, Number(p.stock || 0), 10)}
                              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-2 py-1 rounded-md text-[10px] font-bold transition border border-emerald-200"
                            >
                              +10
                            </button>
                            
                            {/* Subtract 1 Stock */}
                            <button 
                              onClick={() => p.id && handleUpdateStock(p.id, Number(p.stock || 0), -1)}
                              disabled={(p.stock || 0) <= 0}
                              className="bg-amber-50 text-amber-600 hover:bg-amber-100 disabled:bg-slate-100 disabled:text-slate-400 px-2 py-1 rounded-md text-[10px] font-bold transition border border-amber-200"
                            >
                              -1
                            </button>

                            {/* Delete Product */}
                            <button 
                              onClick={() => p.id && handleDeleteProduct(p.id, p.product_name)}
                              className="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white p-1 rounded-md transition border border-rose-200"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}