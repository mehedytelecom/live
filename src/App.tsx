import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './firebase';
import AdminDashboard from './components/AdminDashboard';
import CustomerShop from './components/CustomerShop';
import EMICalculator from './components/EMICalculator';

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Enforce authorized administrator email filter
  if (!user || user.email !== 'mehedyhossain160619@gmail.com') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="bg-orange-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-orange-500/20">
            <LayoutDashboard className="text-orange-500 animate-pulse" size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Admin Gateway</h2>
            <p className="text-xs text-slate-400">Authorized personnel only. Please verify your Google administrator identity to gain server access.</p>
          </div>
          <button 
            type="button"
            onClick={handleLogin}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Sign in with Google
          </button>
          <Link to="/live" className="block text-xs font-bold text-orange-400 hover:underline hover:text-orange-300 transition-colors uppercase tracking-widest">
            Back to Customer Store
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/live" replace />} />
        <Route path="/live" element={<CustomerShop />} />
        <Route path="/live/emi-calculator" element={<EMICalculator />} />
        <Route path="/emi-calculator" element={<Navigate to="/live/emi-calculator" replace />} />
        
        <Route path="/mehedy" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/mehedy/inventory" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/mehedy/sales" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/mehedy/orders" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
      </Routes>
    </Router>
  );
}
