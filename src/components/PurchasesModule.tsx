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
  Truck,
  Edit,
  X,
  Calendar,
  Scale,
  DollarSign
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
  onAddProvider?: (providerData: Omit<Provider, 'id'>) => Promise<any>;
  purchases?: Purchase[];
  onEditPurchase?: (id: string, purchaseData: any) => Promise<any>;
  onDeletePurchase?: (id: string) => Promise<any>;
}

export default function PurchasesModule({
  products,
  providers,
  rates,
  onRecordPurchase,
  onAddProvider,
  purchases = [],
  onEditPurchase,
  onDeletePurchase
}: PurchasesModuleProps) {
  const [cart, setCart] = useState<{ product: Product; quantity: number | string; newCostUsd: number }[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(providers[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cxp' | 'transfer'>('cash');
  const [downpaymentUsd, setDownpaymentUsd] = useState<string>('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Sub tab tracking and search
  const [activeSubTab, setActiveSubTab] = useState<'checkout' | 'history'>('checkout');
  const [historySearch, setHistorySearch] = useState('');

  // Editing purchase state variables
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editProviderId, setEditProviderId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'cxp' | 'transfer'>('cash');
  const [editPaidAmountUsd, setEditPaidAmountUsd] = useState('0');
  const [editItems, setEditItems] = useState<{ productId: string; name: string; emoji: string; quantity: number | string; costUsd: number; unit: string }[]>([]);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editError, setEditError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const startEditingPurchase = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setEditProviderId(purchase.providerId);
    setEditDate(purchase.date ? purchase.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditPaymentMethod(purchase.paymentMethod);
    setEditPaidAmountUsd(String(purchase.paidAmountUsd));
    setEditItems(purchase.items.map(i => ({
      productId: i.productId,
      name: i.name,
      emoji: i.emoji,
      quantity: i.quantity,
      costUsd: i.costUsd,
      unit: i.unit
    })));
    setEditError('');
  };

  const handleEditItemQtyChange = (productId: string, val: string) => {
    const cleanStr = val.replace(',', '.');
    setEditItems(prev => prev.map(i =>
      i.productId === productId ? { ...i, quantity: cleanStr } : i
    ));
    setEditError('');
  };

  const handleEditItemQtyBlur = (productId: string, val: string) => {
    let parsed = parseFloat(val) || 0;
    if (parsed <= 0) {
      setEditItems(prev => prev.filter(i => i.productId !== productId));
    } else {
      setEditItems(prev => prev.map(i =>
        i.productId === productId ? { ...i, quantity: Number(parsed.toFixed(3)) } : i
      ));
    }
  };

  const handleEditItemCostChange = (productId: string, val: number) => {
    setEditItems(prev => prev.map(i =>
      i.productId === productId ? { ...i, costUsd: val } : i
    ));
  };

  const handleRemoveEditItem = (productId: string) => {
    setEditItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleAddEditItem = (prod: Product) => {
    const exists = editItems.find(i => i.productId === prod.id);
    if (exists) {
      const currentQty = parseFloat(String(exists.quantity)) || 0;
      setEditItems(prev => prev.map(i =>
        i.productId === prod.id ? { ...i, quantity: Number((currentQty + 1).toFixed(3)) } : i
      ));
    } else {
      setEditItems(prev => [...prev, {
        productId: prod.id,
        name: prod.name,
        emoji: prod.emoji,
        quantity: 1,
        costUsd: prod.costUsd,
        unit: prod.unit
      }]);
    }
  };

  const submitEditPurchase = async () => {
    if (editItems.length === 0) {
      setEditError('La compra debe tener al menos un producto.');
      return;
    }
    for (const item of editItems) {
      const q = parseFloat(String(item.quantity)) || 0;
      if (q <= 0) {
        setEditError(`La cantidad para ${item.name} debe ser mayor a 0.`);
        return;
      }
    }
    
    const computedTotal = editItems.reduce((sum, item) => sum + (item.costUsd * (parseFloat(String(item.quantity)) || 0)), 0);
    const paidVal = editPaymentMethod === 'cxp' ? (parseFloat(editPaidAmountUsd) || 0) : computedTotal;

    setIsUpdating(true);
    setEditError('');
    if (onEditPurchase && editingPurchase) {
      try {
        const selectedProvObj = providers.find(p => p.id === editProviderId);
        await onEditPurchase(editingPurchase.id, {
          providerId: editProviderId,
          providerName: selectedProvObj ? selectedProvObj.name : 'Proveedor General',
          items: editItems.map(i => ({
            productId: i.productId,
            name: i.name,
            emoji: i.emoji,
            quantity: parseFloat(String(i.quantity)) || 0,
            costUsd: i.costUsd,
            unit: i.unit
          })),
          paymentMethod: editPaymentMethod,
          paidAmountUsd: paidVal,
          date: new Date(editDate).toISOString()
        });
        setEditingPurchase(null);
      } catch (err: any) {
        setEditError(err.message || 'Error al actualizar la compra');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDeleteHistoryPurchase = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta compra de forma permanente? El stock de los productos ingresados se restará e incrementará el saldo pendiente si aplica.')) {
      try {
        if (onDeletePurchase) {
          await onDeletePurchase(id);
          alert('Compra eliminada con éxito y stock/saldos ajustados.');
        }
      } catch (err: any) {
        alert(err.message || 'Error al eliminar la compra');
      }
    }
  };

  // Quick Provider state variables
  const [showQuickProviderAdd, setShowQuickProviderAdd] = useState(false);
  const [quickProvName, setQuickProvName] = useState('');
  const [quickProvPhone, setQuickProvPhone] = useState('');
  const [quickProvDoc, setQuickProvDoc] = useState('');
  const [quickProvEmail, setQuickProvEmail] = useState('');
  const [isAddingProvider, setIsAddingProvider] = useState(false);

  const handleQuickAddProviderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProvName || !quickProvDoc) {
      alert('El Nombre y Cédula/RIF del proveedor son obligatorios.');
      return;
    }
    setIsAddingProvider(true);
    try {
      if (onAddProvider) {
        const newProv = await onAddProvider({
          name: quickProvName,
          phone: quickProvPhone,
          document: quickProvDoc,
          email: quickProvEmail
        });
        if (newProv && newProv.id) {
          setSelectedProviderId(newProv.id);
          setShowQuickProviderAdd(false);
          // clear fields
          setQuickProvName('');
          setQuickProvPhone('');
          setQuickProvDoc('');
          setQuickProvEmail('');
        } else {
          alert('No se pudo registrar el proveedor. Intente nuevamente.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error al registrar el proveedor.');
    } finally {
      setIsAddingProvider(false);
    }
  };

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

  // Filter history of purchases
  const filteredPurchasesHistory = useMemo(() => {
    if (!historySearch) return purchases;
    const term = historySearch.toLowerCase();
    return purchases.filter(p =>
      p.invoiceNumber.toLowerCase().includes(term) ||
      p.providerName.toLowerCase().includes(term) ||
      p.items.some(item => item.name.toLowerCase().includes(term))
    );
  }, [purchases, historySearch]);

  const editTotalUsd = useMemo(() => {
    return editItems.reduce((acc, item) => {
      const q = parseFloat(String(item.quantity)) || 0;
      return acc + (item.costUsd * q);
    }, 0);
  }, [editItems]);

  const filteredEditProducts = useMemo(() => {
    if (!editSearchQuery) return products.slice(0, 5);
    return products.filter(p => p.name.toLowerCase().includes(editSearchQuery.toLowerCase())).slice(0, 5);
  }, [products, editSearchQuery]);

  return (
    <div className="space-y-4 w-full animate-fade-in font-sans">
      {/* Sub tabs and header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4.5 rounded-3xl border border-slate-150/45 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Truck className="text-amber-500" /> Abastecimiento e Inventario de Compra
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Registre la entrada de mercancía para abastecer o edite compras históricas realizadas.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('checkout')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'checkout'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🛒 Nuevo Abastecimiento
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📋 Historial de Compras
          </button>
        </div>
      </div>

      {activeSubTab === 'checkout' ? (
        <div id="purchases-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* LEFT: Replenishment Selection list */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    🥦 Selección de Mercancía para Abastecer
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Busca y haz clic para ingresar lotes comprados al almacén</p>
                </div>
              </div>

              <div className="relative font-sans">
                <span className="absolute left-3.5 top-3 text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Escribe para buscar manzanas, plátano, etc..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 outline-none rounded-xl focus:border-amber-500 transition-all font-semibold font-sans"
                />
              </div>

              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1 font-sans">
                {filteredProducts.map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => addItemToPurchase(p)}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-amber-50/20 border border-slate-100 hover:border-amber-200 rounded-xl text-left cursor-pointer transition-all font-sans"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl select-none">{p.emoji}</span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{p.name}</h4>
                        <span className="text-[10px] text-slate-400 font-bold block capitalize">Stock actual: {p.stock} {p.unit}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] sm:text-xs font-bold text-slate-500 font-mono">Costo: ${p.costUsd.toFixed(2)}</span>
                      <span className="bg-white px-2 py-1 text-[10px] font-black border border-slate-200 rounded-lg text-amber-600">+ Cargar</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Successful message feedback */}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl space-y-2 text-center animate-scale-up font-sans">
                <CheckCircle className="mx-auto text-emerald-500" size={32} />
                <h4 className="text-sm font-bold text-slate-800 font-sans">¡Abastecimiento Completado!</h4>
                <p className="text-xs text-slate-500 font-sans">{successMsg}</p>
                <button
                  type="button"
                  onClick={() => setSuccessMsg('')}
                  className="mt-2 text-xs bg-white border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer font-sans"
                >
                  Cerrar Notificación
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: COMPRANDO CART PANEL */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between lg:max-h-[85vh] lg:h-full h-auto min-h-[500px]">
              <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-sans">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Truck size={18} className="text-amber-500" />
                    Registro lote de Compra ({cart.length} productos)
                  </span>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-xs font-extrabold text-rose-500 hover:text-rose-700 transition cursor-pointer font-sans"
                    >
                      Vaciar lista
                    </button>
                  )}
                </div>

                {/* Scrollable Items & Setup Fields Container */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
                  {/* Cart list items */}
                  <div className="space-y-2.5 font-sans">
                  {cart.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 space-y-1">
                      <Package size={36} className="mx-auto text-slate-300" />
                      <p className="text-xs font-bold text-slate-500 text-center font-sans">La lista de compra está vacía</p>
                      <p className="text-[10px] text-slate-400 max-w-xs mx-auto text-center font-sans">Agrega alimentos desde la estantería izquierda de abastecimiento.</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div
                        key={item.product.id}
                        className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-100/85 grid grid-cols-1 md:grid-cols-12 gap-2 items-center font-sans"
                      >
                        <div className="md:col-span-5 flex items-center gap-2 min-w-0">
                          <span className="text-2xl select-none">{item.product.emoji}</span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate font-sans" title={item.product.name}>
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
                              className="w-12 text-center text-xs font-extrabold text-slate-800 focus:outline-none bg-transparent font-sans"
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
                              className="w-full pl-4 pr-1 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs outline-none focus:border-amber-500 font-sans"
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold font-mono shrink-0">
                            =${(item.newCostUsd * (parseFloat(String(item.quantity)) || 0)).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))}
                            className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {errorMessage && (
                  <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs font-semibold font-sans">
                    ⚠ {errorMessage}
                  </div>
                )}

                {/* Purchases config params */}
                {cart.length > 0 && (
                  <div className="space-y-4 pt-3 border-t border-slate-100 font-sans">
                    {/* Provider Selector dropdown */}
                    <div className="grid grid-cols-1 gap-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] uppercase font-bold text-slate-400 block font-bold">Proveedor que Suministra *</label>
                        {onAddProvider && (
                          <button
                            type="button"
                            onClick={() => setShowQuickProviderAdd(!showQuickProviderAdd)}
                            className="text-[10px] text-amber-600 font-extrabold hover:text-amber-700 hover:underline flex items-center gap-1 transition cursor-pointer font-sans"
                          >
                            <Plus size={11} className="stroke-[3px]" /> {showQuickProviderAdd ? "Cerrar" : "Crear Nuevo Proveedor"}
                          </button>
                        )}
                      </div>

                      {!showQuickProviderAdd ? (
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
                            className="w-full bg-slate-100/60 border border-slate-200 pl-8 rounded-xl p-2.5 outline-none text-slate-800 text-xs font-bold focus:border-amber-500 cursor-pointer font-sans"
                          >
                            {providers.map(p => (
                              <option key={p.id} value={p.id} className="font-sans">
                                {p.name} ({p.document})
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 animate-scale-up font-sans font-sans">
                          <p className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">⚡ Registro Rápido de Proveedor</p>
                          
                          <div className="grid grid-cols-2 gap-2 font-sans">
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Nombre o Razón Social *</label>
                              <input
                                type="text"
                                placeholder="Ej. Distribuidora Andes"
                                value={quickProvName}
                                onChange={(e) => setQuickProvName(e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg p-2 w-full outline-none text-xs font-bold focus:border-emerald-500 font-sans"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">RIF / Cédula *</label>
                              <input
                                type="text"
                                placeholder="Ej. J-12345678-9"
                                value={quickProvDoc}
                                onChange={(e) => setQuickProvDoc(e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg p-2 w-full outline-none text-xs font-bold focus:border-emerald-500 font-sans"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 font-sans">
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Teléfono de Contacto</label>
                              <input
                                type="text"
                                placeholder="Ej. 0424-9993311"
                                value={quickProvPhone}
                                onChange={(e) => setQuickProvPhone(e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg p-2 w-full outline-none text-xs font-bold focus:border-emerald-500 font-sans"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Correo Electrónico</label>
                              <input
                                type="email"
                                placeholder="Ej. d_andes@correo.com"
                                value={quickProvEmail}
                                onChange={(e) => setQuickProvEmail(e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg p-2 w-full outline-none text-xs font-bold focus:border-emerald-500 font-sans"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setShowQuickProviderAdd(false);
                                setErrorMessage('');
                              }}
                              className="px-2.5 py-1.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-300 transition cursor-pointer font-sans"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              disabled={isAddingProvider}
                              onClick={handleQuickAddProviderSubmit}
                              className="px-2.5 py-1.5 bg-amber-600 text-white text-[10px] font-bold rounded-lg hover:bg-amber-700 transition cursor-pointer font-sans"
                            >
                              {isAddingProvider ? 'Guardando...' : 'Crear y Seleccionar'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Terms of purchase */}
                    <div className="font-sans">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 font-bold">Términos de Pago del Proveedor</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('cash');
                            setDownpaymentUsd('0');
                            setErrorMessage('');
                          }}
                          className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer font-sans ${paymentMethod === 'cash' ? 'bg-amber-500 border-amber-500 text-white shadow-sm font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
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
                          className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer font-sans ${paymentMethod === 'transfer' ? 'bg-amber-500 border-amber-500 text-white shadow-sm font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                          Pago Móvil
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMethod('cxp');
                            setErrorMessage('');
                          }}
                          className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer font-sans ${paymentMethod === 'cxp' ? 'bg-amber-500 border-amber-500 text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                          Crédito (CxP)
                        </button>
                      </div>
                    </div>

                    {/* Account payment partial input for CxP */}
                    {paymentMethod === 'cxp' && (
                      <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100 space-y-2 animate-scale-up font-sans font-sans">
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
                            className="w-full pl-7 bg-white border border-amber-200 rounded-xl p-2 outline-none text-slate-800 text-xs font-bold focus:border-amber-500 font-sans"
                            placeholder="Ej: 50.00"
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-amber-900 font-semibold font-sans">
                          <span>Monto que quedará como Cuenta por Pagar:</span>
                          <span className="font-extrabold text-amber-700 font-mono">
                            ${(totalUsd - (parseFloat(downpaymentUsd) || 0)).toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>

              {/* Checkout pricing sum */}
              {cart.length > 0 && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-3xl mt-4 space-y-3.5 shadow-inner font-sans">
                  <div className="space-y-1 border-b border-slate-200 pb-3">
                    <div className="flex justify-between items-baseline text-slate-600 font-semibold text-xs uppercase tracking-wider">
                      <span>Total Inversión de Compra</span>
                      <span>Dólares (USD)</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-3xl font-black text-slate-800 font-mono">${totalUsd.toFixed(2)}</span>
                      <span className="text-xs font-bold text-slate-400">USD</span>
                    </div>
                  </div>

                  {/* Auxiliary Conversion */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Valorización VES</span>
                      <span className="text-sm font-extrabold text-teal-600 block mt-1 font-mono">Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-150">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Valorización COP</span>
                      <span className="text-sm font-extrabold text-teal-600 block mt-1 font-mono">${Math.round(totalCop).toLocaleString('es-CO')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleSubmitPurchase}
                    className="w-full py-4 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-center rounded-2xl shadow-lg transition-all active:scale-[0.99] cursor-pointer font-sans"
                  >
                    {isProcessing ? 'Procesando Abastecimiento...' : 'Confirmar Ingreso y Guardar Compra'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* HISTORIAL DE COMPRAS */
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 font-sans font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">📋 Compras e Ingresos Realizados</h3>
              <p className="text-xs text-slate-500">Gestione los lotes de abastecimiento con sus respectivos costes unitarios.</p>
            </div>
            {/* Search Input */}
            <div className="relative font-sans">
              <span className="absolute left-3 top-2.5 text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar por proveedor, factura o artículo..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-full sm:w-64 text-xs border border-slate-200 outline-none rounded-xl focus:border-amber-500 transition-all font-semibold font-sans font-sans"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 font-sans">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="p-3.5">Código Compra</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Proveedor</th>
                  <th className="p-3.5">Productos abastecidos</th>
                  <th className="p-3.5 text-right font-bold">Total Inversión ($)</th>
                  <th className="p-3.5 text-center font-bold">Términos</th>
                  <th className="p-3.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPurchasesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium font-sans">
                      No se encontraron registros de compras en el historial.
                    </td>
                  </tr>
                ) : (
                  filteredPurchasesHistory.map(p => {
                    const formattedDate = p.date ? new Date(p.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'S/F';
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-all font-medium font-sans">
                        <td className="p-3.5 font-bold text-slate-800 font-mono">#{p.invoiceNumber}</td>
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">{formattedDate}</td>
                        <td className="p-3.5 font-bold text-slate-800">{p.providerName}</td>
                        <td className="p-3.5 max-w-xs truncate text-[11px]" title={p.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}>
                          {p.items.map((i, idx) => (
                            <span key={idx} className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold mr-1 my-0.5 whitespace-nowrap">
                              {i.emoji} {i.quantity} {i.unit} (c/u ${i.costUsd.toFixed(2)})
                            </span>
                          ))}
                        </td>
                        <td className="p-3.5 text-right font-black text-slate-800 font-mono">
                          ${p.totalUsd.toFixed(2)}
                          <span className="block text-[9px] text-teal-600 font-mono font-bold">Bs.{(p.totalUsd * (p.rateAtPurchase?.usdToVes || rates.usdToVes)).toFixed(1)}</span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 font-bold rounded-lg text-[9px] uppercase tracking-wider ${
                            p.paymentMethod === 'cxp'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {p.paymentMethod === 'cxp' ? 'Crédito (CxP)' : p.paymentMethod === 'transfer' ? 'Pago Móvil' : 'Contado'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap space-x-1.5 font-sans">
                          <button
                            type="button"
                            onClick={() => startEditingPurchase(p)}
                            className="inline-flex items-center gap-1 p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded-lg text-[11px] font-bold cursor-pointer transition-all font-sans"
                            title="Editar factura de compra e inventario"
                          >
                            <Edit size={11} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistoryPurchase(p.id)}
                            className="inline-flex items-center gap-1 p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg text-[11px] font-bold cursor-pointer transition-all font-sans"
                            title="Deshacer compra e inventario"
                          >
                            <Trash2 size={11} /> Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDITING MODAL WINDOW FOR PURCHASES */}
      {editingPurchase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all font-sans">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-scale-up">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Edit size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-sans">Modificar Registro de Compra</h3>
                  <p className="text-[10px] text-slate-500 font-sans">Código Compra: <span className="font-mono font-bold text-amber-600 font-sans">#{editingPurchase.invoiceNumber}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPurchase(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Work Area */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 font-sans">
              {/* Left Column: Items Editor (8 cols) */}
              <div className="md:col-span-8 space-y-4">
                <div className="space-y-3 font-sans">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">📦 Productos en Factura de Compra</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-lg">{editItems.length} ítems</span>
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {editItems.map((item, index) => (
                      <div
                        key={item.productId}
                        className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                      >
                        <div className="sm:col-span-4 flex items-center gap-2 min-w-0">
                          <span className="text-2xl select-none">{item.emoji}</span>
                          <div className="min-w-0 font-sans">
                            <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                            <span className="text-[9px] text-slate-400 font-bold block">{item.unit}</span>
                          </div>
                        </div>

                        {/* Qty edit section */}
                        <div className="sm:col-span-4 flex justify-start sm:justify-center items-center">
                          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-1.5 py-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const current = parseFloat(String(item.quantity)) || 0;
                                if (current > 1) handleEditItemQtyChange(item.productId, String(current - 1));
                              }}
                              className="p-1 hover:text-rose-500 shrink-0 cursor-pointer"
                            >
                              <Minus size={10} />
                            </button>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.quantity}
                              onChange={(e) => handleEditItemQtyChange(item.productId, e.target.value)}
                              onBlur={(e) => handleEditItemQtyBlur(item.productId, e.target.value)}
                              className="w-12 text-center text-xs font-black text-slate-800 focus:outline-none bg-transparent"
                              placeholder="0"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const current = parseFloat(String(item.quantity)) || 0;
                                handleEditItemQtyChange(item.productId, String(current + 1));
                              }}
                              className="p-1 hover:text-emerald-500 shrink-0 cursor-pointer"
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>

                        {/* Cost edit section */}
                        <div className="sm:col-span-4 flex items-center justify-between gap-1">
                          <div className="relative w-18 shrink-0">
                            <span className="absolute left-1.5 top-1.5 text-[9px] text-slate-400 font-bold">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.costUsd}
                              onChange={(e) => handleEditItemCostChange(item.productId, parseFloat(e.target.value) || 0)}
                              className="w-full pl-4 pr-1 py-1 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs outline-none focus:border-amber-500"
                            />
                          </div>

                          <span className="text-xs font-black text-slate-850 font-mono w-14 text-right truncate">
                            ${(item.costUsd * (parseFloat(String(item.quantity)) || 0)).toFixed(2)}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveEditItem(item.productId)}
                            className="p-1 text-slate-350 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add new product shelf within editing menu */}
                <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-3 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Plus size={13} className="text-emerald-500 stroke-[3px]" /> Agregar otro producto a la compra
                    </span>
                    <input
                      type="text"
                      placeholder="Filtrar verduras/víveres..."
                      value={editSearchQuery}
                      onChange={(e) => setEditSearchQuery(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-[10px] outline-none focus:border-green-500 font-bold w-44 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                    {filteredEditProducts.map(p => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleAddEditItem(p)}
                        className="flex items-center justify-between p-2 bg-white hover:bg-green-50/50 border border-slate-150/60 rounded-xl text-left text-xs cursor-pointer transition font-bold font-sans"
                      >
                        <span className="truncate">{p.emoji} {p.name}</span>
                        <span className="text-slate-850 font-extrabold text-[11px] shrink-0">c/u ${p.costUsd.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Supplier & Payments Form (4 cols) */}
              <div className="md:col-span-4 bg-slate-50/50 border border-slate-100 p-4.5 rounded-2xl space-y-4 font-sans font-sans font-sans">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-sans">📋 Condiciones & Factura</h4>

                {/* Date */}
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Fecha Emisión</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-slate-400">
                      <Calendar size={12} />
                    </span>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 pl-7 text-xs rounded-lg p-1.5 font-bold outline-none text-slate-800 focus:border-amber-500 font-sans"
                    />
                  </div>
                </div>

                {/* Supplier */}
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Proveedor Titular</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-slate-400">
                      <UserCheck size={12} />
                    </span>
                    <select
                      value={editProviderId}
                      onChange={(e) => {
                        setEditProviderId(e.target.value);
                        setEditPaidAmountUsd('0');
                      }}
                      className="w-full bg-white border border-slate-200 pl-7 text-xs rounded-lg p-1.5 font-bold outline-none text-slate-800 focus:border-amber-500 cursor-pointer font-sans"
                    >
                      {providers.map(p => (
                        <option key={p.id} value={p.id} className="font-sans">
                          {p.name} ({p.document})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Method */}
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Modo de Pago</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => {
                      setEditPaymentMethod(e.target.value as any);
                      setEditPaidAmountUsd('0');
                    }}
                    className="w-full bg-white border border-slate-200 text-xs rounded-lg p-1.5 font-bold outline-none text-slate-800 focus:border-amber-500 cursor-pointer font-sans"
                  >
                    <option value="cash" className="font-sans">Efectivo ($ / Bs Cash)</option>
                    <option value="transfer" className="font-sans">Pago Móvil / Transf.</option>
                    <option value="cxp" className="font-sans">Crédito (Abastecimiento CxP)</option>
                  </select>
                </div>

                {/* Downpayment if credit cxp */}
                {editPaymentMethod === 'cxp' && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 space-y-2 animate-fade-in font-sans">
                    <label className="text-[9px] uppercase font-bold text-amber-800 block">Abono Inicial de Caja (USD)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={editTotalUsd}
                      value={editPaidAmountUsd}
                      onChange={(e) => setEditPaidAmountUsd(e.target.value)}
                      className="w-full bg-white border border-amber-200 text-xs rounded-lg p-1.5 font-bold outline-none text-slate-800 focus:border-amber-500 font-sans"
                    />
                    <div className="flex justify-between text-[10px] text-amber-900 font-bold font-sans">
                      <span>Restante en Cuenta:</span>
                      <span className="font-mono">${(editTotalUsd - (parseFloat(editPaidAmountUsd) || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Pricing summary */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5 font-sans">
                  <div className="flex justify-between items-baseline font-sans">
                    <span className="text-xs font-bold text-slate-500">Nuevo Total</span>
                    <span className="text-lg font-black text-slate-800 font-mono">${editTotalUsd.toFixed(2)} USD</span>
                  </div>
                  {rates.usdToVes > 0 && (
                    <div className="flex justify-between items-baseline text-[10px] font-mono text-teal-600 font-bold font-sans">
                      <span>Total en Bolívares:</span>
                      <span>Bs. {(editTotalUsd * rates.usdToVes).toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                    </div>
                  )}
                </div>

                {editError && (
                  <p className="text-[10px] p-2 bg-rose-50 text-rose-500 border border-rose-100 rounded-lg font-bold font-sans">⚠ {editError}</p>
                )}

                <div className="pt-2 flex gap-2 font-sans font-sans">
                  <button
                    type="button"
                    onClick={() => setEditingPurchase(null)}
                    className="flex-1 py-1.5 text-xs font-bold bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition cursor-pointer font-sans"
                  >
                    Salir
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={submitEditPurchase}
                    className="flex-1 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition shadow-xs cursor-pointer font-sans"
                  >
                    {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
