import React, { useState } from 'react';
import { addDoc, collection, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { uploadToTelegram } from '../services/telegramService';
import { Loader2, Upload, X, User, Phone, MapPin, CreditCard, ShieldCheck } from 'lucide-react';

interface SaleFormProps {
  products: Product[];
  onClose: () => void;
}

export default function SaleForm({ products, onClose }: SaleFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    nid: '',
    address: '',
    guarantor: '',
    product_id: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file as Blob));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      alert('Minimum 1 image is required for sale entry.');
      return;
    }
    setLoading(true);

    try {
      const selectedProduct = products.find(p => p.id === formData.product_id);
      if (!selectedProduct) throw new Error('Product not found');
      if (selectedProduct.quantity <= 0) {
        alert('Product out of stock!');
        setLoading(false);
        return;
      }

      // Upload images to Telegram
      const imageFileIds = await Promise.all(
        files.map(file => uploadToTelegram(file))
      );

      // Record Sale
      await addDoc(collection(db, 'offline_sales'), {
        customer_name: formData.customer_name,
        phone: formData.phone,
        nid: formData.nid,
        address: formData.address,
        guarantor: formData.guarantor,
        product_id: formData.product_id,
        product_name: selectedProduct.name,
        image_file_ids: imageFileIds,
        sale_date: new Date().toISOString(),
        profit: selectedProduct.profit_margin,
      });

      // Decrease Stock
      const productRef = doc(db, 'products', formData.product_id);
      await updateDoc(productRef, {
        quantity: increment(-1)
      });

      onClose();
    } catch (error) {
      console.error('Error recording sale:', error);
      alert('Failed to record sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
              <User size={16} className="text-blue-500" />
              Customer Name
            </label>
            <input
              required
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Full Name"
              value={formData.customer_name}
              onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
              <Phone size={16} className="text-blue-500" />
              Phone (bKash)
            </label>
            <input
              required
              type="tel"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="017XXXXXXXX"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
              <CreditCard size={16} className="text-blue-500" />
              NID Number
            </label>
            <input
              required
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="NID Number"
              value={formData.nid}
              onChange={e => setFormData({ ...formData, nid: e.target.value })}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
              <ShieldCheck size={16} className="text-blue-500" />
              Guarantor Number
            </label>
            <input
              required
              type="tel"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Guarantor Phone"
              value={formData.guarantor}
              onChange={e => setFormData({ ...formData, guarantor: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
            <MapPin size={16} className="text-blue-500" />
            Full Address
          </label>
          <textarea
            required
            rows={2}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            placeholder="Complete delivery address"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Select Product</label>
          <select
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={formData.product_id}
            onChange={e => setFormData({ ...formData, product_id: e.target.value })}
          >
            <option value="">Choose a product...</option>
            {products.map(p => (
              <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                {p.name} ({p.quantity} in stock) - ৳{p.selling_price}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Sale Evidence (Images)</label>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {previews.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                <img src={url} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
              <Upload className="text-gray-400 mb-1" size={24} />
              <span className="text-[10px] font-bold text-gray-400 uppercase">Upload</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
          <p className="text-xs text-gray-400">* Minimum 1 image required</p>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-6 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Complete Sale'}
        </button>
      </div>
    </form>
  );
}
