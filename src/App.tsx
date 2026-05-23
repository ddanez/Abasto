import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  CreditCard,
  Contact2,
  Sparkles,
  RefreshCw,
  Coins,
  Receipt,
  RotateCcw,
  Sliders,
  Menu,
  X
} from 'lucide-react';

import { Product, Customer, Provider, Sale, Purchase, CxcInvoice, CxpInvoice, ExchangeRate, CompanyConfig } from './types';
import CurrencyModal from './components/CurrencyModal';
import Dashboard from './components/Dashboard';
import ProductsModule from './components/ProductsModule';
import SalesModule from './components/SalesModule';
import PurchasesModule from './components/PurchasesModule';
import CxcCxpModule from './components/CxcCxpModule';
import ContactsModule from './components/ContactsModule';
import CompanyConfigModule from './components/CompanyConfigModule';
import LoginModule from './components/LoginModule';

// Let's intercept standard fetch, appending user sessions info to headers automatically!
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
  const userJson = localStorage.getItem('abasto_user');
  const user = userJson ? JSON.parse(userJson) : null;
  if (user && typeof url === 'string' && url.startsWith('/api')) {
    const headers = new Headers(options.headers || {});
    headers.set('x-user-username', user.username);
    headers.set('x-user-name', user.name);
    options.headers = headers;
  }
  return originalFetch(url, options);
};

