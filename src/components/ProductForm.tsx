import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadToTelegram } from '../services/telegramService';
import { Loader2, Upload, X } from 'lucide-react';

interface ProductFormProps {
  onClose: () => void;
}

export default function ProductForm({ onClose }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    ram: '',
    rom: '',
    purchase_price: '',
    selling_price: '',
    quantity: '',
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
    setLoading(true);

    try {
      const purchasePrice = parseFloat(formData.purchase_price);
      const sellingPrice = parseFloat(formData.selling_price);
      const quantity = parseInt(formData.quantity);
      const profitMargin = sellingPrice - purchasePrice;

      // Upload images to Telegram
      const imageUrls = await Promise.all(
        files.map(file => uploadToTelegram(file))
      );

      await addDoc(collection(db, 'products'), {
        name: formData.name,
        brand: formData.brand,
        description: formData.description,
        ram: formData.ram,
        rom: formData.rom,
        purchase_price: purchasePrice,
        selling_price: sellingPrice,
        profit_margin: profitMargin,
        quantity: quantity,
        image_urls: imageUrls,
        created_at: new Date().toISOString(),
      });

      onClose();
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Product Name</label>
          <input
            required
            type="text"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="e.g. Samsung Galaxy S24"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Brand</label>
          <input
            required
            type="text"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="e.g. Infinix, TECNO"
            value={formData.brand}
            onChange={e => setFormData({ ...formData, brand: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            rows={3}
            placeholder="Product details, features, etc."
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">RAM (Variant)</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. 8GB"
              value={formData.ram}
              onChange={e => setFormData({ ...formData, ram: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ROM (Variant)</label>
            <input
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="e.g. 128GB"
              value={formData.rom}
              onChange={e => setFormData({ ...formData, rom: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Purchase Price</label>
            <input
              required
              type="number"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="0.00"
              value={formData.purchase_price}
              onChange={e => setFormData({ ...formData, purchase_price: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Selling Price</label>
            <input
              required
              type="number"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="0.00"
              value={formData.selling_price}
              onChange={e => setFormData({ ...formData, selling_price: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Quantity</label>
            <input
              required
              type="number"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="0"
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Profit Margin</label>
            <div className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 font-bold">
              ৳{(parseFloat(formData.selling_price || '0') - parseFloat(formData.purchase_price || '0')).toLocaleString()}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Product Images</label>
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
          className="flex-1 px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Confirm'}
        </button>
      </div>
    </form>
  );
}
