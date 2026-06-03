import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy, 
  increment, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Product, OfflineSale, OnlineOrder, Category, SliderItem } from '../types';
import { 
  Plus, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Bell, 
  Search, 
  Trash2, 
  Edit, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  CreditCard, 
  ShieldCheck, 
  LayoutDashboard, 
  TrendingDown, 
  X, 
  Loader2, 
  Upload, 
  XCircle, 
  ArrowLeft, 
  Check,
  Image as ImageIcon,
  Sliders,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { uploadToTelegram } from '../services/telegramService';
import TelegramImage from './TelegramImage';
import Modal from './Modal';
import { format, startOfDay, startOfMonth } from 'date-fns';
import { cn } from '../lib/utils';
import { NotificationService } from '../services/NotificationService';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  // DB States
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<OfflineSale[]>([]);
  const [orders, setOrders] = useState<OnlineOrder[]>([]);

  // Page active panel tab state within Admin workspace
  // 'overview' | 'inventory' | 'orders' | 'offline-sales' | 'categories' | 'sliders'
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'orders' | 'offline-sales' | 'categories' | 'sliders'>('overview');

  // Dynamic lists states
  const [categories, setCategories] = useState<Category[]>([]);
  const [sliders, setSliders] = useState<SliderItem[]>([]);

  // Interactive controls
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  
  // Custom states for category and slider editor modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    image: '',
  });
  const [categoryFile, setCategoryFile] = useState<File | null>(null);
  const [categoryPreview, setCategoryPreview] = useState<string>('');

  const [isSliderModalOpen, setIsSliderModalOpen] = useState(false);
  const [selectedSliderForEdit, setSelectedSliderForEdit] = useState<SliderItem | null>(null);
  const [sliderForm, setSliderForm] = useState({
    title: '',
    subtitle: '',
    discount: '',
    color: 'from-cyan-400 via-teal-400 to-blue-500',
    features: '',
    imageUrl: '',
  });
  const [sliderFile, setSliderFile] = useState<File | null>(null);
  const [sliderPreview, setSliderPreview] = useState<string>('');

  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OnlineOrder | null>(null);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<OfflineSale | null>(null);

  // Form management
  const [formLoading, setFormLoading] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    description: '',
    ram: '',
    rom: '',
    purchase_price: '',
    selling_price: '',
    discount_price: '',
    category: '',
    quantity: '',
  });
  const [productUploadFiles, setProductUploadFiles] = useState<File[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);

  const [saleForm, setSaleForm] = useState({
    customer_name: '',
    phone: '',
    nid: '',
    address: '',
    guarantor: '',
    product_id: '',
  });
  const [saleUploadFiles, setSaleUploadFiles] = useState<File[]>([]);
  const [salePreviews, setSalePreviews] = useState<string[]>([]);

  // Initial load tracking for incoming order notifications
  const isInitialLoad = useRef(true);

  // Load Real-time DB Listeners
  useEffect(() => {
    NotificationService.requestPermission();

    const unsubscribeProducts = onSnapshot(query(collection(db, 'products')), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      if (snapshot.empty) {
        const staticCategories = [
          { name: 'Mobile Phone', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=120&q=80' },
          { name: 'Tablet & Accessories', image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=120&q=80' },
          { name: 'Laptop', image: 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=120&q=80' },
          { name: 'Wireless Headphone', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=120&q=80' },
          { name: 'Smart Watch', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80' },
          { name: 'Home Appliances', image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=120&q=80' },
          { name: 'Wired Headphone', image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=120&q=80' },
          { name: 'Airpods', image: 'https://images.unsplash.com/photo-1588449668338-d1516882247e?auto=format&fit=crop&w=120&q=80' },
          { name: 'Headphone', image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=120&q=80' },
          { name: 'Speaker', image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=120&q=80' }
        ];
        staticCategories.forEach(cat => {
          addDoc(collection(db, 'categories'), cat).catch(console.error);
        });
      } else {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      }
    });

    const unsubscribeSliders = onSnapshot(collection(db, 'sliders'), (snapshot) => {
      if (snapshot.empty) {
        const staticSliders = [
          {
            title: "GREAT DEALS",
            subtitle: "ON AIR CONDITIONER",
            discount: "28% Discount",
            color: "from-cyan-400 via-teal-400 to-blue-500",
            features: ["36 MONTH EMI", "FREE DELIVERY", "INSTALLATION FACILITY", "2 Year Service Warranty"],
            imageUrl: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=350&q=80",
            order: 1
          },
          {
            title: "IPHONE 15 PRO DEALS",
            subtitle: "TITANIUM POWER EXPERIMENT",
            discount: "Up to 15% Off",
            color: "from-slate-900 via-indigo-900 to-indigo-950",
            features: ["12 MONTH EMI", "OFFICIAL STORE WARRANTY", "EXTRA CLUB BONUS"],
            imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=350&q=80",
            order: 2
          },
          {
            title: "PREMIUM SOUND EXPERIENCE",
            subtitle: "AIRPODS & OVER EAR HEADSETS",
            discount: "20% Discount",
            color: "from-purple-800 via-pink-700 to-rose-600",
            features: ["7 DAYS RETURN POLICY", "ORIGINAL SEALS", "FREE PREMIUM CASE"],
            imageUrl: "https://images.unsplash.com/photo-1588449668338-d1516882247e?auto=format&fit=crop&w=350&q=80",
            order: 3
          }
        ];
        staticSliders.forEach(slider => {
          addDoc(collection(db, 'sliders'), slider).catch(console.error);
        });
      } else {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SliderItem));
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setSliders(list);
      }
    });

    const unsubscribeSales = onSnapshot(query(collection(db, 'offline_sales'), orderBy('sale_date', 'desc')), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OfflineSale)));
    });

    const unsubscribeOrders = onSnapshot(query(collection(db, 'online_orders'), orderBy('order_date', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OnlineOrder)));

      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }

      // Check for freshly added pending orders to notify the admin
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const order = change.doc.data() as OnlineOrder;
          if (order.status === 'pending') {
            NotificationService.notifyAdmin({
              customer_name: order.customer_name,
              product_name: order.product_name
            });
          }
        }
      });
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeSliders();
      unsubscribeSales();
      unsubscribeOrders();
    };
  }, []);

  // Dynamic Auto-Categorizer: runs in background to match unassigned or synonym products to standard category
  useEffect(() => {
    if (products.length === 0 || categories.length === 0) return;

    const isMobileDevice = (name: string) => {
      const n = name.toLowerCase();
      return n.includes('phone') || n.includes('s24') || n.includes('s23') || n.includes('iphone') || n.includes('galaxy') || n.includes('pixel') || n.includes('infinix') || n.includes('tecno') || n.includes('redmi') || n.includes('realme') || n.includes('oneplus') || n.includes('oppo') || n.includes('vivo') || n.includes('nokia') || n.includes('mobile');
    };

    products.forEach(async (p) => {
      const currentCat = (p.category || '').trim();
      let targetCat = '';

      if (!currentCat || currentCat.toLowerCase() === 'mobile' || currentCat.toLowerCase() === 'smartphone') {
        if (isMobileDevice(p.name)) {
          const matched = categories.find(c => c.name.toLowerCase().includes('mobile') || c.name.toLowerCase().includes('phone'));
          targetCat = matched ? matched.name : 'Mobile Phone';
        }
      }

      if (targetCat && currentCat !== targetCat) {
        console.log(`Auto-assigning unclassified product ${p.name} -> ${targetCat}`);
        try {
          const productRef = doc(db, 'products', p.id);
          await updateDoc(productRef, { category: targetCat });
        } catch (err) {
          console.error("Auto categorizer error:", err);
        }
      }
    });
  }, [products, categories]);

  // Compute stats metrics
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(new Date());

  const todaySales = sales.filter(s => new Date(s.sale_date) >= today);
  const monthSales = sales.filter(s => new Date(s.sale_date) >= monthStart);

  const todayProfit = todaySales.reduce((sum, s) => sum + s.profit, 0);
  const monthProfit = monthSales.reduce((sum, s) => sum + s.profit, 0);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const finishedOrders = orders.filter(o => o.status === 'completed');

  const lowStockCount = products.filter(p => p.quantity <= 5).length;

  // Handles adding file uploads preview
  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files) as File[];
      setProductUploadFiles(prev => [...prev, ...selected]);
      const previews = selected.map(f => URL.createObjectURL(f as Blob));
      setProductPreviews(prev => [...prev, ...previews]);
    }
  };

  const removeProductFile = (idx: number) => {
    setProductUploadFiles(prev => prev.filter((_, i) => i !== idx));
    setProductPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files) as File[];
      setSaleUploadFiles(prev => [...prev, ...selected]);
      const previews = selected.map(f => URL.createObjectURL(f as Blob));
      setSalePreviews(prev => [...prev, ...previews]);
    }
  };

  const removeSaleFile = (idx: number) => {
    setSaleUploadFiles(prev => prev.filter((_, i) => i !== idx));
    setSalePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // Create Product Submit Handler
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const buyPrice = parseFloat(productForm.purchase_price);
      const sellPrice = parseFloat(productForm.selling_price);
      const discPrice = productForm.discount_price ? parseFloat(productForm.discount_price) : 0;
      const activeSellPrice = (discPrice > 0) ? discPrice : sellPrice;
      const qty = parseInt(productForm.quantity);
      const profit = activeSellPrice - buyPrice;

      // Upload files to telegram API
      const uploadedFileIds = await Promise.all(
        productUploadFiles.map(file => uploadToTelegram(file))
      );

      await addDoc(collection(db, 'products'), {
        name: productForm.name,
        brand: productForm.brand,
        description: productForm.description,
        ram: productForm.ram,
        rom: productForm.rom,
        purchase_price: buyPrice,
        selling_price: sellPrice,
        discount_price: discPrice > 0 ? discPrice : 0,
        category: productForm.category || '',
        profit_margin: profit,
        quantity: qty,
        image_urls: uploadedFileIds,
        created_at: new Date().toISOString(),
      });

      // Clear Form state
      setProductForm({
        name: '',
        brand: '',
        description: '',
        ram: '',
        rom: '',
        purchase_price: '',
        selling_price: '',
        discount_price: '',
        category: '',
        quantity: '',
      });
      setProductUploadFiles([]);
      setProductPreviews([]);
      setIsProductModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error creating product database record.');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Product quantities and update properties inline
  const openEditProduct = (prod: Product) => {
    setSelectedProductForEdit(prod);
    setProductForm({
      name: prod.name,
      brand: prod.brand,
      description: prod.description || '',
      ram: prod.ram || '',
      rom: prod.rom || '',
      purchase_price: prod.purchase_price.toString(),
      selling_price: prod.selling_price.toString(),
      discount_price: prod.discount_price?.toString() || '',
      category: prod.category || '',
      quantity: prod.quantity.toString(),
    });
    setProductPreviews(prod.image_urls || []);
    setProductUploadFiles([]);
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForEdit) return;
    setFormLoading(true);

    try {
      const buyPrice = parseFloat(productForm.purchase_price);
      const sellPrice = parseFloat(productForm.selling_price);
      const discPrice = productForm.discount_price ? parseFloat(productForm.discount_price) : 0;
      const activeSellPrice = (discPrice > 0) ? discPrice : sellPrice;
      const qty = parseInt(productForm.quantity);
      const profit = activeSellPrice - buyPrice;

      // Keep existing plus fresh uploaded if any
      let finalImages = [...(selectedProductForEdit.image_urls || [])];
      if (productUploadFiles.length > 0) {
        const freshUploaded = await Promise.all(
          productUploadFiles.map(file => uploadToTelegram(file))
        );
        finalImages = [...finalImages, ...freshUploaded];
      }

      const productRef = doc(db, 'products', selectedProductForEdit.id);
      await updateDoc(productRef, {
        name: productForm.name,
        brand: productForm.brand,
        description: productForm.description,
        ram: productForm.ram,
        rom: productForm.rom,
        purchase_price: buyPrice,
        selling_price: sellPrice,
        discount_price: discPrice > 0 ? discPrice : 0,
        category: productForm.category || '',
        profit_margin: profit,
        quantity: qty,
        image_urls: finalImages,
      });

      setSelectedProductForEdit(null);
    } catch (err) {
      console.error(err);
      alert('Error updating product info.');
    } finally {
      setFormLoading(false);
    }
  };

  // Adjust Stock Levels of products inline quickly
  const adjustProductStock = async (prodId: string, diff: number) => {
    try {
      const productRef = doc(db, 'products', prodId);
      await updateDoc(productRef, {
        quantity: increment(diff)
      });
    } catch (err) {
      console.error('Error updating stock level', err);
    }
  };

  // Delete product definitely
  const deleteProductRecord = async (prodId: string) => {
    if (window.confirm('Delete this product permanently from the database?')) {
      try {
        await deleteDoc(doc(db, 'products', prodId));
      } catch (err) {
        console.error('Error deleting document:', err);
      }
    }
  };

  // Offline Sales Manual ledger submission
  const handleCreateSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleUploadFiles.length === 0) {
      alert('Minimum 1 image upload is required for verification.');
      return;
    }
    setFormLoading(true);

    try {
      const targetProd = products.find(p => p.id === saleForm.product_id);
      if (!targetProd) throw new Error('Selected item invalid');
      if (targetProd.quantity <= 0) {
        alert('This product is currently out of stock!');
        setFormLoading(false);
        return;
      }

      // Upload verification NID/Evidence docs to telegram
      const fileIds = await Promise.all(
        saleUploadFiles.map(file => uploadToTelegram(file))
      );

      // Record transaction
      await addDoc(collection(db, 'offline_sales'), {
        customer_name: saleForm.customer_name,
        phone: saleForm.phone,
        nid: saleForm.nid,
        address: saleForm.address,
        guarantor: saleForm.guarantor,
        product_id: saleForm.product_id,
        product_name: targetProd.name,
        image_file_ids: fileIds,
        sale_date: new Date().toISOString(),
        profit: targetProd.profit_margin,
      });

      // Inline decrease stock count
      await updateDoc(doc(db, 'products', saleForm.product_id), {
        quantity: increment(-1)
      });

      // Clear Form states
      setSaleForm({
        customer_name: '',
        phone: '',
        nid: '',
        address: '',
        guarantor: '',
        product_id: '',
      });
      setSaleUploadFiles([]);
      setSalePreviews([]);
      setIsSaleModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error recording offline transaction details.');
    } finally {
      setFormLoading(false);
    }
  };

  // Online Orders operations management
  const markOnlineOrderCompleted = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'online_orders', orderId), {
        status: 'completed'
      });
      if (selectedOrderDetail?.id === orderId) {
        setSelectedOrderDetail(prev => prev ? { ...prev, status: 'completed' } : null);
      }
    } catch (err) {
      console.error('Error completing order: ', err);
    }
  };

  const deleteOnlineOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await deleteDoc(doc(db, 'online_orders', orderId));
        setSelectedOrderDetail(null);
      } catch (err) {
        console.error('Error deleting order: ', err);
      }
    }
  };

  // Dynamic filter lists
  const getFilteredProducts = () => {
    if (!searchTerm.trim()) return products;
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredOrders = () => {
    if (!searchTerm.trim()) return orders;
    return orders.filter(o => 
      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone.includes(searchTerm) ||
      o.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getFilteredSales = () => {
    if (!searchTerm.trim()) return sales;
    return sales.filter(s => 
      s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm) ||
      s.product_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      let imageUrl = categoryForm.image;
      if (categoryFile) {
        imageUrl = await uploadToTelegram(categoryFile);
      }

      if (selectedCategoryForEdit) {
        const catRef = doc(db, 'categories', selectedCategoryForEdit.id);
        await updateDoc(catRef, {
          name: categoryForm.name,
          image: imageUrl,
        });
      } else {
        await addDoc(collection(db, 'categories'), {
          name: categoryForm.name,
          image: imageUrl || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=120&q=80',
        });
      }

      setIsCategoryModalOpen(false);
      setSelectedCategoryForEdit(null);
    } catch (err) {
      console.error(err);
      alert('Error updating category info.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSliderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      let finalImg = sliderForm.imageUrl;
      if (sliderFile) {
        finalImg = await uploadToTelegram(sliderFile);
      }

      const featureTags = sliderForm.features
        ? sliderForm.features.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      if (selectedSliderForEdit) {
        const slideRef = doc(db, 'sliders', selectedSliderForEdit.id);
        await updateDoc(slideRef, {
          title: sliderForm.title,
          subtitle: sliderForm.subtitle,
          discount: sliderForm.discount,
          color: sliderForm.color,
          features: featureTags,
          imageUrl: finalImg,
        });
      } else {
        await addDoc(collection(db, 'sliders'), {
          title: sliderForm.title,
          subtitle: sliderForm.subtitle,
          discount: sliderForm.discount,
          color: sliderForm.color,
          features: featureTags,
          imageUrl: finalImg || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=350&q=80',
          order: sliders.length + 1,
        });
      }

      setIsSliderModalOpen(false);
      setSelectedSliderForEdit(null);
    } catch (err) {
      console.error(err);
      alert('Error updating slider banner.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans selection:bg-orange-500 selection:text-white">
      
      {/* 1. Left Professional Admin Sidebar Tab Navigation Bar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col pt-6 shrink-0">
        <div className="px-6 mb-8 flex flex-col leading-none">
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-black text-xl"></span>
            <span className="text-white font-extrabold tracking-wider text-lg">mehedy</span>
            <span className="text-orange-500 font-bold text-lg">telecom</span>
          </div>
          <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase mt-1">
            CONTROL CENTER v4.2
          </span>
        </div>

        {/* Dynamic Sidebar Tab Buttons */}
        <nav className="px-4 space-y-1.5 flex-1">
          <button
            onClick={() => { setActiveTab('overview'); setSearchTerm(''); }}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === 'overview' 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            )}
          >
            <div className="flex items-center gap-3">
              <LayoutDashboard size={16} />
              <span>Overview Analytics</span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab('inventory'); setSearchTerm(''); }}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === 'inventory' 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            )}
          >
            <div className="flex items-center gap-3">
              <Package size={16} />
              <span>Inventory Stock</span>
            </div>
            {lowStockCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 animate-pulse">
                {lowStockCount} Alert
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === 'orders' 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            )}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={16} />
              <span>Online Orders</span>
            </div>
            {pendingOrders.length > 0 && (
              <span className="bg-blue-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5">
                {pendingOrders.length} New
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('offline-sales'); setSearchTerm(''); }}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === 'offline-sales' 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            )}
          >
            <div className="flex items-center gap-3">
              <TrendingUp size={16} />
              <span>Offline Sales Ledger</span>
            </div>
          </button>

          <button
            onClick={() => { setActiveTab('categories'); setSearchTerm(''); }}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === 'categories' 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            )}
          >
            <div className="flex items-center gap-3">
              <Sparkles size={16} />
              <span>Categories Details</span>
            </div>
            <span className="bg-slate-950 text-[9px] text-orange-400 font-bold px-1.5 py-0.5 rounded border border-orange-500/10">
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('sliders'); setSearchTerm(''); }}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
              activeTab === 'sliders' 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            )}
          >
            <div className="flex items-center gap-3">
              <Sliders size={16} />
              <span>Promotion Sliders</span>
            </div>
            <span className="bg-slate-950 text-[9px] text-blue-400 font-bold px-1.5 py-0.5 rounded border border-blue-500/10">
              {sliders.length}
            </span>
          </button>
        </nav>

        {/* Direct Link to Storefront View */}
        <div className="p-4 border-t border-slate-800">
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
          >
            <ArrowLeft size={14} />
            <span>View Client Store</span>
          </Link>
        </div>
      </aside>

      {/* 2. Main Space Panel */}
      <main className="flex-1 p-4 md:p-8 space-y-6 overflow-x-hidden">
        
        {/* Top bar indicators */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Database Connected</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {activeTab === 'overview' && "Dashboard Analytics"}
              {activeTab === 'inventory' && "Inventory Management"}
              {activeTab === 'orders' && "Online Shopping Orders"}
              {activeTab === 'offline-sales' && "Offline Retail Ledger"}
              {activeTab === 'categories' && "Product Categories Manager"}
              {activeTab === 'sliders' && "Promotion Slider Banners"}
            </h2>
          </div>

          {/* Quick Trigger Action Buttons on top */}
          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'categories' ? (
              <button
                onClick={() => {
                  setSelectedCategoryForEdit(null);
                  setCategoryForm({ name: '', image: '' });
                  setCategoryFile(null);
                  setCategoryPreview('');
                  setIsCategoryModalOpen(true);
                }}
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Add Category</span>
              </button>
            ) : activeTab === 'sliders' ? (
              <button
                onClick={() => {
                  setSelectedSliderForEdit(null);
                  setSliderForm({
                    title: '',
                    subtitle: '',
                    discount: '',
                    color: 'from-cyan-400 via-teal-400 to-blue-500',
                    features: '',
                    imageUrl: '',
                  });
                  setSliderFile(null);
                  setSliderPreview('');
                  setIsSliderModalOpen(true);
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Add Slide</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsProductModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>Add New Product</span>
                </button>
                <button
                  onClick={() => setIsSaleModalOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  <span>Record Offline Sale</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* SEARCH BAR (For lists screens) */}
        {activeTab !== 'overview' && (
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={
                activeTab === 'inventory' ? 'Search stock items by name or brand...' :
                activeTab === 'orders' ? 'Search online orders by phone or customer name...' :
                'Search offline sales records by name, product or phone...'
              }
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 focus:border-orange-500 text-slate-100 placeholder-slate-500 rounded-xl outline-none text-xs transition-all"
            />
          </div>
        )}

        {/* --------------------- TAB 1: OVERVIEW & ANALYTICS --------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Quick Micro Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Today Sales</span>
                  <p className="text-3xl font-black text-white">{todaySales.length}</p>
                </div>
                <div className="p-3.5 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-xl">
                  <ShoppingCart size={20} />
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Today Profit</span>
                  <p className="text-3xl font-black text-emerald-400">৳{todayProfit.toLocaleString()}</p>
                </div>
                <div className="p-3.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-xl">
                  <DollarSign size={20} />
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Monthly Sales</span>
                  <p className="text-3xl font-black text-white">{monthSales.length}</p>
                </div>
                <div className="p-3.5 bg-purple-500/10 text-purple-400 border border-purple-500/10 rounded-xl">
                  <Calendar size={20} />
                </div>
              </div>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-1">Monthly Profit</span>
                  <p className="text-3xl font-black text-orange-400">৳{monthProfit.toLocaleString()}</p>
                </div>
                <div className="p-3.5 bg-orange-500/10 text-orange-400 border border-orange-500/10 rounded-xl">
                  <TrendingUp size={20} />
                </div>
              </div>
            </div>

            {/* Custom Interactive SVG Analytics Graph Widget */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-900">
                <div>
                  <h4 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <TrendingUp className="text-orange-500" size={16} />
                    Profit Trend Analytics
                  </h4>
                  <span className="text-[10px] text-slate-400 italic">Historical profit margins plotted over daily sales velocity</span>
                </div>
                <span className="text-[10px] font-bold bg-slate-900 text-orange-400 border border-orange-500/10 px-3 py-1 rounded">
                  Live Stream
                </span>
              </div>

              {/* Simplified highly semantic SVG bar graph detailing actual profits */}
              <div className="relative h-64 w-full flex items-end justify-between pt-6 px-4">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[8px] text-slate-600 font-mono">
                  <div>৳50,000</div>
                  <div>৳25,000</div>
                  <div>৳10,000</div>
                  <div className="border-b border-slate-900">৳0</div>
                </div>

                {sales.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-bold">
                    No sales recorded to generate visual metrics yet. Click above to complete a checkout.
                  </div>
                ) : (
                  sales.slice(0, 10).reverse().map((sale, i) => {
                    // Compute basic relative visual height indicator
                    const heightPercent = Math.min(100, Math.max(15, (sale.profit / 50000) * 100));
                    return (
                      <div key={sale.id} className="group relative flex flex-col items-center flex-1 mx-1.5 h-full justify-end z-10">
                        {/* Profit Tooltip */}
                        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-mono py-1 px-2 rounded border border-slate-800 tracking-tight whitespace-nowrap z-50">
                          ৳{sale.profit.toLocaleString()} ({sale.product_name.slice(0, 8)}...)
                        </div>
                        {/* Segment pillar */}
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[20px] rounded-t-lg bg-gradient-to-t from-orange-600 to-orange-400 hover:from-orange-500 hover:to-orange-300 transition-all cursor-pointer shadow-md"
                        />
                        <span className="text-[7px] text-slate-400 mt-2 font-black uppercase text-center line-clamp-1 truncate max-w-[40px]">
                          {sale.customer_name.slice(0, 5)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick alert notifications panel + Product alert widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Box 1: Low Stock warning alerts */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h4 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <AlertCircle className="text-amber-500" size={16} />
                  Stock Alert Level Items
                </h4>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {products.filter(p => p.quantity <= 5).map(p => (
                    <div 
                      key={p.id}
                      className="p-3.5 bg-slate-900 rounded-xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-all"
                    >
                      <div>
                        <p className="text-xs font-black text-slate-100">{p.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Currently: <b className="text-slate-300">{p.quantity} leftover pcs</b></p>
                      </div>
                      <button
                        onClick={() => adjustProductStock(p.id, 10)}
                        className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-orange-400 border border-orange-500/20 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                      >
                        Quick Restock +10
                      </button>
                    </div>
                  ))}

                  {products.filter(p => p.quantity <= 5).length === 0 && (
                    <div className="text-center py-12 text-slate-500 text-xs font-bold bg-slate-900 rounded-2xl">
                      🎉 No pending inventory out-of-stock warning events.
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: Pending Checkout list on hold */}
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
                <h4 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <ShoppingCart className="text-blue-500" size={16} />
                  Pending Deliveries ({pendingOrders.length})
                </h4>

                <div className="space-y-2 max-h-72 overflow-y-auto w-full">
                  {pendingOrders.map(o => (
                    <div 
                      key={o.id}
                      className="p-3.5 bg-slate-900 rounded-xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-all"
                    >
                      <div>
                        <p className="text-xs font-black text-slate-100">{o.product_name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Buyer: <b className="text-slate-300">{o.customer_name}</b>, {o.payment_method}</p>
                      </div>
                      <button
                        onClick={() => markOnlineOrderCompleted(o.id)}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                      >
                        Mark Complete
                      </button>
                    </div>
                  ))}

                  {pendingOrders.length === 0 && (
                    <div className="text-center py-12 text-slate-500 text-xs font-bold bg-slate-900 rounded-2xl">
                      No online deliveries on queue. Safe checkout complete!
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* --------------------- TAB 2: STOCK INVENTORY MANAGER --------------------- */}
        {activeTab === 'inventory' && (
          <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Product Details</th>
                    <th className="px-6 py-4">Current Stock</th>
                    <th className="px-6 py-4">Commercials</th>
                    <th className="px-6 py-4">Profit Spec</th>
                    <th className="px-6 py-4 text-right">Database Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300 text-xs">
                  {getFilteredProducts().map(prod => (
                    <tr key={prod.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {prod.image_urls?.[0] ? (
                            <TelegramImage 
                              fileId={prod.image_urls[0]} 
                              className="w-12 h-12 rounded-xl object-contain bg-white p-1 shrink-0" 
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800 shrink-0">
                              <Package size={20} />
                            </div>
                          )}
                          <div>
                            <p className="font-extrabold text-white text-sm leading-snug">{prod.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[9px] font-bold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-orange-400 uppercase tracking-wider">
                                {prod.brand}
                              </span>
                              {prod.ram && (
                                <span className="text-[8px] bg-slate-900 font-medium px-1 py-0.5 rounded text-slate-400">
                                  {prod.ram}/{prod.rom}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => adjustProductStock(prod.id, -1)}
                            className="w-7 h-7 bg-slate-900 hover:bg-slate-800 border border-slate-800 active:scale-95 transition-all text-slate-300 font-bold flex items-center justify-center rounded-lg text-xs"
                            title="Decrease Stock"
                          >
                            -
                          </button>
                          <span className={cn(
                            "font-bold text-center min-w-[20px]",
                            prod.quantity <= 5 ? "text-red-500 scale-105" : "text-white"
                          )}>
                            {prod.quantity}
                          </span>
                          <button
                            onClick={() => adjustProductStock(prod.id, 1)}
                            className="w-7 h-7 bg-slate-900 hover:bg-slate-800 border border-slate-800 active:scale-95 transition-all text-slate-300 font-bold flex items-center justify-center rounded-lg text-xs"
                            title="Increase Stock"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-slate-400">Purchase: <b className="text-slate-200">৳{prod.purchase_price.toLocaleString()}</b></p>
                          <p className="text-[10px] text-slate-400">Retail Cash: <b className="text-orange-400">৳{prod.selling_price.toLocaleString()}</b></p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded font-black font-mono">
                          ৳{prod.profit_margin.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openEditProduct(prod)}
                            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-all"
                            title="Edit Product Details"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => deleteProductRecord(prod.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/25 border border-red-500/10 text-red-400 rounded-lg transition-all"
                            title="Delete Product permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {getFilteredProducts().length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-bold text-xs italic">
                        No product matching results found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --------------------- TAB 3: ONLINE SHOPPING ORDERS --------------------- */}
        {activeTab === 'orders' && (
          <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Order Customer</th>
                    <th className="px-6 py-4">Linked Product</th>
                    <th className="px-6 py-4">Payment Method</th>
                    <th className="px-6 py-4">Fulfillment State</th>
                    <th className="px-6 py-4 text-right">Action Gate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300 text-xs">
                  {getFilteredOrders().map(order => (
                    <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4 p-8">
                        <div>
                          <p className="font-extrabold text-white text-sm">{order.customer_name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{order.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-200">{order.product_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] uppercase font-black bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-blue-400">
                          {order.payment_method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                          order.status === 'completed' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                          order.status === 'deleted' ? "bg-red-500/10 text-red-500 border border-red-500/10" :
                          "bg-amber-500/10 text-amber-500 border border-amber-500/10 animate-pulse"
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedOrderDetail(order)}
                            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-all"
                            title="Inspect Order Address Detail"
                          >
                            <Eye size={14} />
                          </button>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => markOnlineOrderCompleted(order.id)}
                              className="p-2 bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/10 text-emerald-400 rounded-lg transition-all"
                              title="Mark Delivery Completed"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteOnlineOrder(order.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/25 border border-red-500/10 text-red-400 rounded-lg transition-all"
                            title="Delete Order"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {getFilteredOrders().length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-500 font-bold text-xs italic">
                        No online orders found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --------------------- TAB 4: OFFLINE SALES LEDGER --------------------- */}
        {activeTab === 'offline-sales' && (
          <div className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Customer Name</th>
                    <th className="px-6 py-4">Device Purchased</th>
                    <th className="px-6 py-4">Date Time</th>
                    <th className="px-6 py-4">NID / Guarantor ID</th>
                    <th className="px-6 py-4">Recorded Profit</th>
                    <th className="px-6 py-4 text-right">View Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300 text-xs">
                  {getFilteredSales().map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-extrabold text-white text-sm">{sale.customer_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sale.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-200">{sale.product_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] text-slate-400">
                          {format(new Date(sale.sale_date), 'MMM d, yyyy - p')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-slate-400">NID: <b className="text-slate-300">{sale.nid}</b></p>
                          <p className="text-[10px] text-slate-400">G: <b className="text-slate-300">{sale.guarantor}</b></p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded font-black font-mono">
                          ৳{sale.profit.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedSaleDetail(sale)}
                          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-all"
                          title="Inspect Evidence images"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {getFilteredSales().length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-500 font-bold text-xs italic">
                        No manual offline sales recorded under this store ledger yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --------------------- TAB 5: CATEGORIES MANAGEMENT --------------------- */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between hover:border-slate-700 transition-all group shadow-lg">
                <div className="flex items-center gap-4">
                  {cat.image ? (
                    cat.image.startsWith('https') ? (
                      <img src={cat.image} alt={cat.name} className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0" />
                    ) : (
                      <TelegramImage fileId={cat.image} className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0" />
                    )
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <Sparkles size={24} />
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-white text-sm tracking-tight">{cat.name}</h4>
                    <span className="text-[10px] text-slate-500 block mt-1 uppercase font-bold">
                      {products.filter(p => {
                        // Tolerate exact match or normalized lowercase matching
                        return p.category === cat.name || p.category?.toLowerCase() === cat.name.toLowerCase();
                      }).length} Products Linked
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-900">
                  <button
                    onClick={() => {
                      setSelectedCategoryForEdit(cat);
                      setCategoryForm({ name: cat.name, image: cat.image || '' });
                      setCategoryPreview(cat.image || '');
                      setCategoryFile(null);
                      setIsCategoryModalOpen(true);
                    }}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-slate-850 flex items-center justify-center gap-1.5 hover:text-white"
                  >
                    <Edit size={12} />
                    <span>Edit Category</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(`Delete the category "${cat.name}"? This won't delete the products but will unlink their references.`)) {
                        await deleteDoc(doc(db, 'categories', cat.id));
                      }
                    }}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/10 transition-all flex items-center justify-center"
                    title="Delete Category"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="col-span-full bg-slate-950 p-12 text-center text-slate-500 font-bold text-xs rounded-2xl border border-slate-800">
                No custom categories found. Add one utilizing the top button.
              </div>
            )}
          </div>
        )}

        {/* --------------------- TAB 6: PROMOTION SLIDERS --------------------- */}
        {activeTab === 'sliders' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sliders.map((slide) => (
                <div key={slide.id} className="bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all">
                  <div className={`bg-gradient-to-br ${slide.color || 'from-slate-900 to-indigo-950'} p-6 text-white h-48 flex items-center justify-between relative`}>
                    <div className="space-y-1 max-w-[60%]">
                      <span className="text-[9px] bg-white/20 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">{slide.discount || 'Special deal'}</span>
                      <h4 className="text-sm font-black uppercase tracking-tight leading-tight mt-1">{slide.title}</h4>
                      <p className="text-[10px] text-white/80 uppercase font-bold tracking-wider">{slide.subtitle}</p>
                    </div>
                    {slide.imageUrl && (
                      slide.imageUrl.startsWith('https') ? (
                        <img src={slide.imageUrl} alt="" className="w-24 h-24 object-contain rounded-xl drop-shadow-xl shrink-0" />
                      ) : (
                        <TelegramImage fileId={slide.imageUrl} className="w-24 h-24 object-contain rounded-xl drop-shadow-xl shrink-0 animate-fadeIn" />
                      )
                    )}
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between bg-slate-950">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Features & Tags:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {slide.features?.map((f, i) => (
                          <span key={i} className="text-[9px] bg-slate-900 text-slate-300 px-2 py-1 rounded-md border border-slate-800">
                            {f}
                          </span>
                        )) || <span className="text-[10px] text-slate-600 italic">No features defined</span>}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-900/60 mt-4">
                      <button
                        onClick={() => {
                          setSelectedSliderForEdit(slide);
                          setSliderForm({
                            title: slide.title,
                            subtitle: slide.subtitle,
                            discount: slide.discount || '',
                            color: slide.color || 'from-cyan-400 via-teal-400 to-blue-500',
                            features: slide.features?.join(', ') || '',
                            imageUrl: slide.imageUrl || '',
                          });
                          setSliderPreview(slide.imageUrl || '');
                          setSliderFile(null);
                          setIsSliderModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-slate-800 flex items-center justify-center gap-1.5 hover:text-white"
                      >
                        <Edit size={12} />
                        <span>Edit Promotion</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm("Are you sure you want to delete this promotion slide?")) {
                            await deleteDoc(doc(db, 'sliders', slide.id));
                          }
                        }}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/10 transition-all flex items-center justify-center"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {sliders.length === 0 && (
                <div className="col-span-full bg-slate-950 p-12 text-center text-slate-500 font-bold text-xs rounded-2xl border border-slate-800">
                  No dynamic promotion sliders defined yet. Add one using the top button.
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ==================== MODALS: THE MAIN PRODUCT FORM AND MANAGER FOR ADD/EDIT ==================== */}
      <Modal
        isOpen={isProductModalOpen || !!selectedProductForEdit}
        onClose={() => { setSelectedProductForEdit(null); setIsProductModalOpen(false); }}
        title={selectedProductForEdit ? "Modify Product Details" : "Add New Stock Product"}
        className="max-w-2xl bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl"
      >
        <form onSubmit={selectedProductForEdit ? handleUpdateProductSubmit : handleCreateProductSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Product Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Galaxy S24 FE"
                value={productForm.name}
                onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Brand</label>
              <input
                required
                type="text"
                placeholder="e.g. Samsung, INFINIX, Gree"
                value={productForm.brand}
                onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Detailed Description</label>
            <textarea
              rows={3}
              placeholder="Features, official warranty info, and details..."
              value={productForm.description}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">RAM</label>
              <input
                type="text"
                placeholder="e.g. 8GB (optional)"
                value={productForm.ram}
                onChange={e => setProductForm({ ...productForm, ram: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">ROM</label>
              <input
                type="text"
                placeholder="e.g. 256GB (optional)"
                value={productForm.rom}
                onChange={e => setProductForm({ ...productForm, rom: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Product Category</label>
              <select
                required
                value={productForm.category}
                onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              >
                <option value="">Select Category...</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Active Discount Price (৳) (Optional)</label>
              <input
                type="number"
                placeholder="e.g. 49999 (Leave blank for none)"
                value={productForm.discount_price}
                onChange={e => setProductForm({ ...productForm, discount_price: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Purchase Cost (৳)</label>
              <input
                required
                type="number"
                placeholder="e.g. 45000"
                value={productForm.purchase_price}
                onChange={e => setProductForm({ ...productForm, purchase_price: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Cash Selling Price (৳)</label>
              <input
                required
                type="number"
                placeholder="e.g. 52000"
                value={productForm.selling_price}
                onChange={e => setProductForm({ ...productForm, selling_price: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Initial Quantity</label>
              <input
                required
                type="number"
                placeholder="e.g. 15"
                value={productForm.quantity}
                onChange={e => setProductForm({ ...productForm, quantity: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
          </div>

          {/* Dynamic calculated Profit Margin helper label */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-bold flex justify-between items-center text-slate-400">
            <span>Calculated Direct Capital Profit Contribution:</span>
            <span className="text-emerald-400 font-extrabold text-sm">
              ৳{(parseFloat(productForm.selling_price || '0') - parseFloat(productForm.purchase_price || '0')).toLocaleString()}
            </span>
          </div>

          {/* Product Attach pictures widget with Telegram upload */}
          <div className="space-y-2">
            <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Device Images</span>
            <div className="grid grid-cols-4 gap-3">
              {productPreviews.map((pre, i) => (
                <div key={i} className="aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative group flex items-center justify-center p-1">
                  {selectedProductForEdit && i < (selectedProductForEdit.image_urls?.length || 0) ? (
                    <TelegramImage fileId={pre} className="w-full h-full object-contain" />
                  ) : (
                    <img src={pre} alt="" className="w-full h-full object-contain" />
                  )}
                  <button
                    type="button"
                    onClick={() => removeProductFile(i)}
                    className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              <label className="aspect-square bg-slate-900 hover:bg-slate-800/80 rounded-xl border border-dashed border-slate-800/80 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <Upload className="text-slate-500 mb-1" size={20} />
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-wide">Attach Pic</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleProductFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-900">
            <button
              type="button"
              onClick={() => { setSelectedProductForEdit(null); setIsProductModalOpen(false); }}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              {formLoading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm Information</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODALS: THE SALESTRACKER RECORD FORM ==================== */}
      <Modal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        title="Record New Offline Transaction"
        className="max-w-2xl bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl"
      >
        <form onSubmit={handleCreateSaleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <User size={14} className="text-orange-500" />
                Customer Name
              </label>
              <input
                required
                type="text"
                placeholder="Full Name"
                value={saleForm.customer_name}
                onChange={e => setSaleForm({ ...saleForm, customer_name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone size={14} className="text-orange-500" />
                Phone Number (Active)
              </label>
              <input
                required
                type="tel"
                placeholder="017XXXXXXXX"
                value={saleForm.phone}
                onChange={e => setSaleForm({ ...saleForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <CreditCard size={14} className="text-orange-500" />
                NID Identity Number
              </label>
              <input
                required
                type="text"
                placeholder="NID Verification Digit"
                value={saleForm.nid}
                onChange={e => setSaleForm({ ...saleForm, nid: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-orange-500" />
                Guarantor / Reference Number
              </label>
              <input
                required
                type="tel"
                placeholder="Guarantor mobile digit"
                value={saleForm.guarantor}
                onChange={e => setSaleForm({ ...saleForm, guarantor: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Full Shipping Address</label>
            <textarea
              required
              rows={2}
              placeholder="Store location pick-up or delivery route details..."
              value={saleForm.address}
              onChange={e => setSaleForm({ ...saleForm, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Sold Product Unit</label>
            <select
              required
              value={saleForm.product_id}
              onChange={e => setSaleForm({ ...saleForm, product_id: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-100 rounded-xl text-xs outline-none"
            >
              <option value="">Select inventory device...</option>
              {products.map(p => (
                <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                  {p.name} (In stock: {p.quantity}) - ৳{p.selling_price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {/* Verification documents - at least 1 image file */}
          <div className="space-y-2">
            <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Sale Audit Evidence (Minimum 1 Required)</span>
            <div className="grid grid-cols-4 gap-3">
              {salePreviews.map((pre, i) => (
                <div key={i} className="aspect-square bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative group flex items-center justify-center p-1">
                  <img src={pre} alt="" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => removeSaleFile(i)}
                    className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              <label className="aspect-square bg-slate-900 hover:bg-slate-800/80 rounded-xl border border-dashed border-slate-800/80 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <Upload className="text-slate-500 mb-1" size={20} />
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-wide">Add Document</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleSaleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-900">
            <button
              type="button"
              onClick={() => setIsSaleModalOpen(false)}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              {formLoading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Recording...</span>
                </>
              ) : (
                <span>Confirm Offline Sale</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODALS: INSPECT ONLINE ORDER DETAILS ==================== */}
      <Modal
        isOpen={!!selectedOrderDetail}
        onClose={() => setSelectedOrderDetail(null)}
        title="Online Order Details Information"
        className="max-w-lg bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl/5"
      >
        {selectedOrderDetail && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <Clock className="text-slate-400" size={18} />
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-black">Date Placed</p>
                  <p className="font-bold text-white text-xs">
                    {format(new Date(selectedOrderDetail.order_date), 'PPP p')}
                  </p>
                </div>
              </div>
              <span className={cn(
                "px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                selectedOrderDetail.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-500"
              )}>
                {selectedOrderDetail.status}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-900 text-orange-500 border border-slate-800 rounded-xl">
                  <User size={18} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-black">Client Buyer</span>
                  <p className="font-black text-white text-sm">{selectedOrderDetail.customer_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Cell: {selectedOrderDetail.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-900 text-orange-500 border border-slate-800 rounded-xl">
                  <MapPin size={18} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-black">Shipping Delivery Address</span>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-semibold">{selectedOrderDetail.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-900 text-orange-500 border border-slate-800 rounded-xl">
                  <Package size={18} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-black">Ordered Device Unit</span>
                  <p className="text-xs text-slate-200 font-black mt-0.5 leading-none">{selectedOrderDetail.product_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-slate-900 text-orange-500 border border-slate-800 rounded-xl">
                  <CreditCard size={18} />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-black">Settlement Method</span>
                  <p className="text-xs text-blue-400 font-extrabold mt-0.5">{selectedOrderDetail.payment_method}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-900">
              {selectedOrderDetail.status === 'pending' && (
                <button
                  onClick={() => markOnlineOrderCompleted(selectedOrderDetail.id)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Mark Completed
                </button>
              )}
              <button
                onClick={() => deleteOnlineOrder(selectedOrderDetail.id)}
                className="flex-1 py-3 bg-red-650/10 hover:bg-red-650/20 border border-red-500/10 text-red-500 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                Delete Order
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ==================== MODALS: THE MAIN CATEGORY FORM FOR ADD/EDIT ==================== */}
      <Modal
        isOpen={isCategoryModalOpen || !!selectedCategoryForEdit}
        onClose={() => { setSelectedCategoryForEdit(null); setIsCategoryModalOpen(false); }}
        title={selectedCategoryForEdit ? "Modify Category Details" : "Create New Product Category"}
        className="max-w-md bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl"
      >
        <form onSubmit={handleCategorySubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5 font-sans">Category Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Smart Phone"
              value={categoryForm.name}
              onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-orange-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
            />
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Category Image</span>
            {categoryPreview && (
              <div className="w-24 h-24 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center p-1 relative">
                {categoryPreview.startsWith('https') ? (
                  <img src={categoryPreview} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <TelegramImage fileId={categoryPreview} className="w-full h-full object-cover rounded-xl" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCategoryPreview('');
                    setCategoryForm({ ...categoryForm, image: '' });
                    setCategoryFile(null);
                  }}
                  className="absolute top-1 right-1 p-0.5 bg-red-650 text-white rounded-full hover:bg-red-700"
                >
                  <X size={10} />
                </button>
              </div>
            )}

            <label className="flex items-center gap-3 px-4 py-3 bg-slate-900 hover:bg-slate-850 rounded-xl border border-dashed border-slate-800 cursor-pointer transition-colors max-w-xs">
              <Upload size={16} className="text-slate-500" />
              <span className="text-xs text-slate-400">Upload Image File</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setCategoryFile(file);
                    setCategoryPreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-900">
            <button
              type="button"
              onClick={() => { setSelectedCategoryForEdit(null); setIsCategoryModalOpen(false); }}
              className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              {formLoading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <span>Save Category</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODALS: THE MAIN SLIDER FORM FOR ADD/EDIT ==================== */}
      <Modal
        isOpen={isSliderModalOpen || !!selectedSliderForEdit}
        onClose={() => { setSelectedSliderForEdit(null); setIsSliderModalOpen(false); }}
        title={selectedSliderForEdit ? "Modify Promotion Slide" : "Create New Promotion Slide"}
        className="max-w-lg bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl"
      >
        <form onSubmit={handleSliderSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Header Title</label>
              <input
                required
                type="text"
                placeholder="e.g. GREAT DEALS"
                value={sliderForm.title}
                onChange={e => setSliderForm({ ...sliderForm, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 focus:border-blue-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Subtitle</label>
              <input
                required
                type="text"
                placeholder="e.g. ON MOBILE PHONE"
                value={sliderForm.subtitle}
                onChange={e => setSliderForm({ ...sliderForm, subtitle: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 focus:border-blue-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Discount Tag</label>
              <input
                type="text"
                placeholder="e.g. 28% Discount"
                value={sliderForm.discount}
                onChange={e => setSliderForm({ ...sliderForm, discount: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 focus:border-blue-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Gradient Theme Class</label>
              <select
                value={sliderForm.color}
                onChange={e => setSliderForm({ ...sliderForm, color: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 text-slate-100 rounded-xl text-xs outline-none"
              >
                <option value="from-cyan-400 via-teal-400 to-blue-500">Cool Cyan (Blue/Teal)</option>
                <option value="from-slate-900 via-indigo-900 to-indigo-950">Mysterious Titanium (Dark/Indigo)</option>
                <option value="from-purple-800 via-pink-700 to-rose-600">Dynamic Violet (Purple/Rose)</option>
                <option value="from-amber-500 via-orange-600 to-red-600">Spicy Orange (Amber/Red)</option>
                <option value="from-emerald-500 to-teal-700">Verdant Green (Emerald/Teal)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1">Bullet Features (Separate by Comma)</label>
            <input
              type="text"
              placeholder="e.g. 12 Month EMI, Extra Free Gifts, Official store seals"
              value={sliderForm.features}
              onChange={e => setSliderForm({ ...sliderForm, features: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 focus:border-blue-500 text-slate-100 rounded-xl outline-none text-xs transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-black uppercase text-slate-400 tracking-wider">Promotion Image Banner</span>
            {sliderPreview && (
              <div className="w-32 h-24 bg-slate-900 border border-slate-800 rounded-xl p-1.5 relative flex items-center justify-center overflow-hidden">
                {sliderPreview.startsWith('https') ? (
                  <img src={sliderPreview} alt="" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <TelegramImage fileId={sliderPreview} className="w-full h-full object-contain rounded-xl" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSliderPreview('');
                    setSliderForm({ ...sliderForm, imageUrl: '' });
                    setSliderFile(null);
                  }}
                  className="absolute top-1 right-1 p-0.5 bg-red-650 hover:bg-red-700 text-white rounded-full"
                >
                  <X size={10} />
                </button>
              </div>
            )}

            <label className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 rounded-xl border border-dashed border-slate-800 cursor-pointer transition-colors max-w-xs">
              <Upload size={16} className="text-slate-500" />
              <span className="text-xs text-slate-400">Attach Device Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setSliderFile(file);
                    setSliderPreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-900">
            <button
              type="button"
              onClick={() => { setSelectedSliderForEdit(null); setIsSliderModalOpen(false); }}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              {formLoading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <span>Save Slide</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ==================== MODALS: INSPECT OFFLINE SALE RECEIPT & EVIDENCE ==================== */}
      <Modal
        isOpen={!!selectedSaleDetail}
        onClose={() => setSelectedSaleDetail(null)}
        title="Offline Store Checkout Verification"
        className="max-w-2xl bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl"
      >
        {selectedSaleDetail && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4 border-b border-slate-900">
              <div className="space-y-3.5">
                <h5 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Buyer Information Record</h5>
                <div className="space-y-2 text-xs">
                  <p className="text-slate-400">Name: <span className="font-bold text-white ml-1">{selectedSaleDetail.customer_name}</span></p>
                  <p className="text-slate-400">Mobile: <span className="font-bold text-white ml-1">{selectedSaleDetail.phone}</span></p>
                  <p className="text-slate-400">National NID: <span className="font-bold text-white ml-1">{selectedSaleDetail.nid}</span></p>
                  <p className="text-slate-400">Guarantor Num: <span className="font-bold text-white ml-1">{selectedSaleDetail.guarantor}</span></p>
                  <p className="text-slate-400">Address: <span className="font-semibold text-white ml-1 block mt-1 leading-relaxed">{selectedSaleDetail.address}</span></p>
                </div>
              </div>

              <div className="space-y-3.5">
                <h5 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Transaction Ledger</h5>
                <div className="space-y-2 text-xs">
                  <p className="text-slate-400">Checkout Time: <span className="font-bold text-white ml-1">{format(new Date(selectedSaleDetail.sale_date), 'PPP - p')}</span></p>
                  <p className="text-slate-400">Device model: <span className="font-bold text-orange-400 ml-1">{selectedSaleDetail.product_name}</span></p>
                  <p className="text-slate-400">Recorded pure Profit: <span className="font-extrabold text-emerald-400 ml-1">৳{selectedSaleDetail.profit.toLocaleString()}</span></p>
                </div>
              </div>
            </div>

            {/* Document Gallery evidence attachments */}
            <div className="space-y-3">
              <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider">Verification Evidence Images</span>
              <div className="grid grid-cols-3 gap-3">
                {selectedSaleDetail.image_file_ids?.map((fileId, i) => (
                  <div key={i} className="aspect-square bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center p-1.5 shadow-md">
                    <TelegramImage 
                      fileId={fileId} 
                      className="w-full h-full object-contain hover:scale-110 transition-transform duration-500 rounded-xl" 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
