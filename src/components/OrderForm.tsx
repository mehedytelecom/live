import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { Loader2, User, Phone, MapPin, CreditCard, CheckCircle2, ShoppingCart } from 'lucide-react';
import { cn } from '../lib/utils';
import TelegramImage from './TelegramImage';

interface OrderFormProps {
  product: Product;
  onClose: () => void;
}

export default function OrderForm({ product, onClose }: OrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    phone: '',
    address: '',
    payment_method: 'COD' as 'COD' | 'bKash' | 'Nagad',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const docRef = await addDoc(collection(db, 'online_orders'), {
        customer_name: formData.customer_name,
        phone: formData.phone,
        address: formData.address,
        product_id: product.id,
        product_name: product.name,
        payment_method: formData.payment_method,
        order_date: new Date().toISOString(),
        status: 'pending',
      });

      // Store order ID for tracking and notifications
      const existingOrders = JSON.parse(localStorage.getItem('my_orders') || '[]');
      localStorage.setItem('my_orders', JSON.stringify([...existingOrders, docRef.id]));

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="text-green-600" size={48} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">Order Placed Successfully!</h3>
        <p className="text-gray-500">Thank you for your order. We will contact you soon for confirmation.</p>
        <button 
          onClick={onClose}
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-2xl flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
          {product.image_urls?.[0] ? (
            <TelegramImage fileId={product.image_urls[0]} className="w-full h-full object-cover" />
          ) : (
            <ShoppingCart size={24} />
          )}
        </div>
        <div>
          <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Ordering</p>
          <p className="font-bold text-gray-900">{product.name}</p>
          <p className="text-lg font-black text-blue-600">৳{product.selling_price.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
            <User size={16} className="text-blue-500" />
            Your Name
          </label>
          <input
            required
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Full Name"
            value={formData.customer_name}
            onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
            <Phone size={16} className="text-blue-500" />
            Phone Number
          </label>
          <input
            required
            type="tel"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="017XXXXXXXX"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1">
            <MapPin size={16} className="text-blue-500" />
            Delivery Address
          </label>
          <textarea
            required
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
            placeholder="Complete address with area, city"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
            <CreditCard size={16} className="text-blue-500" />
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['COD', 'bKash', 'Nagad'] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: method })}
                className={cn(
                  "py-3 rounded-xl font-bold border-2 transition-all text-sm",
                  formData.payment_method === method 
                    ? "border-blue-600 bg-blue-50 text-blue-600" 
                    : "border-gray-100 text-gray-500 hover:border-gray-200"
                )}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {formData.payment_method !== 'COD' && (
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <p className="text-sm font-bold text-orange-800 mb-1">Payment Instructions:</p>
            <p className="text-sm text-orange-700">
              Please send money to <span className="font-black">017XXXXXXXX</span> via {formData.payment_method}. 
              Enter your phone number as reference.
            </p>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" size={24} /> : 'Confirm Order'}
      </button>
    </form>
  );
}
