import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, OnlineOrder, Category, SliderItem } from '../types';
import { 
  Search, 
  Store, 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Bell, 
  Menu, 
  Mic, 
  Play, 
  Heart, 
  User, 
  ChevronRight, 
  Film, 
  Tv, 
  Activity 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import TelegramImage from './TelegramImage';
import Modal from './Modal';
import OrderForm from './OrderForm';
import { cn } from '../lib/utils';
import { NotificationService } from '../services/NotificationService';
import { motion, AnimatePresence } from 'motion/react';

// Highly curated mockup categories matching reference image
const CATEGORIES = [
  {
    name: 'Mobile Phone',
    image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=120&q=80'
  },
  {
    name: 'Tablet & Accessories',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=120&q=80'
  },
  {
    name: 'Laptop',
    image: 'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=120&q=80'
  },
  {
    name: 'Wireless Headphone',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=120&q=80'
  },
  {
    name: 'Smart Watch',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=120&q=80'
  },
  {
    name: 'Home Appliances',
    image: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=120&q=80'
  },
  {
    name: 'Wired Headphone',
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=120&q=80'
  },
  {
    name: 'Airpods',
    image: 'https://images.unsplash.com/photo-1588449668338-d1516882247e?auto=format&fit=crop&w=120&q=80'
  },
  {
    name: 'Headphone',
    image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=120&q=80'
  },
  {
    name: 'Speaker',
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=120&q=80'
  }
];

// Slides for Dynamic Slider Banner
const SLIDER_IMAGES = [
  {
    title: "GREAT DEALS",
    subtitle: "ON AIR CONDITIONER",
    discount: "28% Discount",
    color: "from-cyan-400 via-teal-400 to-blue-500",
    features: ["36 MONTH EMI", "FREE DELIVERY", "INSTALLATION FACILITY", "2 Year Service Warranty"],
    imageUrl: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=350&q=80"
  },
  {
    title: "IPHONE 15 PRO DEALS",
    subtitle: "TITANIUM POWER EXPERIMENT",
    discount: "Up to 15% Off",
    color: "from-slate-900 via-indigo-900 to-indigo-950",
    features: ["12 MONTH EMI", "OFFICIAL STORE WARRANTY", "EXTRA CLUB BONUS"],
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=350&q=80"
  },
  {
    title: "PREMIUM SOUND EXPERIENCE",
    subtitle: "AIRPODS & OVER EAR HEADSETS",
    discount: "20% Discount",
    color: "from-purple-800 via-pink-700 to-rose-600",
    features: ["7 DAYS RETURN POLICY", "ORIGINAL SEALS", "FREE PREMIUM CASE"],
    imageUrl: "https://images.unsplash.com/photo-1588449668338-d1516882247e?auto=format&fit=crop&w=350&q=80"
  }
];

// Rich gadget clips for the "Clips To Cart" page tab
const GADGET_CLIPS = [
  {
    id: "clip-1",
    title: "iPhone 15 Pro Titanium Dream!",
    desc: "Unboxing the marvelous organic titanium frame. Super lightweight, powerful A17 Pro chipped!",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-holding-a-smart-phone-with-a-green-screen-40540-large.mp4",
    likes: "25.6K",
    views: "195K"
  },
  {
    id: "clip-2",
    title: "Gree Split Air Conditioner Review",
    desc: "Chill instantly. Super noiseless operation and ultra smart inverter saving up to 60% electric bills!",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-developer-working-on-a-program-on-a-tablet-40454-large.mp4",
    likes: "12.4K",
    views: "102K"
  },
  {
    id: "clip-3",
    title: "AirPods Pro 2 In-Depth Test",
    desc: "Does the sound stay real? Checking customized spatial audio tracks and active noise cancel presets.",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-yellow-headphones-listening-to-music-40562-large.mp4",
    likes: "34.8K",
    views: "310K"
  }
];

export default function CustomerShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categoryWithProductsModal, setCategoryWithProductsModal] = useState<Category | null>(null);
  const [myOrders, setMyOrders] = useState<OnlineOrder[]>([]);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const orderListeners = useRef<{ [key: string]: () => void }>({});

  // Active view tab state (driven by dynamic bottom navigation bar)
  // Options: 'home' | 'clips' | 'home-appliances' | 'account'
  const [activeTab, setActiveTab] = useState<'home' | 'clips' | 'home-appliances' | 'account'>('home');

  // Interactive slider active index
  const [sliderIndex, setSliderIndex] = useState(0);

  // Category Filtering
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Products Sub-Tabs: 'best-deals' | 'top-selling'
  const [activeSectionTab, setActiveSectionTab] = useState<'best-deals' | 'top-selling'>('best-deals');

  // Listen to Categories and Promotion Sliders dynamically
  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      if (items.length > 0) {
        setCategories(items);
      } else {
        setCategories(CATEGORIES.map((c, i) => ({ id: `static-${i}`, ...c })));
      }
    });

    const unsubSliders = onSnapshot(collection(db, 'sliders'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SliderItem));
      if (items.length > 0) {
        setSliders(items);
      } else {
        setSliders(SLIDER_IMAGES.map((s, i) => ({ id: `static-${i}`, ...s as any })));
      }
    });

    return () => {
      unsubCats();
      unsubSliders();
    };
  }, []);

  useEffect(() => {
    // Request push notification permission
    NotificationService.requestPermission();

    const q = query(collection(db, 'products'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    // Listen for status updates on my orders
    const storedOrderIds: string[] = JSON.parse(localStorage.getItem('my_orders') || '[]');
    
    storedOrderIds.forEach(orderId => {
      if (orderListeners.current[orderId]) return;

      const unsub = onSnapshot(doc(db, 'online_orders', orderId), (snapshot) => {
        if (!snapshot.exists()) return;
        
        const orderData = { id: snapshot.id, ...snapshot.data() } as OnlineOrder;
        
        setMyOrders(prev => {
          const index = prev.findIndex(o => o.id === orderId);
          if (index > -1) {
            const oldOrder = prev[index];
            if (oldOrder.status !== orderData.status) {
              NotificationService.notifyCustomer(orderData.status, orderData.product_name);
            }
            const newOrders = [...prev];
            newOrders[index] = orderData;
            return newOrders;
          }
          return [...prev, orderData];
        });
      });
      orderListeners.current[orderId] = unsub;
    });

    return () => {
      unsubscribe();
      Object.values(orderListeners.current).forEach((unsub: any) => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, []);

  // Slider Rotation
  useEffect(() => {
    if (sliders.length === 0) return;
    const timer = setInterval(() => {
      setSliderIndex((prev) => (prev + 1) % sliders.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [sliders]);

  // Maps product entities dynamically to their proper category with synonym normalization
  const getProductCategory = (product: Product): string => {
    let cat = (product.category || '').trim();
    
    // Normalize existing categories to match canonical defaults
    if (cat) {
      const lowerCat = cat.toLowerCase();
      if (lowerCat.includes('phone') || lowerCat.includes('mobile') || lowerCat === 'smartphone') {
        return 'Mobile Phone';
      }
      if (lowerCat.includes('watch') || lowerCat === 'smartwatch') {
        return 'Smart Watch';
      }
      if (lowerCat.includes('laptop') || lowerCat.includes('notebook')) {
        return 'Laptop';
      }
      if (lowerCat.includes('tablet') || lowerCat.includes('ipad') || lowerCat === 'tab') {
        return 'Tablet & Accessories';
      }
      if (lowerCat.includes('airpod') || lowerCat.includes('buds') || lowerCat.includes('earbud') || lowerCat.includes('earphone')) {
        return 'Airpods';
      }
      if (lowerCat.includes('speaker') || lowerCat.includes('soundbar')) {
        return 'Speaker';
      }
      if (lowerCat.includes('appliance') || lowerCat.includes('ac') || lowerCat.includes('conditioner')) {
        return 'Home Appliances';
      }
      return cat;
    }

    const name = product.name.toLowerCase();
    const desc = (product.description || '').toLowerCase();
    
    if (name.includes('phone') || name.includes('s24') || name.includes('s23') || name.includes('iphone') || name.includes('galaxy') || name.includes('pixel') || name.includes('infinix') || name.includes('tecno') || name.includes('redmi') || name.includes('realme') || name.includes('oneplus') || name.includes('oppo') || name.includes('vivo') || name.includes('nokia') || name.includes('gadget')) {
      return 'Mobile Phone';
    }
    if (name.includes('laptop') || name.includes('macbook') || name.includes('notebook') || name.includes('asus') || name.includes('hp ') || name.includes('dell')) {
      return 'Laptop';
    }
    if (name.includes('tablet') || name.includes('ipad') || name.includes('tab') || name.includes('pencil') || name.includes('pen')) {
      return 'Tablet & Accessories';
    }
    if (name.includes('airpods') || name.includes('buds') || name.includes('earbuds') || name.includes('tws')) {
      return 'Airpods';
    }
    if (name.includes('wireless headphone') || name.includes('over ear') || name.includes('bluetooth headphone')) {
      return 'Wireless Headphone';
    }
    if (name.includes('wired headphone') || name.includes('wired earphone')) {
      return 'Wired Headphone';
    }
    if (name.includes('headphone') || name.includes('headset')) {
      return 'Headphone';
    }
    if (name.includes('speaker') || name.includes('soundbar') || name.includes('bluetooth speaker')) {
      return 'Speaker';
    }
    if (name.includes('watch') || name.includes('smartwatch')) {
      return 'Smart Watch';
    }
    if (name.includes('ac') || name.includes('conditioner') || name.includes('fridge') || name.includes('cooker') || name.includes('blender') || name.includes('tv') || name.includes('television') || name.includes('home appliance')) {
      return 'Home Appliances';
    }
    
    if (desc.includes('phone') || desc.includes('mobile')) return 'Mobile Phone';
    if (desc.includes('laptop') || desc.includes('pc')) return 'Laptop';
    if (desc.includes('buds') || desc.includes('anc')) return 'Airpods';
    if (desc.includes('headphone')) return 'Headphone';
    if (desc.includes('tv') || desc.includes('appliance')) return 'Home Appliances';
    
    return 'Mobile Phone';
  };

  // Perform filtering based on search keywords, category filtering, and sub-tab selection (such as Best Deals)
  const getFilteredAndSortedProducts = (): Product[] => {
    let list = [...products];

    // Search bar term filter
    if (searchTerm.trim() !== '') {
      list = list.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Curated Category list filter
    if (selectedCategory) {
      list = list.filter(p => {
        const pCat = getProductCategory(p) || '';
        return pCat.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
      });
    }

    // Sub-tab Pill Sorting/Filtering
    if (activeSectionTab === 'best-deals') {
      list.sort((a, b) => b.profit_margin - a.profit_margin);
    } else {
      // Top Selling - simply order by highest stock velocity or creation
      list.sort((a, b) => b.quantity - a.quantity);
    }

    // If on specialized Home Appliance tab driven from the bottom navigation bar
    if (activeTab === 'home-appliances') {
      return list.filter(p => {
        const pCat = getProductCategory(p) || '';
        return pCat.trim().toLowerCase() === 'home appliances';
      });
    }

    return list;
  };

  const finalProducts = getFilteredAndSortedProducts();

  return (
    <div className="min-h-screen bg-white pb-24 text-gray-900 font-sans">
      {/* 1. Pitch Black Header Area matching reference image exactly */}
      <header className="bg-[#0c0c0c] text-white">
        <div className="max-w-7xl mx-auto px-4 h-16 grid grid-cols-3 items-center">
          {/* Left section: Menu */}
          <div className="flex items-center justify-start">
            <button className="p-1 hover:bg-neutral-800 rounded-lg transition-colors">
              <Menu size={24} className="text-white" />
            </button>
          </div>
          
          {/* Center section: Themed Custom Logo centered horizontally */}
          <div className="flex flex-col items-center justify-center text-center leading-none cursor-pointer" onClick={() => { setActiveTab('home'); setSelectedCategory(null); }}>
            <div className="flex items-center gap-1.5 justify-center">
              <span className="text-orange-500 font-bold text-xl inline-flex items-center"></span>
              <span className="text-white font-extrabold tracking-wider text-base md:text-lg">mehedy</span>
              <span className="text-orange-500 font-black text-base md:text-lg">telecom</span>
            </div>
            <span className="text-[7px] md:text-[8px] text-gray-400 font-black tracking-widest uppercase mt-1">GADGETS & APPLIANCES</span>
          </div>

          {/* Right section: Actions */}
          <div className="flex items-center justify-end gap-2">
            {/* Real-time Tracked customer orders count badge */}
            <button 
              onClick={() => setIsOrdersModalOpen(true)}
              className="p-2.5 bg-[#1b1b1b] hover:bg-neutral-800 text-white rounded-full transition-all relative"
              title="Track Orders"
            >
              <ShoppingCart size={18} />
              {myOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 leading-none">
                  {myOrders.length}
                </span>
              )}
            </button>

            {/* Quick Link to Admin Section */}
            <Link 
              to="/mehedy" 
              className="p-2.5 bg-[#1b1b1b] hover:bg-neutral-800 text-white rounded-full transition-all"
              title="Admin Workspace"
            >
              <LayoutDashboard size={18} />
            </Link>
          </div>
        </div>

        {/* 2. Premium Capsule Search Bar inside the Header styled exactly like reference image */}
        <div className="px-4 pb-4 bg-[#0c0c0c]">
          <div 
            onClick={() => setIsSearchPopupOpen(true)}
            className="relative max-w-md mx-auto cursor-pointer"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              readOnly
              type="text"
              placeholder="Search gadgets, smartphones..."
              className="w-full pl-11 pr-11 py-2.5 rounded-full bg-slate-100 border border-slate-200 text-gray-900 text-sm font-normal placeholder-gray-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all cursor-pointer"
              value={searchTerm}
            />
            <Mic className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-500 animate-pulse" size={16} />
          </div>
        </div>
      </header>

      {/* Main Container switching views driven by bottom navigation tabs */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* 3. Slider Container with beautiful active transitions */}
            {sliders.length > 0 && sliders[sliderIndex] && (
              <div className="relative rounded-2xl overflow-hidden aspect-[16/7] md:aspect-[24/8] bg-gray-100 shadow-sm border border-gray-100">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={sliderIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className={cn(
                      "absolute inset-0 w-full h-full bg-gradient-to-r flex items-center p-4 md:p-8 text-white",
                      sliders[sliderIndex].color || 'from-slate-900 to-indigo-950'
                    )}
                  >
                    <div className="w-2/3 h-full flex flex-col justify-center space-y-1 md:space-y-3 z-10">
                      <span className="text-[8px] md:text-sm font-black bg-white/20 text-white px-2 py-0.5 rounded-md self-start uppercase tracking-wider">
                        {sliders[sliderIndex].discount || 'Special deal'}
                      </span>
                      <h2 className="text-xs md:text-3xl font-black tracking-tight leading-none">
                        {sliders[sliderIndex].title}
                      </h2>
                      <h3 className="text-[10px] md:text-2xl font-extrabold text-white/90">
                        {sliders[sliderIndex].subtitle}
                      </h3>

                      {/* Miniature highlights labels inside slide matching reference details */}
                      <div className="flex flex-wrap gap-1 pt-1 md:pt-2">
                        {sliders[sliderIndex].features?.map((feat, i) => (
                          <span key={i} className="text-[6px] md:text-[10px] font-bold bg-white/10 px-1.5 py-0.5 rounded">
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Right side slide graphics thumbnail */}
                    <div className="w-1/3 h-full flex items-center justify-center relative">
                      {sliders[sliderIndex].imageUrl && (
                        sliders[sliderIndex].imageUrl.startsWith('https') ? (
                          <img 
                            src={sliders[sliderIndex].imageUrl} 
                            alt="" 
                            className="max-h-full rounded-lg object-contain scale-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <TelegramImage 
                            fileId={sliders[sliderIndex].imageUrl} 
                            className="max-h-full rounded-lg object-contain scale-105" 
                          />
                        )
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Slider Dynamic Dot Navigation Indicators centered inside slide background */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                  {sliders.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSliderIndex(i)}
                      className={cn(
                        "w-1.5 h-1.5 rounded-full transition-all",
                        sliderIndex === i ? "bg-orange-500 w-3" : "bg-white/55 hover:bg-white"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4.Curated Categories Grid matching reference structure exactly (Two rows of 5 icons) */}
            <section className="pt-2">
              <div className="flex items-center justify-between mb-3.5">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Categories</span>
                {selectedCategory && (
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs font-black text-orange-500 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>              {/* Two rows dynamic flex wrap wrapper matching precisely the category structure */}
              <div className="grid grid-cols-5 gap-y-4 gap-x-2">
                {categories.map((cat, i) => {
                  const isActive = selectedCategory === cat.name;
                  return (
                    <div 
                      key={cat.id || i}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setCategoryWithProductsModal(cat);
                      }}
                      className="flex flex-col items-center cursor-pointer group animate-fadeIn"
                    >
                      <div className={cn(
                        "w-11 h-11 md:w-16 md:h-16 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border-2 transition-all p-1.5",
                        isActive ? "border-orange-500 bg-orange-55/50 shadow-sm" : "border-gray-100 group-hover:border-gray-200"
                      )}>
                        {cat.image ? (
                          cat.image.startsWith('https') ? (
                            <img 
                              src={cat.image} 
                              alt={cat.name} 
                              className="w-full h-full object-contain mix-blend-multiply rounded-full"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <TelegramImage 
                              fileId={cat.image} 
                              className="w-full h-full object-contain mix-blend-multiply rounded-full" 
                            />
                          )
                        ) : (
                          <div className="text-gray-400 font-bold text-xs"></div>
                        )}
                      </div>
                      <span className={cn(
                        "text-[8px] md:text-xs text-center font-bold tracking-tight mt-1.5 line-clamp-2 max-w-[70px] leading-tight",
                        isActive ? "text-orange-600 font-extrabold" : "text-gray-600 group-hover:text-gray-900"
                      )}>
                        {cat.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. Featured Products Headers, Dynamic Tab Switcher Pills & Real Item Cards */}
            <section className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none">
                    Featured Products
                  </h3>
                  {selectedCategory && (
                    <span className="text-xs text-gray-400 font-medium">Filtering category: <b className="text-gray-700">{selectedCategory}</b></span>
                  )}
                </div>

                {/* Switcher Pills layout matching "Best Deals" & "Top Selling" reference buttons */}
                <div className="flex items-center gap-1.5 self-start">
                  <button
                    onClick={() => setActiveSectionTab('best-deals')}
                    className={cn(
                      "px-3.5 py-1.5 text-[10px] md:text-xs font-black rounded-full transition-all border",
                      activeSectionTab === 'best-deals'
                        ? "bg-black text-white border-black shadow"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    Best Deals
                  </button>
                  <button
                    onClick={() => setActiveSectionTab('top-selling')}
                    className={cn(
                      "px-3.5 py-1.5 text-[10px] md:text-xs font-black rounded-full transition-all border",
                      activeSectionTab === 'top-selling'
                        ? "bg-black text-white border-black shadow"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    Top Selling
                  </button>
                </div>
              </div>

              {/* 3 Columns mobile micro product box layout user specifically requested! */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-4 pb-12">
                {finalProducts.map((product) => (
                  <div 
                    key={product.id} 
                    onClick={() => setSelectedProduct(product)}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 overflow-hidden group flex flex-col cursor-pointer"
                  >
                    {/* Item Image with Bounded Card design */}
                    <div className="aspect-square relative overflow-hidden bg-slate-50 p-1">
                      {product.image_urls?.[0] ? (
                        <TelegramImage 
                          fileId={product.image_urls[0]} 
                          className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-500 bg-white" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-white rounded-lg">
                          <Package size={20} />
                        </div>
                      )}

                      {/* Stock Badge */}
                      <div className="absolute bottom-1 right-1">
                        <span className={cn(
                          "px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider shadow-sm",
                          product.quantity > 0 ? "bg-white/95 text-blue-600" : "bg-red-500 text-white"
                        )}>
                          {product.quantity > 0 ? 'In' : 'Out'}
                        </span>
                      </div>
                    </div>

                    {/* Details Box */}
                    <div className="p-1.5 sm:p-3 flex-1 flex flex-col">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {product.ram && (
                          <span className="px-1 py-0.5 bg-gray-50 text-gray-500 text-[6px] sm:text-[8px] font-bold rounded">
                            {product.ram}
                          </span>
                        )}
                        {product.rom && (
                          <span className="px-1 py-0.5 bg-gray-50 text-gray-500 text-[6px] sm:text-[8px] font-bold rounded">
                            {product.rom}
                          </span>
                        )}
                      </div>

                      <h4 className="text-[9px] sm:text-xs font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors mb-2">
                        {product.name}
                      </h4>

                      <div className="mt-auto pt-1 border-t border-gray-50 flex items-baseline justify-between">
                        <span className="text-[10px] sm:text-sm font-extrabold text-blue-600">
                          ৳{product.selling_price.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {finalProducts.length === 0 && (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                  <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm">
                    <Search className="text-gray-400" size={24} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">No matching products</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">Try typing another query or clear the selected category filters.</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* 2. Clips To Cart Feed Tab Screens */}
        {activeTab === 'clips' && (
          <div className="max-w-md mx-auto space-y-6 pb-12">
            <div className="pb-2 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Film className="text-orange-500" size={24} />
                Clips To Cart
              </h2>
              <p className="text-xs text-gray-400 mt-1">Watch real gadget review clips and click directly to place orders.</p>
            </div>

            {GADGET_CLIPS.map((clip) => (
              <div 
                key={clip.id}
                className="bg-black rounded-3xl overflow-hidden relative aspect-[9/14] md:aspect-[9/13] shadow-lg flex flex-col justify-end text-white border border-neutral-800 group"
              >
                {/* Standard un-referred Video element inside loop */}
                <video 
                  src={clip.videoUrl} 
                  className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                  loop 
                  muted 
                  autoPlay 
                  playsInline 
                  referrerPolicy="no-referrer"
                />

                {/* Dark shading overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

                {/* Overlay controls metadata details */}
                <div className="relative p-6 space-y-3 z-10">
                  <div className="flex items-center justify-between text-xs font-bold text-white/80">
                    <span className="bg-orange-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[8px]">
                      HOT REEL
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart size={14} className="text-rose-500 fill-rose-500" /> {clip.likes}
                      </span>
                      <span>{clip.views} views</span>
                    </div>
                  </div>

                  <h3 className="text-base font-black tracking-tight leading-snug">
                    {clip.title}
                  </h3>
                  <p className="text-xs text-neutral-300 leading-relaxed font-medium line-clamp-3">
                    {clip.desc}
                  </p>

                  <div className="pt-2">
                    <button 
                      onClick={() => {
                        // Dynamically link to search for this item in state or choose first available device
                        const item = products.find(p => p.name.toLowerCase().includes('ac') || p.name.toLowerCase().includes('airpo') || p.name.toLowerCase().includes('phone')) || products[0];
                        if (item) {
                          setSelectedProduct(item);
                        } else {
                          alert("No products in directory to link yet! Please add inventory first.");
                        }
                      }}
                      className="w-full py-3 bg-white text-black hover:bg-orange-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={14} />
                      <span>ORDER THIS PRODUCT</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. Specialized Home Appliances Direct Tab Screen */}
        {activeTab === 'home-appliances' && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Tv className="text-teal-600" size={24} />
                Smart Home Appliances
              </h2>
              <p className="text-xs text-gray-400 mt-1">Gree split ACs, air conditioners, heaters, fans, and digital electronics.</p>
            </div>

            {/* Sub Appliance List */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-4 pb-12">
              {finalProducts.map((product) => (
                <div 
                  key={product.id} 
                  onClick={() => setSelectedProduct(product)}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 overflow-hidden group flex flex-col cursor-pointer"
                >
                  <div className="aspect-square relative overflow-hidden bg-slate-50 p-1">
                    {product.image_urls?.[0] ? (
                      <TelegramImage 
                        fileId={product.image_urls[0]} 
                        className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-500 bg-white" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 bg-white rounded-lg">
                        <Package size={20} />
                      </div>
                    )}

                    <div className="absolute bottom-1 right-1">
                      <span className={cn(
                        "px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider shadow-sm",
                        product.quantity > 0 ? "bg-white/95 text-blue-600" : "bg-red-500 text-white"
                      )}>
                        {product.quantity > 0 ? 'In' : 'Out'}
                      </span>
                    </div>
                  </div>

                  <div className="p-1.5 sm:p-3 flex-1 flex flex-col">
                    <h4 className="text-[9px] sm:text-xs font-semibold text-gray-800 line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors mb-2">
                      {product.name}
                    </h4>

                    <div className="mt-auto pt-1 border-t border-gray-50 flex items-baseline justify-between">
                      <span className="text-[10px] sm:text-sm font-extrabold text-blue-600">
                        ৳{product.selling_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {finalProducts.length === 0 && (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                <div className="bg-white w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-sm animate-pulse">
                  <Tv className="text-gray-400" size={24} />
                </div>
                <h3 className="text-sm font-bold text-gray-800">No home appliances right now</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">Please visit the Admin section to add real air conditioner or kitchen appliance entities.</p>
                <Link to="/mehedy" className="inline-block mt-4 text-xs font-black text-orange-500 border border-orange-500 px-4 py-2 rounded-xl bg-white hover:bg-orange-50 transition-all">
                  LOG IN ADMIN
                </Link>
              </div>
            )}
          </div>
        )}

        {/* 4. Specialized Personal Account & Tracking Orders Tab Screen */}
        {activeTab === 'account' && (
          <div className="max-w-xl mx-auto space-y-6 pb-12">
            <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl -mr-6 -mt-6" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center font-black text-white text-2xl uppercase border-2 border-white/20">
                  {myOrders[0]?.customer_name?.slice(0, 2) || "MT"}
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight leading-none">
                    {myOrders[0]?.customer_name || "Guest Account"}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">Mehedy Telecom Loyal Customer Program</p>
                </div>
              </div>
            </div>

            {/* Orders Track History list inside Account screen */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase text-gray-400 tracking-wider">
                My Tracked Orders ({myOrders.length})
              </h3>

              {myOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-gray-100">
                  <p className="text-xs text-gray-400 font-medium">You haven't placed or tracked any orders here yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrders.map((order) => (
                    <div key={order.id} className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-gray-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-gray-900">{order.product_name}</span>
                          <span className="text-[9px] bg-white text-gray-500 border border-gray-200 px-1.5 py-0.25 rounded font-bold">
                            {order.payment_method}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium font-mono">
                          ID: {order.id.slice(0, 12)}...
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          Placed: {new Date(order.order_date || '').toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-none pt-2 sm:pt-0">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                          order.status === 'completed' ? "bg-green-100 text-green-700" :
                          order.status === 'deleted' ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700 animate-pulse"
                        )}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Store details info Card */}
            <div className="bg-orange-50 border border-orange-100/80 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-black uppercase text-orange-900 tracking-wider">
                Support & Direct Assistance
              </h4>
              <p className="text-xs text-orange-800 leading-relaxed font-semibold">
                Mehedy Telecom provides premium physical store and online sales assistance. Our hotlines remain open from 10:00 AM to 10:00 PM every day!
              </p>
              <div className="text-xs font-extrabold text-orange-950 font-mono space-y-1 pt-1">
                <p>Call: +880 17XXXXXXXX</p>
                <p>Support Mail: support@mehedytelecom.com</p>
              </div>
            </div>

            {/* Link to Admin */}
            <div className="pt-4">
              <Link
                to="/mehedy"
                className="w-full py-3 border-2 border-gray-200 hover:border-black rounded-2xl text-center text-xs font-black uppercase tracking-wider transition-all block text-gray-700 hover:text-black bg-white"
              >
                ADMIN WORKSPACE LOG IN
              </Link>
            </div>
          </div>
        )}

      </main>

      {/* 6. Sticky Premium Bottom Nav Bar matching precise icons from screenshot */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2 shadow-xl flex justify-around items-center z-50">
        <button 
          onClick={() => { setActiveTab('home'); setSelectedCategory(null); }}
          className={cn(
            "flex flex-col items-center gap-1 min-w-16 transition-all",
            activeTab === 'home' ? "text-orange-500 scale-105" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <Store size={20} />
          <span className="text-[9px] font-black uppercase tracking-tight">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('clips')}
          className={cn(
            "flex flex-col items-center gap-1 min-w-16 transition-all",
            activeTab === 'clips' ? "text-orange-500 scale-105" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <Film size={20} />
          <span className="text-[9px] font-black uppercase tracking-tight">Clips To Cart</span>
        </button>

        <button 
          onClick={() => { setActiveTab('home-appliances'); setSelectedCategory('Home Appliances'); }}
          className={cn(
            "flex flex-col items-center gap-1 min-w-16 transition-all",
            activeTab === 'home-appliances' ? "text-orange-500 scale-105" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <Tv size={20} />
          <span className="text-[9px] font-black uppercase tracking-tight">Home Appliance</span>
        </button>

        <button 
          onClick={() => setActiveTab('account')}
          className={cn(
            "flex flex-col items-center gap-1 min-w-16 transition-all",
            activeTab === 'account' ? "text-orange-500 scale-105" : "text-gray-400 hover:text-gray-600"
          )}
        >
          <User size={20} />
          <span className="text-[9px] font-black uppercase tracking-tight">Account</span>
        </button>
      </nav>

      {/* My Orders Modal overlay floating controller */}
      <Modal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        title="Active Order History"
      >
        <div className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-xs font-bold leading-relaxed">No tracked active orders found on this program profile yet.</p>
            </div>
          ) : (
            myOrders.map(order => (
              <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-xs sm:text-sm">{order.product_name}</p>
                  <p className="text-[10px] text-gray-400 font-mono">Order: {order.id.slice(0, 12)}...</p>
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase",
                  order.status === 'completed' ? "bg-green-100 text-green-700" :
                  order.status === 'deleted' ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                )}>
                  {order.status}
                </span>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* ==================== HIGH-FIDELITY SEARCH POPUP MODAL ==================== */}
      <Modal
        isOpen={isSearchPopupOpen}
        onClose={() => { setIsSearchPopupOpen(false); setSearchQuery(''); }}
        title="Search Products & Gadgets"
        className="max-w-xl bg-white text-slate-900"
      >
        <div className="space-y-6">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setSearchTerm(searchQuery);
              setIsSearchPopupOpen(false);
              // Switch category to null if we do a global search
              setSelectedCategory(null);
              if (activeTab !== 'home' && activeTab !== 'home-appliances') {
                setActiveTab('home');
              }
            }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold" size={18} />
            <input
              autoFocus
              type="text"
              placeholder="Search by product name, brand or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-16 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-gray-900 text-xs font-normal placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            />
            {searchQuery.trim() && (
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider rounded-lg transition-transform hover:scale-105"
              >
                Search
              </button>
            )}
          </form>

          {/* Dynamic "Suggestions" matching user constraints precisely */}
          <div className="space-y-3">
            <h5 className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
              {searchQuery.trim() ? "Search Suggestions Matching" : "Top Suggested Products for You"}
            </h5>

            <div className="space-y-2">
              {/* If query entered, filter local products. Otherwise suggest popular products */}
              {(searchQuery.trim() 
                ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase())) 
                : products.filter(p => p.quantity > 0).slice(0, 4)
              ).slice(0, 5).map((prod) => (
                <div 
                  key={prod.id}
                  onClick={() => {
                    setSelectedProduct(prod);
                    setIsSearchPopupOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors border border-dashed border-transparent hover:border-slate-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-white overflow-hidden p-0.5 border flex items-center justify-center shrink-0">
                    {prod.image_urls?.[0] ? (
                      <TelegramImage fileId={prod.image_urls[0]} className="w-full h-full object-contain rounded" />
                    ) : (
                      <Package size={16} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate leading-none mb-1">{prod.name}</p>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">{prod.brand}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-blue-600">৳{prod.selling_price.toLocaleString()}</p>
                    {prod.discount_price && prod.discount_price > 0 && (
                      <p className="text-[9px] text-red-500 line-through">৳{prod.discount_price.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}

              {searchQuery.trim() && products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.brand.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <p className="text-xs text-gray-500 italic py-2">No matching products found. Try another brand name.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* High-fidelity Product Details & Order Modal Overlay */}
      <Modal 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        title="Product Details & Direct Cash Order"
        className="max-w-2xl bg-white"
      >
        {selectedProduct && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
              <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/40 p-2 flex items-center justify-center">
                {selectedProduct.image_urls?.[0] ? (
                  <TelegramImage 
                    fileId={selectedProduct.image_urls[0]} 
                    className="w-full h-full object-contain rounded-2xl bg-white" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 bg-white rounded-2xl">
                    <Package size={64} />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-black rounded-xl uppercase tracking-wider">
                    {selectedProduct.brand}
                  </span>
                  {selectedProduct.ram && (
                    <span className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-black rounded-xl uppercase tracking-wider">
                      {selectedProduct.ram} RAM
                    </span>
                  )}
                  {selectedProduct.rom && (
                    <span className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-black rounded-xl uppercase tracking-wider">
                      {selectedProduct.rom} ROM
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{selectedProduct.name}</h2>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-blue-600">৳{selectedProduct.selling_price.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 font-extrabold uppercase">Cash Price</span>
                </div>

                {selectedProduct.description && (
                  <div className="pt-4 border-t border-gray-100">
                    <h5 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-2">Description</h5>
                    <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <h4 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3 mb-6">Confirm and Checkout</h4>
              <OrderForm 
                product={selectedProduct} 
                onClose={() => setSelectedProduct(null)} 
              />
            </div>
          </div>
        )}
      </Modal>

      {/* ==================== HIGH-FIDELITY CATEGORY SHOWCASE POPUP MODAL ==================== */}
      <Modal
        isOpen={!!categoryWithProductsModal}
        onClose={() => setCategoryWithProductsModal(null)}
        title={categoryWithProductsModal ? `${categoryWithProductsModal.name} Gallery` : "Category Products"}
        className="max-w-xl bg-white text-slate-900"
      >
        {categoryWithProductsModal && (
          <div className="space-y-6">
            {/* Header branding info banner inside popup modal */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100/60 border border-orange-200/40">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-2.5 shadow-sm border border-orange-100 shrink-0">
                {categoryWithProductsModal.image ? (
                  categoryWithProductsModal.image.startsWith('https') ? (
                    <img 
                      src={categoryWithProductsModal.image} 
                      alt="" 
                      className="w-full h-full object-contain rounded-full" 
                    />
                  ) : (
                    <TelegramImage 
                      fileId={categoryWithProductsModal.image} 
                      className="w-full h-full object-contain rounded-full" 
                    />
                  )
                ) : (
                  <span className="text-orange-500 font-extrabold text-2xl"></span>
                )}
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 leading-tight">
                  {categoryWithProductsModal.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1 font-semibold">
                  {products.filter(p => {
                    const pCat = getProductCategory(p) || '';
                    return pCat.trim().toLowerCase() === categoryWithProductsModal.name.trim().toLowerCase();
                  }).length} Exclusive Gadgets & Devices Available
                </p>
              </div>
            </div>

            {/* List products belong to category with precise, beautiful grid presentation */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {products.filter(p => {
                const pCat = getProductCategory(p) || '';
                return pCat.trim().toLowerCase() === categoryWithProductsModal.name.trim().toLowerCase();
              }).length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Package className="mx-auto text-slate-300 mb-2.5 animate-bounce" size={32} />
                  <p className="text-xs text-slate-500 font-bold">No items found in this section yet.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Please check again later or visit other catalogs.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {products.filter(p => {
                    const pCat = getProductCategory(p) || '';
                    return pCat.trim().toLowerCase() === categoryWithProductsModal.name.trim().toLowerCase();
                  }).map((prod) => (
                    <div 
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        // Open product details and keep the search path fluid
                      }}
                      className="bg-white rounded-2xl border border-gray-100 hover:border-orange-500 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col cursor-pointer p-2 text-left relative group font-sans"
                    >
                      {/* Image Frame */}
                      <div className="aspect-square rounded-xl bg-slate-50 p-1 mb-2 relative overflow-hidden flex items-center justify-center">
                        {prod.image_urls?.[0] ? (
                          <TelegramImage fileId={prod.image_urls[0]} className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300 bg-white" />
                        ) : (
                          <Package size={20} className="text-slate-200" />
                        )}

                        <span className={cn(
                          "absolute bottom-1 right-1 px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-wider shadow-sm",
                          prod.quantity > 0 ? "bg-white text-blue-600" : "bg-red-500 text-white"
                        )}>
                          {prod.quantity > 0 ? 'In Stock' : 'Out'}
                        </span>
                      </div>

                      {/* Info lines */}
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider leading-none mb-1">
                        {prod.brand}
                      </span>
                      <p className="text-xs font-bold text-gray-900 line-clamp-1 group-hover:text-orange-500 transition-colors leading-tight mb-1.5">
                        {prod.name}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {prod.ram && (
                          <span className="text-[7px] font-bold bg-slate-100 px-1 py-0.5 rounded text-gray-500">
                            {prod.ram}
                          </span>
                        )}
                        {prod.rom && (
                          <span className="text-[7px] font-bold bg-slate-100 px-1 py-0.5 rounded text-gray-500">
                            {prod.rom}
                          </span>
                        )}
                      </div>

                      {/* Pricing Tag */}
                      <div className="mt-auto pt-1 flex items-baseline justify-between border-t border-slate-50">
                        <span className="text-xs font-black text-blue-600">
                          ৳{prod.selling_price.toLocaleString()}
                        </span>
                        {prod.discount_price && prod.discount_price > 0 && (
                          <span className="text-[9px] text-gray-400 line-through">
                            ৳{prod.discount_price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Action close button */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setCategoryWithProductsModal(null)}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all shadow"
              >
                Close Catalog View
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
