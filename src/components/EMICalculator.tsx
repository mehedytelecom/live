import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { ChevronLeft, ChevronDown, Info, CreditCard, Calendar, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function EMICalculator() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedDownPayment, setSelectedDownPayment] = useState<number>(0);
  const [selectedTerm, setSelectedTerm] = useState<number>(6);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('created_at', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      if (prods.length > 0 && !selectedBrand) {
        setSelectedBrand(prods[0].brand);
      }
    });
    return () => unsubscribe();
  }, []);

  const brands = Array.from(new Set(products.map(p => p.brand))).filter(Boolean);
  const filteredProducts = products.filter(p => p.brand === selectedBrand);

  useEffect(() => {
    if (filteredProducts.length > 0 && !selectedProduct) {
      setSelectedProduct(filteredProducts[0]);
    } else if (selectedProduct && selectedProduct.brand !== selectedBrand) {
      setSelectedProduct(filteredProducts[0] || null);
    }
  }, [selectedBrand, filteredProducts]);

  useEffect(() => {
    if (selectedProduct) {
      setSelectedDownPayment(selectedProduct.emi_down_payment);
      setSelectedTerm(selectedProduct.emi_months);
    }
  }, [selectedProduct]);

  const platformFee = 1500; // Example fee from screenshot
  const digitalDataEntry = 25;
  const digitalDataProcessing = 140;
  const prepayment = 700;
  const itAssistanceFeePerMonth = 280;

  const orderAmount = (selectedProduct?.selling_price || 0) + platformFee;
  const onSitePayment = selectedDownPayment + digitalDataEntry + digitalDataProcessing + prepayment;
  const loanAmount = orderAmount - selectedDownPayment;
  
  // Simple calculation for monthly payment based on screenshot logic
  // Total Outstanding = Loan Amount + (IT Assistance * Terms) + Interest/Profit
  const totalITAssistance = itAssistanceFeePerMonth * selectedTerm;
  const emiProfit = selectedProduct?.emi_profit || 0;
  const totalOutstanding = loanAmount + totalITAssistance + emiProfit;
  const monthlyPayment = Math.ceil(totalOutstanding / selectedTerm);

  const downPaymentOptions = selectedProduct ? [
    selectedProduct.emi_down_payment,
    selectedProduct.emi_down_payment + 1000,
    selectedProduct.emi_down_payment + 3000,
    selectedProduct.emi_down_payment + 6000,
  ] : [];

  const termOptions = [4, 6, 12];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-4 h-14 flex items-center gap-4">
        <Link to="/live" className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-gray-900" />
        </Link>
        <h1 className="text-lg font-bold text-gray-900 flex-1">Product Price Center</h1>
        <button className="text-sm font-medium text-gray-600">Price List</button>
      </header>

      <div className="p-4 space-y-6">
        {/* Brand Selection */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Select Brand</h2>
          <div className="flex flex-wrap gap-2">
            {brands.map(brand => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-sm font-bold transition-all relative overflow-hidden border-2",
                  selectedBrand === brand 
                    ? "bg-blue-50 border-blue-600 text-blue-600" 
                    : "bg-white border-transparent text-gray-600 shadow-sm"
                )}
              >
                {brand}
                {selectedBrand === brand && (
                  <div className="absolute top-0 right-0 w-4 h-4 bg-blue-600 flex items-center justify-center rounded-bl-lg">
                    <div className="w-1.5 h-2.5 border-r-2 border-b-2 border-white rotate-45 -mt-0.5" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Model Selection */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Select Model</h2>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between group cursor-pointer">
              <div>
                <h3 className="text-blue-900 font-bold text-lg">{selectedProduct?.name || 'Select a product'}</h3>
                <p className="text-orange-500 font-black text-lg mt-1">TK {selectedProduct?.selling_price.toLocaleString() || '0'}</p>
              </div>
              <ChevronDown size={24} className="text-gray-400" />
            </div>
          </div>
        </section>

        {/* Loan Service Banner */}
        <div className="bg-white border-y border-dashed border-gray-200 py-3 flex items-center justify-center gap-2 text-gray-600 text-sm font-medium">
          <CreditCard size={16} />
          Loan Service Provided by Mehedy Telecom
        </div>

        {/* Down Payment Selection */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Down Payment</h2>
          <div className="grid grid-cols-2 gap-3">
            {downPaymentOptions.map(amount => (
              <button
                key={amount}
                onClick={() => setSelectedDownPayment(amount)}
                className={cn(
                  "py-3 rounded-lg text-sm font-bold transition-all border-2",
                  selectedDownPayment === amount 
                    ? "bg-blue-50 border-blue-600 text-blue-600" 
                    : "bg-white border-transparent text-gray-600 shadow-sm"
                )}
              >
                TK {amount.toLocaleString()}
              </button>
            ))}
          </div>
        </section>

        {/* Payment Term */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Payment Term</h2>
          <div className="grid grid-cols-2 gap-3">
            {termOptions.map(term => (
              <button
                key={term}
                onClick={() => setSelectedTerm(term)}
                className={cn(
                  "py-3 rounded-lg text-sm font-bold transition-all border-2",
                  selectedTerm === term 
                    ? "bg-blue-50 border-blue-600 text-blue-600" 
                    : "bg-white border-transparent text-gray-600 shadow-sm"
                )}
              >
                {term} terms
              </button>
            ))}
          </div>
        </section>

        {/* Repayment Options */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Repayment Options</h2>
          <button className="px-8 py-2.5 rounded-lg text-sm font-bold bg-blue-50 border-2 border-blue-600 text-blue-600 relative overflow-hidden">
            By Month
            <div className="absolute top-0 right-0 w-4 h-4 bg-blue-600 flex items-center justify-center rounded-bl-lg">
              <div className="w-1.5 h-2.5 border-r-2 border-b-2 border-white rotate-45 -mt-0.5" />
            </div>
          </button>
        </section>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between" onClick={() => setShowDetails(!showDetails)}>
              <span className="text-gray-900 font-bold flex items-center gap-1">
                Order Amount
                <ChevronDown size={16} className={cn("transition-transform", showDetails && "rotate-180")} />
              </span>
              <span className="text-blue-900 font-black">TK {orderAmount.toLocaleString()}</span>
            </div>
            
            {showDetails && (
              <div className="space-y-2 pl-4 border-l-2 border-gray-100">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Phone Price</span>
                  <span>TK {selectedProduct?.selling_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Platform Service Fee</span>
                  <span>TK {platformFee.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-900 font-bold flex items-center gap-1">
                On-site Payment
                <ChevronDown size={16} />
              </span>
              <span className="text-blue-900 font-black">TK {onSitePayment.toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Loan Amount</span>
              <span className="text-blue-900 font-black">TK {loanAmount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Monthly Payment</span>
              <span className="text-blue-900 font-black">TK {monthlyPayment.toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Total Outstanding</span>
              <span className="text-blue-900 font-black">TK {totalOutstanding.toLocaleString()}</span>
            </div>
          </div>

          {/* Repayment Plan Table */}
          <div className="bg-gray-50 p-4">
            <h3 className="text-lg font-black text-gray-900 mb-4">Repayment Plan</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Period</th>
                    <th className="pb-3">Balance</th>
                    <th className="pb-3">Principal</th>
                    <th className="pb-3">IT Assistance</th>
                    <th className="pb-3 text-right">Due Amount</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 font-medium">
                  {Array.from({ length: selectedTerm }).map((_, i) => {
                    const period = i + 1;
                    const principalPerMonth = Math.floor((loanAmount + emiProfit) / selectedTerm);
                    const currentBalance = totalOutstanding - (period - 1) * monthlyPayment;
                    const isLast = period === selectedTerm;
                    
                    return (
                      <tr key={period} className="border-t border-gray-200">
                        <td className="py-3">{period}</td>
                        <td className="py-3">{currentBalance.toLocaleString()}</td>
                        <td className="py-3">{principalPerMonth.toLocaleString()}</td>
                        <td className="py-3">{itAssistanceFeePerMonth.toLocaleString()}</td>
                        <td className="py-3 text-right font-bold text-blue-600">
                          {isLast ? (totalOutstanding - (selectedTerm - 1) * monthlyPayment).toLocaleString() : monthlyPayment.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between z-50">
        <div>
          <p className="text-xs text-gray-400 font-bold uppercase">Monthly Payment</p>
          <p className="text-xl font-black text-blue-600">TK {monthlyPayment.toLocaleString()}</p>
        </div>
        <button className="bg-blue-600 text-white px-10 py-3 rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
          Apply Now
        </button>
      </div>
    </div>
  );
}
