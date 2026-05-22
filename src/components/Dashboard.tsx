import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  CircleDollarSign,
  ArrowUpRight,
  ArrowDownRight,
  PackageCheck,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  CalendarDays
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  PieChart,
  Pie
} from 'recharts';
import { Product, Sale, Purchase, CxcInvoice, CxpInvoice, ExchangeRate } from '../types';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  cxc: CxcInvoice[];
  cxp: CxpInvoice[];
  rates: ExchangeRate;
  onRefresh: () => void;
}

export default function Dashboard({ products, sales, purchases, cxc, cxp, rates, onRefresh }: DashboardProps) {
  const [timeRange, setTimeRange] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [activeCurrency, setActiveCurrency] = useState<'USD' | 'VES' | 'COP'>('USD');

  // Convert USD money to the active currency
  const formatMoney = (usdValue: number) => {
    if (activeCurrency === 'VES') {
      const bsf = usdValue * rates.usdToVes;
      return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(bsf);
    } else if (activeCurrency === 'COP') {
      const cop = usdValue * rates.usdToCop;
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cop);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdValue);
  };

  // Convert helper
  const conversionRateLabel = () => {
    return `Tasas: 1 USD = Bs. ${rates.usdToVes.toFixed(2)} | COP $${rates.usdToCop.toLocaleString('es-CO')}`;
  };

  // Filter lists based on time range
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return sales.filter(s => {
      const sDate = new Date(s.date);
      if (timeRange === 'today') {
        return s.date.includes(todayStr);
      } else if (timeRange === 'week') {
        return sDate >= sevenDaysAgo;
      } else if (timeRange === 'month') {
        return sDate >= thirtyDaysAgo;
      }
      return true;
    });
  }, [sales, timeRange]);

  const filteredPurchases = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    return purchases.filter(p => {
      const pDate = new Date(p.date);
      if (timeRange === 'today') {
        return p.date.includes(todayStr);
      } else if (timeRange === 'week') {
        return pDate >= sevenDaysAgo;
      } else if (timeRange === 'month') {
        return pDate >= thirtyDaysAgo;
      }
      return true;
    });
  }, [purchases, timeRange]);

  // Compute stats
  const stats = useMemo(() => {
    // 1. Total sales and purchases
    const totalSalesUsd = filteredSales.reduce((acc, s) => acc + s.totalUsd, 0);
    const totalPurchasesUsd = filteredPurchases.reduce((acc, p) => acc + p.totalUsd, 0);

    // 2. Cost of goods sold (COGS) to calculate real gross profit
    let costOfGoodsSoldUsd = 0;
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        // Find matching product cost
        const prod = products.find(p => p.id === item.productId);
        const unitCost = prod ? prod.costUsd : item.priceUsd * 0.6; // fallback 60% of price
        costOfGoodsSoldUsd += unitCost * item.quantity;
      });
    });
    const grossProfitUsd = totalSalesUsd - costOfGoodsSoldUsd;

    // 3. Outstanding credit balances (all active, not just filtered by date)
    const cxcTotalPendingUsd = cxc.reduce((acc, item) => {
      if (item.status === 'pendiente') return acc + item.remainingBalanceUsd;
      return acc;
    }, 0);

    const cxpTotalPendingUsd = cxp.reduce((acc, item) => {
      if (item.status === 'pendiente') return acc + item.remainingBalanceUsd;
      return acc;
    }, 0);

    // 4. Warehouse asset values
    const inventoryValueCostUsd = products.reduce((acc, p) => acc + (p.stock * p.costUsd), 0);
    const inventoryValueSaleUsd = products.reduce((acc, p) => acc + (p.stock * p.priceUsd), 0);
    const projectedProfitUsd = inventoryValueSaleUsd - inventoryValueCostUsd;

    // 5. Low stock alert count
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

    return {
      totalSalesUsd,
      totalPurchasesUsd,
      grossProfitUsd,
      cxcTotalPendingUsd,
      cxpTotalPendingUsd,
      inventoryValueCostUsd,
      inventoryValueSaleUsd,
      projectedProfitUsd,
      lowStockCount
    };
  }, [filteredSales, filteredPurchases, products, cxc, cxp]);

  // Chart 1: Sales / Purchases trend over time
  // Group by date
  const trendData = useMemo(() => {
    const datesMap: { [dateKey: string]: { date: string; ventas: number; compras: number } } = {};

    // Get range of dates
    const formatLabel = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    };

    // Sort original lists
    const sortedSales = [...filteredSales].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const sortedPurchases = [...filteredPurchases].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedSales.forEach(sale => {
      const label = formatLabel(sale.date);
      if (!datesMap[label]) datesMap[label] = { date: label, ventas: 0, compras: 0 };
      datesMap[label].ventas += sale.totalUsd;
    });

    sortedPurchases.forEach(pur => {
      const label = formatLabel(pur.date);
      if (!datesMap[label]) datesMap[label] = { date: label, ventas: 0, compras: 0 };
      datesMap[label].compras += pur.totalUsd;
    });

    // Convert to Array
    const result = Object.values(datesMap);
    if (result.length === 0) {
      return [
        { date: 'Sin datos', ventas: 0, compras: 0 }
      ];
    }
    return result;
  }, [filteredSales, filteredPurchases]);

  // Chart 2: Inventory breakdown by Category
  const categoryData = useMemo(() => {
    const categories = {
      viveres: { name: 'Víveres 🫓', value: 0, count: 0 },
      frutas: { name: 'Frutas 🍎', value: 0, count: 0 },
      verduras: { name: 'Verduras 🥕', value: 0, count: 0 }
    };

    products.forEach(p => {
      if (categories[p.category]) {
        categories[p.category].value += p.stock * p.priceUsd;
        categories[p.category].count += p.stock;
      }
    });

    return Object.values(categories);
  }, [products]);

  // Chart colors
  const COLORS = ['#8884d8', '#ff7300', '#0088fe'];

  return (
    <div id="dashboard-module" className="space-y-6">
      {/* Upper header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            📊 Resumen Financiero en Tiempo Real
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">{conversionRateLabel()}</p>
        </div>

        {/* Currency selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Calendar Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${timeRange === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Todo
            </button>
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${timeRange === 'today' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Hoy
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${timeRange === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Últimos 7d
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${timeRange === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Este Mes
            </button>
          </div>

          {/* Currency Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveCurrency('USD')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeCurrency === 'USD' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              USD ($)
            </button>
            <button
              onClick={() => setActiveCurrency('VES')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeCurrency === 'VES' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              VES (Bs)
            </button>
            <button
              onClick={() => setActiveCurrency('COP')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeCurrency === 'COP' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              COP ($)
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all border border-slate-200"
            title="Refrescar datos"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Grid of Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Sales */}
        <div id="kpi-sales" className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ventas de Período</span>
            <span className="text-2xl font-black text-slate-800 block">{formatMoney(stats.totalSalesUsd)}</span>
            <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
              <TrendingUp size={12} /> {filteredSales.length} transacciones
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-all">
            <ArrowUpRight size={22} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* KPI: Purchases */}
        <div id="kpi-purchases" className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Compras / Inversión</span>
            <span className="text-2xl font-black text-slate-800 block">{formatMoney(stats.totalPurchasesUsd)}</span>
            <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
              <ShoppingBag size={12} /> {filteredPurchases.length} compras de inventario
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl group-hover:scale-110 transition-all">
            <ArrowDownRight size={22} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        {/* KPI: Profit */}
        <div id="kpi-profit" className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ganancia Bruta Real</span>
            <span className={`text-2xl font-black block ${stats.grossProfitUsd >= 0 ? 'text-teal-600' : 'text-rose-600'}`}>
              {formatMoney(stats.grossProfitUsd)}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
              Margen: {stats.totalSalesUsd > 0 ? ((stats.grossProfitUsd / stats.totalSalesUsd) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl group-hover:scale-110 transition-all">
            <CircleDollarSign size={22} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500"></div>
        </div>

        {/* KPI: Stock Alarms */}
        <div id="kpi-stock-alert" className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Alertas de Stock Especial</span>
            <span className="text-2xl font-black text-slate-800 block">{stats.lowStockCount} ítems</span>
            {stats.lowStockCount > 0 ? (
              <span className="text-xs text-red-500 font-bold flex items-center gap-1 animate-pulse">
                <AlertTriangle size={12} /> Stock por debajo del mínimo!
              </span>
            ) : (
              <span className="text-xs text-blue-500 font-semibold flex items-center gap-1">
                <PackageCheck size={12} /> Todo abastecido perfectamente
              </span>
            )}
          </div>
          <div className={`p-3 rounded-2xl group-hover:scale-110 transition-all ${stats.lowStockCount > 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
            <AlertTriangle size={22} />
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${stats.lowStockCount > 0 ? 'bg-red-500':'bg-blue-500'}`}></div>
        </div>
      </div>

      {/* Credit & Inventory Valorization Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* accounts cxc / cxp statuses */}
        <div id="kpi-balance-credits" className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-400" />
              Saldos en Cartera de Deuda
            </h3>
            <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase tracking-widest font-mono">Cartera</span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
              <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider block">Clientes Deben (CxC)</span>
              <span className="text-xl font-bold text-white block mt-1">{formatMoney(stats.cxcTotalPendingUsd)}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Créditos de venta otorgados</span>
            </div>

            <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
              <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider block">Proveedores Debemos (CxP)</span>
              <span className="text-xl font-bold text-white block mt-1">{formatMoney(stats.cxpTotalPendingUsd)}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Créditos de inventario pendientes</span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xs text-indigo-200">
            <span>Efectividad en cobro:</span>
            <span className="font-bold text-white">
              {stats.totalSalesUsd > 0 ? (((stats.totalSalesUsd - stats.cxcTotalPendingUsd) / stats.totalSalesUsd) * 100).toFixed(1) : 100}% de contado
            </span>
          </div>
        </div>

        {/* stock valuation */}
        <div id="kpi-inventory-valuation" className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              🥦 Valorización del Almacén Actual
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
              {products.length} productos registrados
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs text-slate-500 font-bold block">Valor de Costo</span>
              <span className="text-xl font-black text-slate-800 block mt-1">{formatMoney(stats.inventoryValueCostUsd)}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Dinero invertido en mercancía</span>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
              <span className="text-xs text-emerald-800 font-bold block">Valor de Venta Neto</span>
              <span className="text-xl font-black text-emerald-600 block mt-1">{formatMoney(stats.inventoryValueSaleUsd)}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Si vendiera todo el inventario</span>
            </div>

            <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
              <span className="text-xs text-teal-800 font-bold block">Ganancia Proyectada</span>
              <span className="text-xl font-black text-teal-600 block mt-1">{formatMoney(stats.projectedProfitUsd)}</span>
              <span className="text-[11px] text-slate-400 block mt-1">Retorno neto estimado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Graphical Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Sales vs Cost Purchases) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Historial de Flujo de Operaciones (USD)</h4>
          <div className="h-64 cursor-pointer">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, '']} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="ventas" name="Ventas Registradas" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="compras" name="Inversión Compras" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorPurchases)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category distribution pie chart */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valorización de Stock por Rubro</h4>
          <div className="h-56 cursor-pointer relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={11} width={80} />
                <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)} USD`, 'Valor en stock']} />
                <Bar dataKey="value" name="Valorizado en Stock" radius={[0, 8, 8, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-500 text-[11px] text-center">
            El valor total del inventario se divide según su precio de venta al público en USD.
          </div>
        </div>
      </div>
    </div>
  );
}
