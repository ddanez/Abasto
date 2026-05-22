import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  FileText,
  User,
  CreditCard,
  DollarSign,
  Search,
  Sparkles,
  Award,
  Receipt,
  Scale
} from 'lucide-react';
import { Product, Customer, SaleItem, ExchangeRate, Sale } from '../types';

interface SalesModuleProps {
  products: Product[];
  customers: Customer[];
  rates: ExchangeRate;
  onRecordSale: (saleData: {
    customerId: string;
    customerName: string;
    items: Omit<SaleItem, 'totalUsd'>[];
    paymentMethod: 'cash' | 'cxc' | 'transfer';
    paidAmountUsd: number;
  }) => Promise<any>;
}

export default function SalesModule({ products, customers, rates, onRecordSale }: SalesModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('casual');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cxc' | 'transfer'>('cash');
  const [downpaymentUsd, setDownpaymentUsd] = useState<string>('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successReceipt, setSuccessReceipt] = useState<Sale | null>(null);

  // Filter products for the quick shelf
  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) && p.stock > 0
    );
  }, [products, searchQuery]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  // Compute Cart totals
  const totalUsd = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.priceUsd * item.quantity), 0);
  }, [cart]);

  const totalVes = totalUsd * rates.usdToVes;
  const totalCop = totalUsd * rates.usdToCop;

  // Track customer credit validity
  const creditValidation = useMemo(() => {
    if (paymentMethod !== 'cxc' || selectedCustomerId === 'casual') {
      return { valid: true, error: '' };
    }

    const val = parseFloat(downpaymentUsd) || 0;
    const debtToIncur = totalUsd - val;

    if (debtToIncur <= 0) {
      return { valid: true, error: '' };
    }

    if (debtToIncur > selectedCustomer.creditLimitUsd) {
      return {
        valid: false,
        error: `Límite de crédito excedido. El cliente solo tiene permitido de deuda $${selectedCustomer.creditLimitUsd.toFixed(2)} USD (Nueva deuda solicitada: $${debtToIncur.toFixed(2)} USD).`
      };
    }

    return { valid: true, error: '' };
  }, [paymentMethod, selectedCustomerId, selectedCustomer, totalUsd, downpaymentUsd]);

  // Adjust Cart Items
  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert(`No hay suficiente stock. Solo queda un stock disponible de ${product.stock} ${product.unit} de ${product.name}.`);
        return;
      }
      setCart(cart.map(item =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
    setSuccessReceipt(null);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, val: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    const newQty = item.quantity + val;
    if (newQty <= 0) {
      removeFromCart(productId);
    } else {
      if (newQty > item.product.stock) {
        alert(`Disponibilidad excedida. Solo quedan ${item.product.stock} ${item.product.unit}.`);
        return;
      }
      setCart(cart.map(i =>
        i.product.id === productId ? { ...i, quantity: newQty } : i
      ));
    }
  };

  const handleClearCart = () => {
    setCart([]);
    setDownpaymentUsd('0');
    setErrorMessage('');
  };

  // Submit sale handler
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!creditValidation.valid) {
      setErrorMessage(creditValidation.error);
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const itemsPayload = cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        emoji: item.product.emoji,
        quantity: item.quantity,
        priceUsd: item.product.priceUsd,
        unit: item.product.unit
      }));

      const paidVal = paymentMethod === 'cxc' ? (parseFloat(downpaymentUsd) || 0) : totalUsd;

      const response = await onRecordSale({
        customerId: selectedCustomerId,
        customerName: selectedCustomer ? selectedCustomer.name : 'Cliente Casual',
        items: itemsPayload,
        paymentMethod,
        paidAmountUsd: paidVal
      });

      if (response && response.id) {
        setSuccessReceipt(response);
        setCart([]);
        setDownpaymentUsd('0');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Ocurrió un error al procesar el pago.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="sales-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* LEFT: Searchable Product Rack for selection */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                🛍 Estantería de Productos
              </h3>
              <p className="text-xs text-slate-500">Selecciona o haz clic en los productos solicitados por el cliente</p>
            </div>
            {/* Search Input inside the rack list */}
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar verdura/víveres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-full sm:w-48 text-xs border border-slate-200 outline-none rounded-xl focus:border-emerald-500 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[58vh] overflow-y-auto pr-1">
            {filteredProducts.map(p => (
              <button
                type="button"
                key={p.id}
                onClick={() => addToCart(p)}
                className="flex flex-col justify-between p-3 bg-slate-50 hover:bg-emerald-50/40 border border-slate-100 hover:border-emerald-200 rounded-2xl text-left cursor-pointer transition-all active:scale-[0.98] group relative"
              >
                <div className="absolute top-2.5 right-2 px-1.5 py-0.5 bg-slate-200/60 rounded text-[9px] font-bold text-slate-600">
                  {p.stock} {p.unit}
                </div>

                <div className="text-3xl mb-1.5 select-none">{p.emoji}</div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 leading-tight truncate group-hover:text-emerald-800" title={p.name}>
                    {p.name}
                  </h4>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-sm font-black text-slate-800">${p.priceUsd.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">/ {p.unit}</span>
                  </div>
                  {rates.usdToVes > 0 && (
                    <span className="text-[9px] text-slate-400 block font-mono">
                      Bs.{(p.priceUsd * rates.usdToVes).toFixed(1)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* PRINTABLE SUCCESS RECEIPT TILE */}
        {successReceipt && (
          <div className="bg-indigo-50 border-2 border-indigo-200 p-6 rounded-3xl space-y-4 shadow-sm animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 text-white p-2.5 rounded-2xl shadow-sm">
                <Receipt size={24} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">Transacción Completada</span>
                <h4 className="text-base font-bold text-slate-800">Factura de Caja #{successReceipt.invoiceNumber}</h4>
              </div>
            </div>

            {/* Receipt Summary Table */}
            <div className="bg-white rounded-2xl p-4 border border-indigo-100 space-y-3 shadow-inner">
              <div className="flex justify-between text-xs border-b border-indigo-100 pb-2">
                <span className="font-bold text-slate-500">Beneficiario:</span>
                <span className="font-bold text-slate-800">{successReceipt.customerName}</span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {successReceipt.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-600 font-semibold">{item.emoji} {item.name} x {item.quantity} {item.unit}</span>
                    <span className="text-slate-800 font-bold">${item.totalUsd.toFixed(2)} USD</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-indigo-100 pt-2 flex flex-col items-end">
                <div className="flex justify-between w-full text-xs font-bold text-slate-700">
                  <span>Método de pago:</span>
                  <span className="uppercase text-indigo-600">{successReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between w-full text-sm font-black text-slate-800 mt-2">
                  <span>Total Transacción:</span>
                  <span>${successReceipt.totalUsd.toFixed(2)} USD</span>
                </div>
                <div className="space-y-0.5 mt-1 text-right">
                  <span className="text-[10px] font-mono text-emerald-600 font-bold block">
                    Bs. {(successReceipt.totalUsd * successReceipt.rateAtSale.usdToVes).toFixed(1)} VES
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold block">
                    COP ${(successReceipt.totalUsd * successReceipt.rateAtSale.usdToCop).toLocaleString('es-CO')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText size={14} /> Imprimir Comprobante Fiscal
              </button>
              <button
                type="button"
                onClick={() => setSuccessReceipt(null)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Cerrar Recibo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: SHOPPING CART & CHECKOUT CONTROLLER */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between max-h-[85vh] h-full">
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart size={18} className="text-emerald-500" />
                Cesta de Compra ({cart.length} productos)
              </span>
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-xs font-bold text-rose-500 hover:text-rose-700 transition"
                >
                  Vaciar cesta
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-14 text-slate-400 space-y-1">
                  <ShoppingCart size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-500">La cesta está vacía</p>
                  <p className="text-[10px] text-slate-400">Haz clic en productos a la izquierda para agregarlos al checkout.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-100/80 shadow-inner"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-2xl select-none">{item.product.emoji}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate" title={item.product.name}>
                          {item.product.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-bold block font-mono">
                          ${item.product.priceUsd.toFixed(2)} USD / {item.product.unit}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl px-1 py-0.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 hover:text-rose-500"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 text-xs font-extrabold text-slate-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 hover:text-emerald-500"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      <span className="text-xs font-black text-slate-700 font-mono w-14 text-right">
                        ${(item.product.priceUsd * item.quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Error alerts space */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs font-semibold">
                ⚠ {errorMessage}
              </div>
            )}

            {/* Checkout parameters & pricing */}
            {cart.length > 0 && (
              <div className="space-y-4 pt-3 border-t border-slate-100">
                {/* 1. Client selector */}
                <div className="grid grid-cols-1 gap-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Identificar Cliente</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <User size={13} />
                    </span>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => {
                        setSelectedCustomerId(e.target.value);
                        setDownpaymentUsd('0');
                        setErrorMessage('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 pl-8 rounded-xl p-2.5 outline-none text-slate-800 text-xs font-bold focus:border-emerald-500 transition-all cursor-pointer"
                    >
                      <option value="casual">Cliente Casual / Contado General</option>
                      {customers.filter(c => c.id !== 'casual').map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.document}) - Límite Cred: ${c.creditLimitUsd}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Payment terms selector */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Condiciones Financieras</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('cash');
                        setDownpaymentUsd('0');
                        setErrorMessage('');
                      }}
                      className={`py-2 p-1.5 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${paymentMethod === 'cash' ? 'bg-green-600 border-green-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      Efectivo / Divisa
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('transfer');
                        setDownpaymentUsd('0');
                        setErrorMessage('');
                      }}
                      className={`py-2 p-1.5 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${paymentMethod === 'transfer' ? 'bg-green-600 border-green-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      Pago Móvil / Transf.
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCustomerId === 'casual') {
                          alert('Debe seleccionar a un cliente registrado (no casual) para poder procesar la venta a crédito.');
                          return;
                        }
                        setPaymentMethod('cxc');
                        setErrorMessage('');
                      }}
                      className={`py-2 p-1.5 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${paymentMethod === 'cxc' ? 'bg-green-600 border-green-600 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'} ${selectedCustomerId === 'casual' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      Crédito (Abonar / CxC)
                    </button>
                  </div>
                </div>

                {/* Account payment partial input for CxC */}
                {paymentMethod === 'cxc' && (
                  <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 space-y-2 animate-scale-up">
                    <div className="flex justify-between items-center text-[10px] text-amber-800 font-bold uppercase">
                      <span>Monto de Abono Inicial (Down-payment)</span>
                      <span>Opcional</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-amber-600 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={totalUsd}
                        value={downpaymentUsd}
                        onChange={(e) => {
                          setDownpaymentUsd(e.target.value);
                          setErrorMessage('');
                        }}
                        className="w-full pl-7 bg-white border border-amber-200 rounded-xl p-2 outline-none text-slate-800 text-xs font-bold focus:border-amber-500"
                        placeholder="Ej: 5.00"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-amber-900">
                      <span>Monto que quedará en Cuenta por Cobrar:</span>
                      <span className="font-extrabold">
                        ${(totalUsd - (parseFloat(downpaymentUsd) || 0)).toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Pricing Panel */}
          {cart.length > 0 && (
            <div className="bg-slate-9 border border-slate-100 p-4 rounded-3xl mt-4 space-y-3.5 bg-slate-50 shadow-inner">
              <div className="space-y-1 border-b border-slate-200/55 pb-3">
                <div className="flex justify-between items-baseline text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <span>Total Operación</span>
                  <span>Dólares (USD)</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-3xl font-black text-slate-800">${totalUsd.toFixed(2)}</span>
                  <span className="text-xs font-bold text-slate-400">USD</span>
                </div>
              </div>

              {/* Converted Currencies Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-150 relative">
                  <span className="absolute top-1.5 right-1.5 text-[9px] bg-slate-100 px-1 font-bold rounded text-slate-400">VES</span>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Bolívares</span>
                  <span className="text-sm font-extrabold text-teal-600 block mt-1">Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-150 relative">
                  <span className="absolute top-1.5 right-1.5 text-[9px] bg-slate-100 px-1 font-bold rounded text-slate-400">COP</span>
                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Pesos Col</span>
                  <span className="text-sm font-extrabold text-teal-600 block mt-1">${Math.round(totalCop).toLocaleString('es-CO')}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCheckout}
                className="w-full py-4 text-sm font-bold text-white bg-green-600 hover:bg-green-700 text-center rounded-2xl shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                {isProcessing ? 'Procesando Caja...' : 'Completar Compra y Generar Factura'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