export default function App() {
  const [activeUser, setActiveUser] = useState<{ id: string; username: string; name: string; role: string } | null>(() => {
    const userJson = localStorage.getItem('abasto_user');
    return userJson ? JSON.parse(userJson) : null;
  });

  const [rates, setRates] = useState<ExchangeRate>({ usdToVes: 0, usdToCop: 0, date: '' });
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [cxc, setCxc] = useState<CxcInvoice[]>([]);
  const [cxp, setCxp] = useState<CxpInvoice[]>([]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'sales' | 'purchases' | 'cxccxp' | 'contacts' | 'config'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [showConfigRateModal, setShowConfigRateModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>({
    name: 'Súper Abasto Familiar',
    emoji: '🥦',
    document: 'J-12345678-0',
    phone: '0414-0001122',
    address: 'Av. Principal, Sector Centro, Caracas',
    footerText: '¡Gracias por preferirnos! Guarde su comprobante.'
  });

  const menuItems = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'sales', label: 'Caja / Ventas', icon: ShoppingCart },
    { id: 'purchases', label: 'Compras / Stock', icon: Truck },
    { id: 'cxccxp', label: 'Deudas (CxC/CxP)', icon: CreditCard },
    { id: 'contacts', label: 'Clientes y Proveedores', icon: Contact2 },
    { id: 'config', label: 'Configuración Empresa', icon: Sliders },
  ] as const;

  const renderNavLinks = (onItemClick?: () => void) => {
    return (
      <div className="space-y-1.5 animate-fade-in">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (onItemClick) onItemClick();
              }}
              style={{ minHeight: '44px' }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                isActive 
                  ? 'bg-green-50 text-green-700 font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 font-medium'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-green-600' : 'text-slate-400'} />
              {item.label}
            </button>
          );
        })}
      </div>
    );
  };

  // Fetch complete database state
  const fetchDb = async () => {
    try {
      const res = await fetch('/api/db');
      const data = await res.json();
      if (data) {
        setProducts(data.products || []);
        setCustomers(data.customers || []);
        setProviders(data.providers || []);
        setSales(data.sales || []);
        setPurchases(data.purchases || []);
        setCxc(data.cxc || []);
        setCxp(data.cxp || []);
        if (data.companyConfig) {
          setCompanyConfig(data.companyConfig);
        }
        if (data.rates) {
          setRates(data.rates);
          // If rates are loaded but is 0, we must ask the user to enter them
          if (data.rates.usdToVes === 0 || data.rates.usdToCop === 0) {
            setShowConfigRateModal(true);
          } else {
            setShowConfigRateModal(false);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching database", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDb();
  }, []);

  // Update exchange rates
  const handleRatesSubmit = async (ves: number, cop: number) => {
    try {
      const res = await fetch('/api/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usdToVes: ves, usdToCop: cop })
      });
      const data = await res.json();
      if (data && data.rates) {
        setRates(data.rates);
        setShowConfigRateModal(false);
      }
    } catch (err) {
      alert("Error estableciendo cotizaciones. Inténtelo de nuevo.");
      console.error(err);
    }
  };

  // Company config update actions
  const handleUpdateCompanyConfig = async (newConfig: CompanyConfig) => {
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        const updated = await res.json();
        setCompanyConfig(updated);
      } else {
        throw new Error('Error al actualizar la configuración de la empresa');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Products actions
  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        await fetchDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        await fetchDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDb();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Contacts actions (Customers/Providers)
  const handleAddCustomer = async (custData: Omit<Customer, 'id'>) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(custData)
      });
      if (res.ok) {
        const data = await res.json();
        await fetchDb();
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCustomer = async (id: string, custData: Partial<Customer>) => {
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(custData)
      });
      if (res.ok) await fetchDb();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProvider = async (pData: Omit<Provider, 'id'>) => {
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pData)
      });
      if (res.ok) {
        const data = await res.json();
        await fetchDb();
        return data;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProvider = async (id: string, pData: Partial<Provider>) => {
    try {
      const res = await fetch(`/api/providers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pData)
      });
      if (res.ok) await fetchDb();
    } catch (err) {
      console.error(err);
    }
  };

  // Sales Point Action
  const handleRecordSale = async (saleData: any) => {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });
    if (!res.ok) {
      const errRes = await res.json();
      throw new Error(errRes.error || 'Error processing sales checkout');
    }
    const savedSale = await res.json();
    await fetchDb();
    return savedSale;
  };

  // Procurement Action
  const handleRecordPurchase = async (purchaseData: any) => {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData)
    });
    if (!res.ok) {
      const errRes = await res.json();
      throw new Error(errRes.error || 'Error recording order');
    }
    const savedPurchase = await res.json();
    await fetchDb();
    return savedPurchase;
  };

  const handleEditSale = async (id: string, saleData: any) => {
    const res = await fetch(`/api/sales/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    });
    if (!res.ok) {
      const errRes = await res.json();
      throw new Error(errRes.error || 'Error al actualizar la venta');
    }
    await fetchDb();
  };

  const handleDeleteSale = async (id: string) => {
    const res = await fetch(`/api/sales/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const errRes = await res.json();
      throw new Error(errRes.error || 'Error al eliminar la venta');
    }
    await fetchDb();
  };

  const handleEditPurchase = async (id: string, purchaseData: any) => {
    const res = await fetch(`/api/purchases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchaseData)
    });
    if (!res.ok) {
      const errRes = await res.json();
      throw new Error(errRes.error || 'Error al actualizar la compra');
    }
    await fetchDb();
  };

  const handleDeletePurchase = async (id: string) => {
    const res = await fetch(`/api/purchases/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const errRes = await res.json();
      throw new Error(errRes.error || 'Error al eliminar la compra');
    }
    await fetchDb();
  };

  // Debt Payments Action (CxC/CxP)
  const handlePayCxc = async (id: string, amountUsd: number, method: 'cash' | 'transfer', reference?: string) => {
    const res = await fetch(`/api/cxc/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountUsd, paymentMethod: method, reference })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Err payments');
    }
    await fetchDb();
  };

  const handlePayCxp = async (id: string, amountUsd: number, method: 'cash' | 'transfer', reference?: string) => {
    const res = await fetch(`/api/cxp/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amountUsd, paymentMethod: method, reference })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Err payments');
    }
    await fetchDb();
  };

  // System Database factory reset
  const handleFactoryReset = async () => {
    if (confirm('⚠ ATENCIÓN: ¿Seguro que deseas restablecer la base de datos de fábrica? Se borrarán todas las transacciones históricas registradas.')) {
      try {
        const res = await fetch('/api/reset-db', { method: 'POST' });
        if (res.ok) {
          alert('Sistema restaurado correctamente.');
          await fetchDb();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleLogout = () => {
    if (confirm('¿Desea cerrar la sesión activa actual?')) {
      localStorage.removeItem('abasto_user');
      setActiveUser(null);
    }
  };

  if (!activeUser) {
    return <LoginModule onLoginSuccess={(u) => setActiveUser(u)} companyConfig={companyConfig} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 flex items-center gap-3 animate-pulse">
          <RefreshCw className="text-emerald-500 animate-spin" size={24} />
          <span className="font-bold text-slate-700">Cargando base de datos segura y cotizaciones del día...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-800 flex flex-col">
      {/* Exchange rates block indicator if they have been set */}
      {showConfigRateModal && (
        <CurrencyModal onRatesSubmit={handleRatesSubmit} currentRates={rates} />
      )}

      {/* MOBILE COLLAPSIBLE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop with transition */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          />
          {/* Sliding menu panel */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl flex flex-col justify-between p-6 z-55 animate-slide-right">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{companyConfig.emoji}</span>
                  <span className="font-extrabold text-xs text-slate-805 tracking-tight uppercase">{companyConfig.name}</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer"
                  title="Cerrar menú"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation links */}
              {renderNavLinks(() => setMobileMenuOpen(false))}
            </div>

            {/* Bottom Admin block */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="bg-slate-900 text-white rounded-2xl p-4 text-left font-sans">
                <p className="text-[9px] opacity-65 mb-0.5 uppercase font-bold tracking-widest">{activeUser.role}</p>
                <p className="text-xs font-bold text-slate-100 leading-snug">{activeUser.name}</p>
                <p className="text-[9px] font-mono opacity-40">@{activeUser.username}</p>
                <div className="h-px bg-white/10 my-1.5"></div>
                <div className="flex items-center justify-between text-[9px] text-slate-405 font-mono">
                  <span>Estatus</span>
                  <span className="text-emerald-400 font-semibold">Conectado ●</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{ minHeight: '32px' }}
                className="w-full text-center py-2 border border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-xl text-slate-500 font-bold transition-all text-[11px] cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 h-16 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Mobile hamburger button & Brand/Store info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all cursor-pointer"
              title="Abrir menú"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('config')} title="Ir a Configuración">
              {companyConfig.logoBase64 ? (
                <img src={companyConfig.logoBase64} alt="Logo" className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shrink-0 shadow-md" />
              ) : (
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-green-100 shrink-0">
                  {companyConfig.emoji}
                </div>
              )}
              <div>
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-850 uppercase leading-none">{companyConfig.name}</h1>
                <p className="hidden md:block text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1.5 font-sans">Gestión Integrada • Víveres y Abasto</p>
              </div>
            </div>
          </div>

          {/* Real-time details rates indicator */}
          <div className="flex items-center gap-2.5">
            {rates.usdToVes > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* VES Rate indicator */}
                <div className="flex items-center gap-1.5 bg-amber-50 px-2 sm:px-3 py-1.5 rounded-lg border border-amber-100">
                  <span className="text-[8px] sm:text-[10px] font-bold text-amber-700 uppercase tracking-tighter">VES</span>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-750">Bs.{rates.usdToVes.toFixed(2)}</span>
                </div>
                {/* COP Rate indicator */}
                <div className="flex items-center gap-1.5 bg-blue-50 px-2 sm:px-3 py-1.5 rounded-lg border border-blue-100">
                  <span className="text-[8px] sm:text-[10px] font-bold text-blue-700 uppercase tracking-tighter">COP</span>
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-755">${rates.usdToCop.toLocaleString('es-CO')}</span>
                </div>
                <button
                  onClick={() => setShowConfigRateModal(true)}
                  className="text-[9px] sm:text-[10px] text-green-600 font-bold underline hover:text-green-700 transition cursor-pointer"
                  title="Cambiar cotización actual"
                >
                  (Ajustar)
                </button>
              </div>
            )}

            <button
              onClick={handleFactoryReset}
              className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-all border border-slate-200 text-xs flex items-center gap-1 cursor-pointer"
              title="Restaurar base de datos"
              style={{ minHeight: '32px' }}
            >
              <RotateCcw size={12} />
              <span className="text-[10px] font-semibold hidden sm:inline">Caja</span>
            </button>
          </div>
        </div>
      </header>

      {/* VIEWPORT LAYOUT WRAPPER */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6 bg-slate-50/50">
        
        {/* SIDEBAR NAVIGATION (Desktop) */}
        <aside className="lg:w-64 shrink-0 lg:block hidden">
          <nav className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-1.5 sticky top-24 flex flex-col justify-between min-h-[460px]">
            {renderNavLinks()}

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <div className="bg-slate-900 text-white rounded-2xl p-4 text-left font-sans">
                <p className="text-[9px] opacity-65 mb-0.5 uppercase font-bold tracking-widest">{activeUser.role}</p>
                <p className="text-xs font-bold text-slate-100 leading-snug">{activeUser.name}</p>
                <p className="text-[9px] font-mono opacity-40">@{activeUser.username}</p>
                <div className="h-px bg-white/10 my-1.5"></div>
                <div className="flex items-center justify-between text-[9px] text-slate-405 font-mono">
                  <span>Estatus</span>
                  <span className="text-emerald-400 font-semibold">Conectado ●</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{ minHeight: '32px' }}
                className="w-full text-center py-2 border border-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 rounded-xl text-slate-500 font-bold transition-all text-[11px] cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>

          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard
              products={products}
              sales={sales}
              purchases={purchases}
              cxc={cxc}
              cxp={cxp}
              rates={rates}
              onRefresh={fetchDb}
            />
          )}

          {activeTab === 'inventory' && (
            <ProductsModule
              products={products}
              rates={rates}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'sales' && (
            <SalesModule
              products={products}
              customers={customers}
              rates={rates}
              companyConfig={companyConfig}
              onRecordSale={handleRecordSale}
              onAddCustomer={handleAddCustomer}
              sales={sales}
              onEditSale={handleEditSale}
              onDeleteSale={handleDeleteSale}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesModule
              products={products}
              providers={providers}
              rates={rates}
              onRecordPurchase={handleRecordPurchase}
              onAddProvider={handleAddProvider}
              purchases={purchases}
              onEditPurchase={handleEditPurchase}
              onDeletePurchase={handleDeletePurchase}
            />
          )}

          {activeTab === 'cxccxp' && (
            <CxcCxpModule
              cxc={cxc}
              cxp={cxp}
              rates={rates}
              onPayCxc={handlePayCxc}
              onPayCxp={handlePayCxp}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsModule
              customers={customers}
              providers={providers}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onAddProvider={handleAddProvider}
              onUpdateProvider={handleUpdateProvider}
            />
          )}

          {activeTab === 'config' && (
            <CompanyConfigModule
              config={companyConfig}
              onUpdateConfig={handleUpdateCompanyConfig}
            />
          )}
        </main>

      </div>

      <footer className="bg-white border-t border-slate-150 py-4 mt-auto text-center">
        <div className="max-w-7xl mx-auto px-4 text-[11px] text-slate-400 font-medium">
          FJPM & AI © 2026. Todos los derechos reservados. Sistema administrativo local de alta seguridad
        </div>
      </footer>
    </div>
  );
}
