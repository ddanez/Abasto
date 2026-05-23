import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Minus,
  Trash2,
  FileSpreadsheet,
  UserCheck,
  CreditCard,
  Search,
  CheckCircle,
  Truck
} from 'lucide-react';
import { Product, Provider, PurchaseItem, ExchangeRate, Purchase } from '../types';

interface PurchasesModuleProps {
  products: Product[];
  providers: Provider[];
  rates: ExchangeRate;
  onRecordPurchase: (purchaseData: {
    providerId: string;
    providerName: string;
    items: Omit<PurchaseItem, 'totalUsd'>[];
    paymentMethod: 'cash' | 'cxp' | 'transfer';
    paidAmountUsd: number;
  }) => Promise<any>;
}

export default function PurchasesModule({ products, providers, rates, onRecordPurchase }: PurchasesModuleProps) {
  const [cart, setCart] = useState<{ product: Product; quantity: number | string; newCostUsd: number }[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cxp' | 'transfer'>('cash');
  const [downpaymentUsd, setDownpaymentUsd] = useState<string>('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const selectedProvider = useMemo(() => {
    return providers.find(p => p.id === selectedProviderId) || providers[0];
  }, [providers, selectedProviderId]);

  const totalUsd = useMemo(() => {
    return cart.reduce((sum, item) => {
      const qty = parseFloat(String(item.quantity)) || 0;
      return sum + (item.newCostUsd * qty);
    }, 0);
  }, [cart]);

  const totalVes = totalUsd * rates.usdToVes;
  const totalCop = totalUsd * rates.usdToCop;

  const addItemToPurchase = (prod: Product) => {
    const existing = cart.find(item => item.product.id === prod.id);
    if (existing) {
      const currentQty = parseFloat(String(existing.quantity)) || 0;
      setCart(cart.map(item =>
        item.product.id === prod.id ? { ...item, quantity: Number((currentQty + 1).toFixed(3)) } : item
      ));
    } else {
      setCart([...cart, { product: prod, quantity: 1, newCostUsd: prod.costUsd }]);
    }
    setSuccessMsg('');
  };

  const updateCartItemCost = (productId: string, cost: number) => {
    setCart(cart.map(item =>
      item.product.id === productId ? { ...item, newCostUsd: cost } : item
    ));
  };

  const updateQuantity = (productId: string, val: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    const currentQty = parseFloat(String(item.quantity)) || 0;
    const newQty = Number((currentQty + val).toFixed(3));
    if (newQty <= 0) {
      setCart(cart.filter(i => i.product.id !== productId));
    } else {
      setCart(cart.map(i =>
        i.product.id === productId ? { ...i, quantity: newQty } : i
      ));
    }
  };

  const handleManualQuantityChange = (productId: string, valStr: string) => {
    const cleanStr = valStr.replace(',', '.'); // Permitir comas
    setCart(cart.map(i =>
      i.product.id === productId ? { ...i, quantity: cleanStr } : i
    ));
    setSuccessMsg('');
  };

  const handleManualQuantityBlur = (productId: string, valStr: string) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    let parsed = parseFloat(valStr) || 0;
    if (parsed <= 0) {
      setCart(cart.filter(i => i.product.id !== productId));
    } else {
      setCart(cart.map(i =>
        i.product.id === productId ? { ...i, quantity: Number(parsed.toFixed(3)) } : i
      ));
    }
  };

  const handleClearCart = () => {
    setCart([]);
    setDownpaymentUsd('0');
    setErrorMessage('');
  };

  const handleSubmitPurchase = async () => {
    if (cart.length === 0) return;
    
    // Validar cantidades mayores a cero
    for (const item of cart) {
      const qty = parseFloat(String(item.quantity)) || 0;
      if (qty <= 0) {
        setErrorMessage(`La cantidad para ${item.product.name} debe ser mayor a 0.`);
        return;
      }
    }

    if (!selectedProviderId) {
      setErrorMessage('Por favor, registra un proveedor primero antes de realizar compras.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const itemsPayload = cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        emoji: item.product.emoji,
        quantity: parseFloat(String(item.quantity)) || 0,
        costUsd: item.newCostUsd,
        unit: item.product.unit
      }));

      const paidVal = paymentMethod === 'cxp' ? (parseFloat(downpaymentUsd) || 0) : totalUsd;

      const response = await onRecordPurchase({
        providerId: selectedProviderId,
        providerName: selectedProvider.name,
        items: itemsPayload,
        paymentMethod,
        paidAmountUsd: paidVal
      });

      if (response && response.id) {
        setSuccessMsg(`Compra registrada exitosamente bajo el código #${response.invoiceNumber}. El stock de los productos ha sido actualizado e incrementado.`);
        setCart([]);
        setDownpaymentUsd('0');
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Error al completar el registro.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="purchases-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* LEFT: Replenishment Selection list */}
      <div className="lg:col-span-6 space-y-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                🥦 Selección de Mercancía para Abastecer
              </h3>
              <p className="text-xs text-slate-500 font-medium">Busca y haz clic para ingresar lotes comprados al almacén</p>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-3 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Escribe para buscar manzanas, plátano, etc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 outline-none rounded-xl focus:border-amber-500 transition-all font-semibold"
            />
          </div>

          <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
            {filteredProducts.map(p => (
              <button
                type="button"
                key={p.id}
                onClick={() => addItemToPurchase(p)}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-amber-50/20 border border-slate-100 hover:border-amber-200 rounded-xl text-left cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl select-none">{p.emoji}</span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{p.name}</h4>
                    <span className="text-[10px] text-slate-400 font-bold block capitalize">{p.category} | Stock actual: {p.stock} {p.unit}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 font-mono">Anterior costo: ${p.costUsd.toFixed(2)} USD</span>
                  <span className="bg-white px-2 py-1 text-[10px] font-black border border-slate-200 rounded-lg text-amber-600">+ Cargar</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Successful message feedback */}
        {successMsg && (
          <div className="bg-emerald-50 border-2 border-emerald-200 p-5 rounded-3xl space-y-2 text-center animate-scale-up">
            <CheckCircle className="mx-auto text-emerald-500" size={32} />
            <h4 className="text-sm font-bold text-slate-800">¡Abastecimiento Completado!</h4>
            <p className="text-xs text-slate-500">{successMsg}</p>
            <button
              onClick={() => setSuccessMsg('')}
              className="mt-2 text-xs bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg transition"
            >
              Cerrar Agradecimiento
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: COMPRANDO CART PANEL */}
      <div className="lg:col-span-6 space-y-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between max-h-[85vh] h-full">
          <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Truck size={18} className="text-amber-500" />
                Registro lote de Compra ({cart.length} productos)
              </span>
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="text-xs font-extrabold text-rose-500 hover:text-rose-700 transition"
                >
                  Vaciar lista
                </button>
              )}
            </div>

            {/* Cart list items */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-400 space-y-1">
                  <Package size={36} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-500 text-center">La lista de compra está vacía</p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto text-center">Agrega alimentos desde la estantería izquierda de abastecimiento.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-100/85 grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
                  >
                    <div className="md:col-span-5 flex items-center gap-2 min-w-0">
                      <span className="text-2xl select-none">{item.product.emoji}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate" title={item.product.name}>
                          {item.product.name}
                        </h4>
                        <span className="text-[9px] text-slate-400 block font-bold capitalize">Stock: {item.product.stock} {item.product.unit}</span>
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="md:col-span-3 flex justify-center md:justify-start">
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg px-1 py-0.5 w-fit">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 hover:text-rose-500 shrink-0 cursor-pointer"
                          title="Restar 1"
                        >
                          <Minus size={11} />
                        </button>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={item.quantity}
                          onChange={(e) => handleManualQuantityChange(item.product.id, e.target.value)}
                          onBlur={(e) => handleManualQuantityBlur(item.product.id, e.target.value)}
                          className="w-12 text-center text-xs font-extrabold text-slate-800 focus:outline-none bg-transparent"
                          title="Escriba la cantidad exacta de abastecimiento"
                          placeholder="0"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 hover:text-amber-500 shrink-0 cursor-pointer"
                          title="Sumar 1"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Cost Input for buy price per unit updates */}
                    <div className="md:col-span-4 flex items-center justify-between gap-1">
                      <div className="relative w-20">
                        <span className="absolute left-1.5 top-1.5 text-[9px] text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.newCostUsd}
                          onChange={(e) => updateCartItemCost(item.product.id, parseFloat(e.target.value) || 0)}
                          className="w-full pl-4 pr-1 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs outline-none focus:border-amber-500"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold font-mono">
                        =${(item.newCostUsd * (parseFloat(String(item.quantity)) || 0)).toFixed(2)}
                      </span>
                      <button
                        onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))}
                        className="text-slate-300 hover:text-rose-500 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs font-semibold">
                ⚠ {errorMessage}
              </div>
            )}

            {/* Purchases config params */}
            {cart.length > 0 && (
              <div className="space-y-4 pt-3 border-t border-slate-100">
                {/* Provider Selector dropdown */}
                <div className="grid grid-cols-1 gap-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block">Proveedor que Suministra *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <UserCheck size={13} />
                    </span>
                    <select
                      value={selectedProviderId}
                      onChange={(e) => {
                        setSelectedProviderId(e.target.value);
                        setDownpaymentUsd('0');
                        setErrorMessage('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 pl-8 rounded-xl p-2.5 outline-none text-slate-800 text-xs font-bold focus:border-amber-500 cursor-pointer"
                    >
                      {providers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.document})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Terms of purchase */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Términos de Pago del Proveedor</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('cash');
                        setDownpaymentUsd('0');
                        setErrorMessage('');
                      }}
                      className={`py-2 p-1 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${paymentMethod === 'cash' ? 'bg-amber-500 border-amber-500 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      Efectivo Contado
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('transfer');
                        setDownpaymentUsd('0');
                        setErrorMessage('');
                      }}
                      className={`py-2 p-1 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${paymentMethod === 'transfer' ? 'bg-amber-500 border-amber-500 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      Transferencia
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('cxp');
                        setErrorMessage('');
                      }}
                      className={`py-2 p-1 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${paymentMethod === 'cxp' ? 'bg-amber-500 border-amber-500 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      Crédito (Abonar / CxP)
                    </button>
                  </div>
                </div>

                {/* Account payment partial input for CxP */}
                {paymentMethod === 'cxp' && (
                  <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 space-y-2 animate-scale-up">
                    <div className="flex justify-between items-center text-[10px] text-amber-800 font-bold uppercase">
                      <span>Monto de Abono Realizado (Si aplica)</span>
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
                        placeholder="Ej: 50.00"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-amber-900 font-semibold">
                      <span>Monto que quedará como Cuenta por Pagar:</span>
                      <span className="font-extrabold">
                        ${(totalUsd - (parseFloat(downpaymentUsd) || 0)).toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checkout pricing sum */}
          {cart.length > 0 && (
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-3xl mt-4 space-y-3.5 shadow-inner">
              <div className="space-y-1 border-b border-slate-200 pb-3">
                <div className="flex justify-between items-baseline text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <span>Total Inversión de Compra</span>
                  <span>Dólares (USD)</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-3xl font-black text-slate-800">${totalUsd.toFixed(2)}</span>
                  <span className="text-xs font-bold text-slate-400">USD</span>
                </div>
              </div>

              {/* Auxiliary Conversion */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Valorización VES</span>
                  <span className="text-sm font-extrabold text-amber-600 block mt-1">Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Valorización COP</span>
                  <span className="text-sm font-extrabold text-amber-600 block mt-1">${Math.round(totalCop).toLocaleString('es-CO')}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSubmitPurchase}
                className="w-full py-4 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-center rounded-2xl shadow-lg transition-all active:scale-[0.99] cursor-pointer"
              >
                {isProcessing ? 'Procesando Abastecimiento...' : 'Confirmar Ingreso y Guardar Compra'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
