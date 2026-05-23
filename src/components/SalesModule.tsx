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
  Scale,
  Edit,
  X,
  Calendar,
  UserCheck,
  Clock
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
  onAddCustomer?: (customerData: Omit<Customer, 'id'>) => Promise<any>;
  sales?: Sale[];
  onEditSale?: (id: string, saleData: any) => Promise<any>;
  onDeleteSale?: (id: string) => Promise<any>;
}

export default function SalesModule({
  products,
  customers,
  rates,
  onRecordSale,
  onAddCustomer,
  sales = [],
  onEditSale,
  onDeleteSale
}: SalesModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number | string }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('casual');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cxc' | 'transfer'>('cash');
  const [downpaymentUsd, setDownpaymentUsd] = useState<string>('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successReceipt, setSuccessReceipt] = useState<Sale | null>(null);

  // Tab and search for History
  const [activeSubTab, setActiveSubTab] = useState<'checkout' | 'history'>('checkout');
  const [historySearch, setHistorySearch] = useState('');

  // Editing sale state variables
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editCustomerId, setEditCustomerId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'cash' | 'cxc' | 'transfer'>('cash');
  const [editPaidAmountUsd, setEditPaidAmountUsd] = useState('0');
  const [editItems, setEditItems] = useState<{ productId: string; name: string; emoji: string; quantity: number | string; priceUsd: number; unit: string }[]>([]);
  const [editSearchQuery, setEditSearchQuery] = useState('');
  const [editError, setEditError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const startEditingSale = (sale: Sale) => {
    setEditingSale(sale);
    setEditCustomerId(sale.customerId);
    setEditDate(sale.date ? sale.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditPaymentMethod(sale.paymentMethod);
    setEditPaidAmountUsd(String(sale.paidAmountUsd));
    setEditItems(sale.items.map(i => ({
      productId: i.productId,
      name: i.name,
      emoji: i.emoji,
      quantity: i.quantity,
      priceUsd: i.priceUsd,
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
        priceUsd: prod.priceUsd,
        unit: prod.unit
      }]);
    }
  };

  const submitEditSale = async () => {
    if (editItems.length === 0) {
      setEditError('La venta debe tener al menos un producto.');
      return;
    }
    for (const item of editItems) {
      const q = parseFloat(String(item.quantity)) || 0;
      if (q <= 0) {
        setEditError(`La cantidad para ${item.name} debe ser mayor a 0.`);
        return;
      }
    }
    
    // Total calculation
    const computedTotal = editItems.reduce((sum, item) => sum + (item.priceUsd * (parseFloat(String(item.quantity)) || 0)), 0);
    const paidVal = editPaymentMethod === 'cxc' ? (parseFloat(editPaidAmountUsd) || 0) : computedTotal;
    
    setIsUpdating(true);
    setEditError('');
    if (onEditSale && editingSale) {
      try {
        const selectedCustObj = customers.find(c => c.id === editCustomerId);
        await onEditSale(editingSale.id, {
          customerId: editCustomerId,
          customerName: selectedCustObj ? selectedCustObj.name : 'Cliente Casual',
          items: editItems.map(i => ({
            productId: i.productId,
            name: i.name,
            emoji: i.emoji,
            quantity: parseFloat(String(i.quantity)) || 0,
            priceUsd: i.priceUsd,
            unit: i.unit
          })),
          paymentMethod: editPaymentMethod,
          paidAmountUsd: paidVal,
          date: new Date(editDate).toISOString()
        });
        setEditingSale(null);
      } catch (err: any) {
        setEditError(err.message || 'Error al actualizar la venta');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDeleteHistorySale = async (id: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta venta de forma permanente? El inventario de productos se restablecerá.')) {
      try {
        if (onDeleteSale) {
          await onDeleteSale(id);
          alert('Venta eliminada con éxito y stock restablecido.');
        }
      } catch (err: any) {
        alert(err.message || 'Error al eliminar la venta');
      }
    }
  };

  // Quick Customer state variables
  const [showQuickCustomerAdd, setShowQuickCustomerAdd] = useState(false);
  const [quickCustName, setQuickCustName] = useState('');
  const [quickCustPhone, setQuickCustPhone] = useState('');
  const [quickCustDoc, setQuickCustDoc] = useState('');
  const [quickCustEmail, setQuickCustEmail] = useState('');
  const [quickCustLimit, setQuickCustLimit] = useState('200');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);

  const handleQuickAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCustName || !quickCustDoc) {
      alert('El Nombre y Cédula/RIF del cliente son obligatorios.');
      return;
    }
    setIsAddingCustomer(true);
    try {
      if (onAddCustomer) {
        const newCust = await onAddCustomer({
          name: quickCustName,
          phone: quickCustPhone,
          document: quickCustDoc,
          email: quickCustEmail,
          creditLimitUsd: parseFloat(quickCustLimit) || 0
        });
        if (newCust && newCust.id) {
          setSelectedCustomerId(newCust.id);
          setShowQuickCustomerAdd(false);
          // Reset fields
          setQuickCustName('');
          setQuickCustPhone('');
          setQuickCustDoc('');
          setQuickCustEmail('');
          setQuickCustLimit('200');
        } else {
          alert('No se pudo registrar el cliente. Intente nuevamente.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Error al registrar el cliente.');
    } finally {
      setIsAddingCustomer(false);
    }
  };

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
    return cart.reduce((sum, item) => {
      const qty = parseFloat(String(item.quantity)) || 0;
      return sum + (item.product.priceUsd * qty);
    }, 0);
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
      const currentQty = parseFloat(String(existing.quantity)) || 0;
      if (currentQty >= product.stock) {
        alert(`No hay suficiente stock. Solo queda un stock disponible de ${product.stock} ${product.unit} de ${product.name}.`);
        return;
      }
      setCart(cart.map(item =>
        item.product.id === product.id ? { ...item, quantity: Number((currentQty + 1).toFixed(3)) } : item
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

    const currentQty = parseFloat(String(item.quantity)) || 0;
    const newQty = Number((currentQty + val).toFixed(3));
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

  const handleManualQuantityChange = (productId: string, valStr: string) => {
    const cleanStr = valStr.replace(',', '.'); // Permitir comas
    setCart(cart.map(i =>
      i.product.id === productId ? { ...i, quantity: cleanStr } : i
    ));
    setSuccessReceipt(null);
  };

  const handleManualQuantityBlur = (productId: string, valStr: string) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    let parsed = parseFloat(valStr) || 0;
    if (parsed <= 0) {
      removeFromCart(productId);
    } else if (parsed > item.product.stock) {
      alert(`La cantidad ingresada supera el stock disponible (${item.product.stock} ${item.product.unit}). Se ajustó al máximo disponible.`);
      setCart(cart.map(i =>
        i.product.id === productId ? { ...i, quantity: item.product.stock } : i
      ));
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

  // Submit sale handler
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Validar cantidades inválidas antes de enviar
    for (const item of cart) {
      const qty = parseFloat(String(item.quantity)) || 0;
      if (qty <= 0) {
        setErrorMessage(`La cantidad para ${item.product.name} debe ser mayor a 0.`);
        return;
      }
    }

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
        quantity: parseFloat(String(item.quantity)) || 0,
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

  // Filter sales history
  const filteredSalesHistory = useMemo(() => {
    if (!historySearch) return sales;
    const term = historySearch.toLowerCase();
    return sales.filter(s =>
      s.invoiceNumber.toLowerCase().includes(term) ||
      s.customerName.toLowerCase().includes(term) ||
      s.items.some(item => item.name.toLowerCase().includes(term))
    );
  }, [sales, historySearch]);

  const editTotalUsd = useMemo(() => {
    return editItems.reduce((acc, item) => {
      const q = parseFloat(String(item.quantity)) || 0;
      return acc + (item.priceUsd * q);
    }, 0);
  }, [editItems]);

  const filteredEditProducts = useMemo(() => {
    if (!editSearchQuery) return products.slice(0, 5);
    return products.filter(p => p.name.toLowerCase().includes(editSearchQuery.toLowerCase())).slice(0, 5);
  }, [products, editSearchQuery]);

  return (
    <div className="space-y-4 w-full animate-fade-in font-sans">
      {/* Sub Navigation and Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4.5 rounded-3xl border border-slate-150/45 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <ShoppingCart className="text-emerald-500" /> Caja registradora y Facturación
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">Proceda con el cobro al detal de víveres/verduras o gestione registros históricos de ventas.</p>
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
            🛒 Nueva Venta
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
            📋 Historial de Ventas
          </button>
        </div>
      </div>

      {activeSubTab === 'checkout' ? (
        <div id="sales-module" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* LEFT: Searchable Product Rack for selection */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    🛍 Estantería de Productos
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">Selecciona o haz clic en los productos solicitados por el cliente</p>
                </div>
                {/* Search Input inside the rack list */}
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-sans">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar verdura/víveres..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 w-full sm:w-48 text-xs border border-slate-200 outline-none rounded-xl focus:border-emerald-500 transition-all font-semibold font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[58vh] overflow-y-auto pr-1">
                {filteredProducts.map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="flex flex-col justify-between p-3 bg-slate-50 hover:bg-emerald-50/40 border border-slate-100 hover:border-emerald-200 rounded-2xl text-left cursor-pointer transition-all active:scale-[0.98] group relative font-sans"
                  >
                    <div className="absolute top-2.5 right-2 px-1.5 py-0.5 bg-slate-200/60 rounded text-[9px] font-bold text-slate-600">
                      {p.stock} {p.unit}
                    </div>

                    <div className="text-3xl mb-1.5 select-none">{p.emoji}</div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-700 leading-tight truncate group-hover:text-emerald-800" title={p.name}>
                        {p.name}
                      </h4>
                      <div className="flex items-baseline gap-1 mt-1 font-sans">
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
              <div className="bg-indigo-50 border-2 border-indigo-200 p-6 rounded-3xl space-y-4 shadow-sm animate-scale-up border-dashed">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500 text-white p-2.5 rounded-2xl shadow-sm">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500 font-sans">Transacción Completada</span>
                    <h4 className="text-base font-bold text-slate-800 font-sans">Factura de Caja #{successReceipt.invoiceNumber}</h4>
                  </div>
                </div>

                {/* Receipt Summary Table */}
                <div className="bg-white rounded-2xl p-4 border border-indigo-100 space-y-3 shadow-inner font-sans">
                  <div className="flex justify-between text-xs border-b border-indigo-100 pb-2">
                    <span className="font-bold text-slate-500">Beneficiario:</span>
                    <span className="font-bold text-slate-800">{successReceipt.customerName}</span>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {successReceipt.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs font-sans">
                        <span className="text-slate-600 font-medium">{item.emoji} {item.name} x {item.quantity} {item.unit}</span>
                        <span className="text-slate-800 font-bold font-sans">${item.totalUsd.toFixed(2)} USD</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-indigo-100 pt-2 flex flex-col items-end">
                    <div className="flex justify-between w-full text-xs font-bold text-slate-700">
                      <span>Método de pago:</span>
                      <span className="uppercase text-indigo-600 font-extrabold">
                        {successReceipt.paymentMethod === 'cxc' ? 'Crédito (CxC)' : successReceipt.paymentMethod === 'transfer' ? 'Pago Móvil' : 'Efectivo'}
                      </span>
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
                    className="flex-1 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                  >
                    <FileText size={14} /> Imprimir Comprobante Fiscal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuccessReceipt(null)}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer font-sans"
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
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-2 font-sans">
                    <ShoppingCart size={18} className="text-emerald-500 font-sans" />
                    Cesta de Compra ({cart.length} productos)
                  </span>
                  {cart.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-xs font-bold text-rose-500 hover:text-rose-700 transition font-sans"
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
                      <p className="text-xs font-bold text-slate-500 font-sans">La cesta está vacía</p>
                      <p className="text-[10px] text-slate-400 font-sans">Haz clic en productos a la izquierda para agregarlos al checkout.</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div
                        key={item.product.id}
                        className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-100/80 shadow-inner font-sans"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-2xl select-none">{item.product.emoji}</span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-800 truncate font-sans" title={item.product.name}>
                              {item.product.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-bold block font-mono">
                              ${item.product.priceUsd.toFixed(2)} USD / {item.product.unit}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-1 py-0.5 max-w-[125px]">
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
                              title="Escriba la cantidad exacta (admite decimales)"
                              placeholder="0"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="p-1 hover:text-emerald-500 shrink-0 cursor-pointer"
                              title="Sumar 1"
                            >
                              <Plus size={11} />
                            </button>
                          </div>

                          <span className="text-xs font-black text-slate-700 font-mono w-14 text-right">
                            ${(item.product.priceUsd * (parseFloat(String(item.quantity)) || 0)).toFixed(2)}
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

                <div className="space-y-4 pt-3 border-t border-slate-100">
                  {/* 1. Client selector */}
                  <div className="grid grid-cols-1 gap-2 font-sans">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Identificar Cliente</label>
                      {onAddCustomer && (
                        <button
                          type="button"
                          onClick={() => setShowQuickCustomerAdd(!showQuickCustomerAdd)}
                          className="text-[10px] text-green-655 font-extrabold hover:text-green-700 hover:underline flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus size={11} className="stroke-[3px]" /> {showQuickCustomerAdd ? "Cerrar" : "Crear Nuevo Cliente"}
                        </button>
                      )}
                    </div>

                    {!showQuickCustomerAdd ? (
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-slate-400 font-sans">
                          <User size={13} />
                        </span>
                        <select
                          value={selectedCustomerId}
                          onChange={(e) => {
                            setSelectedCustomerId(e.target.value);
                            setDownpaymentUsd('0');
                            setErrorMessage('');
                          }}
                          className="w-full bg-slate-100/60 border border-slate-200 pl-8 rounded-xl p-2.5 outline-none text-slate-800 text-xs font-bold focus:border-emerald-500 transition-all cursor-pointer font-sans"
                        >
                          <option value="casual" className="font-sans">Cliente Casual / Contado General</option>
                          {customers.filter(c => c.id !== 'casual').map(c => (
                            <option key={c.id} value={c.id} className="font-sans">
                              {c.name} ({c.document}) - Límite Cred: ${c.creditLimitUsd}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 animate-scale-up font-sans">
                        <p className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">⚡ Registro Rápido de Cliente</p>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Nombre Completo *</label>
                            <input
                              type="text"
                              placeholder="Ej. Juan Pérez"
                              value={quickCustName}
                              onChange={(e) => setQuickCustName(e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg p-2 w-full outline-none text-xs font-bold focus:border-emerald-500 font-sans"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Cédula / RIF *</label>
                            <input
                              type="text"
                              placeholder="Ej. V-25444333"
                              value={quickCustDoc}
                              onChange={(e) => setQuickCustDoc(e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg p-2 w-full outline-none text-xs font-bold focus:border-emerald-500 font-sans"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Teléfono</label>
                            <input
                              type="text"
                              placeholder="Ej. 0412-5556677"
                              value={quickCustPhone}
                              onChange={(e) => setQuickCustPhone(e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg p-2 w-full outline-none text-xs font-bold focus:border-emerald-500 font-sans"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Límite Crédito ($)</label>
                            <input
                              type="number"
                              placeholder="Ej. 200"
                              value={quickCustLimit}
                              onChange={(e) => setQuickCustLimit(e.target.value)}
                              className="bg-white border border-slate-200 rounded-lg p-2 w-full outline-none text-xs font-bold focus:border-emerald-500 font-sans"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Correo Electrónico</label>
                          <input
                            type="email"
                            placeholder="Ej. juan@correo.com"
                            value={quickCustEmail}
                            onChange={(e) => setQuickCustEmail(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-2 w-full outline-none text-xs font-bold focus:border-emerald-500 font-sans"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowQuickCustomerAdd(false);
                              setErrorMessage('');
                            }}
                            className="px-2.5 py-1.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg hover:bg-slate-300 transition cursor-pointer font-sans"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={isAddingCustomer}
                            onClick={handleQuickAddCustomerSubmit}
                            className="px-2.5 py-1.5 bg-green-600 text-white text-[10px] font-bold rounded-lg hover:bg-green-700 transition cursor-pointer font-sans"
                          >
                            {isAddingCustomer ? 'Guardando...' : 'Crear y Seleccionar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Payment terms selector */}
                  <div className="grid grid-cols-1 gap-1 font-sans">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Condiciones de Venta</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('cash');
                          setDownpaymentUsd('0');
                          setErrorMessage('');
                        }}
                        className={`flex items-center gap-1.5 justify-center p-2.5 rounded-xl border text-xs font-extrabold transition cursor-pointer font-sans ${
                          paymentMethod === 'cash'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <DollarSign size={13} /> Efectivo
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPaymentMethod('transfer');
                          setDownpaymentUsd('0');
                          setErrorMessage('');
                        }}
                        className={`flex items-center gap-1.5 justify-center p-2.5 rounded-xl border text-xs font-extrabold transition cursor-pointer font-sans ${
                          paymentMethod === 'transfer'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard size={13} /> Pago Móvil
                      </button>

                      <button
                        type="button"
                        disabled={selectedCustomerId === 'casual'}
                        onClick={() => {
                          if (selectedCustomerId === 'casual') return;
                          setPaymentMethod('cxc');
                          setDownpaymentUsd('0');
                          setErrorMessage('');
                        }}
                        className={`flex items-center gap-1.5 justify-center p-2.5 rounded-xl border text-xs font-extrabold transition font-sans ${
                          selectedCustomerId === 'casual'
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-100 text-slate-400'
                            : paymentMethod === 'cxc'
                            ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer'
                        }`}
                        title={selectedCustomerId === 'casual' ? "Se requiere seleccionar un cliente nominal para vender a crédito" : ""}
                      >
                        <Scale size={13} /> Crédito (CxC)
                      </button>
                    </div>

                    {/* Credit Limit Indicator */}
                    {selectedCustomer && selectedCustomer.id !== 'casual' && (
                      <div className="mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-150 flex justify-between items-center text-[10px] font-bold text-slate-600">
                        <span>Límite de Crédito del Cliente:</span>
                        <span className={creditValidation.valid ? "text-emerald-600 font-extrabold font-mono" : "text-rose-500 font-extrabold font-mono"}>
                          ${selectedCustomer.creditLimitUsd} USD
                        </span>
                      </div>
                    )}

                    {errorMessage && (
                      <div className="p-2.5 bg-rose-50 text-rose-600 font-bold text-[11px] rounded-lg border border-rose-150 animate-pulse mt-2 font-sans">
                        ⚠ {errorMessage}
                      </div>
                    )}

                    {/* DOWNPAYMENT FIELD IF CREDIT */}
                    {paymentMethod === 'cxc' && (
                      <div className="mt-2.5 p-3.5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2.5 animate-scale-up font-sans">
                        <label className="text-[10px] uppercase font-black text-amber-800 block">Abono Inicial de Caja (Opcional - USD)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-slate-500 font-extrabold text-xs">$</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            max={totalUsd}
                            value={downpaymentUsd}
                            onChange={(e) => {
                              setDownpaymentUsd(e.target.value);
                              setErrorMessage('');
                            }}
                            className="w-full pl-7 bg-white border border-amber-200 rounded-xl p-2 outline-none text-slate-800 text-xs font-bold focus:border-amber-500 font-sans"
                            placeholder="Ej: 5.00"
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-amber-900 font-sans">
                          <span>Monto que quedará en Cuenta por Cobrar:</span>
                          <span className="font-extrabold text-amber-700 font-mono">
                            ${(totalUsd - (parseFloat(downpaymentUsd) || 0)).toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cart Pricing Panel */}
                {cart.length > 0 && (
                  <div className="bg-slate-9 border border-slate-100 p-4 rounded-3xl mt-4 space-y-3.5 bg-slate-50 shadow-inner font-sans">
                    <div className="space-y-1 border-b border-slate-200/55 pb-3">
                      <div className="flex justify-between items-baseline text-slate-600 font-bold text-xs uppercase tracking-wider">
                        <span>Total Operación</span>
                        <span>Dólares (USD)</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-3xl font-black text-slate-800 font-mono">${totalUsd.toFixed(2)}</span>
                        <span className="text-xs font-bold text-slate-400">USD</span>
                      </div>
                    </div>

                    {/* Converted Currencies Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-150 relative">
                        <span className="absolute top-1.5 right-1.5 text-[9px] bg-slate-100 px-1 font-bold rounded text-slate-400 font-sans">VES</span>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Bolívares</span>
                        <span className="text-sm font-extrabold text-teal-600 block mt-1 font-mono">Bs. {totalVes.toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                      </div>

                      <div className="bg-white p-2.5 rounded-xl border border-slate-150 relative">
                        <span className="absolute top-1.5 right-1.5 text-[9px] bg-slate-100 px-1 font-bold rounded text-slate-400 font-sans">COP</span>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">Pesos Col</span>
                        <span className="text-sm font-extrabold text-teal-600 block mt-1 font-mono">${Math.round(totalCop).toLocaleString('es-CO')}</span>
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
        </div>
      ) : (
        /* HISTORIAL DE VENTAS */
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">📋 Transacciones Registradas</h3>
              <p className="text-xs text-slate-500 font-sans">Busque, edite cantidades, modifique métodos de pago o anule facturas de venta.</p>
            </div>
            {/* Search Input */}
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-sans">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Buscar por cliente, factura o artículo..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-full sm:w-64 text-xs border border-slate-200 outline-none rounded-xl focus:border-green-500 transition-all font-semibold font-sans"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100 font-sans">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="p-3.5">Factura</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Productos</th>
                  <th className="p-3.5 text-right font-bold">Total ($)</th>
                  <th className="p-3.5 text-center">Método</th>
                  <th className="p-3.5 text-center font-sans">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                {filteredSalesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium font-sans">
                      No se encontraron transacciones en el historial.
                    </td>
                  </tr>
                ) : (
                  filteredSalesHistory.map(s => {
                    const formattedDate = s.date ? new Date(s.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'S/F';
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-all font-medium font-sans">
                        <td className="p-3.5 font-bold text-slate-800 font-mono">{s.invoiceNumber}</td>
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">{formattedDate}</td>
                        <td className="p-3.5 font-bold text-slate-800">{s.customerName}</td>
                        <td className="p-3.5 max-w-xs truncate text-[11px]" title={s.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}>
                          {s.items.map((i, idx) => (
                            <span key={idx} className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold mr-1 my-0.5 whitespace-nowrap">
                              {i.emoji} {i.quantity} {i.unit}
                            </span>
                          ))}
                        </td>
                        <td className="p-3.5 text-right font-black text-slate-800 font-mono">
                          ${s.totalUsd.toFixed(2)}
                          <span className="block text-[9px] font-bold text-teal-600">Bs.{(s.totalUsd * (s.rateAtSale?.usdToVes || rates.usdToVes)).toFixed(1)}</span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 font-bold rounded-lg text-[9px] uppercase tracking-wider ${
                            s.paymentMethod === 'cxc'
                              ? 'bg-amber-50 text-amber-700 border border-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {s.paymentMethod === 'cxc' ? 'Crédito' : s.paymentMethod === 'transfer' ? 'Pago Móvil' : 'Efectivo'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap space-x-1.5 font-sans">
                          <button
                            type="button"
                            onClick={() => startEditingSale(s)}
                            className="inline-flex items-center gap-1 p-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 rounded-lg text-[11px] font-bold cursor-pointer transition-all font-sans"
                            title="Editar factura y modificar stock"
                          >
                            <Edit size={11} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHistorySale(s.id)}
                            className="inline-flex items-center gap-1 p-1.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg text-[11px] font-bold cursor-pointer transition-all font-sans"
                            title="Eliminar venta y reintegrar stock"
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

      {/* EDITING MODAL WINDOW */}
      {editingSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all font-sans">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-scale-up">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Edit size={16} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-sans">Modificar Registro de Venta</h3>
                  <p className="text-[10px] text-slate-500 font-sans">Factura ID: <span className="font-mono font-bold text-amber-600 font-sans">{editingSale.invoiceNumber}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSale(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Work Area */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 font-sans">
              {/* Left Column: Items Editor (8 cols) */}
              <div className="md:col-span-8 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">📦 Productos en Factura</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-lg">{editItems.length} ítems</span>
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {editItems.map((item, index) => (
                      <div
                        key={item.productId}
                        className="flex justify-between items-center p-2.5 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xl select-none">{item.emoji}</span>
                          <div className="min-w-0 font-sans">
                            <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                            <span className="text-[9px] text-slate-400 font-bold block">${item.priceUsd.toFixed(2)} USD / {item.unit}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 font-sans">
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
                              className="w-12 text-center text-xs font-black text-slate-800 focus:outline-none"
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

                          <span className="text-xs font-black text-slate-850 font-mono w-16 text-right">
                            ${(item.priceUsd * (parseFloat(String(item.quantity)) || 0)).toFixed(2)}
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
                      <Plus size={13} className="text-emerald-500 stroke-[3px]" /> Agregar otro producto a la factura
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
                        <span className="truncate">{p.emoji} {p.name} <span className="text-[10px] font-medium text-slate-400 font-mono">({p.stock} dispon.)</span></span>
                        <span className="text-slate-800 font-extrabold text-[11px]">${p.priceUsd.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Customer & Payments Form (4 cols) */}
              <div className="md:col-span-4 bg-slate-50/50 border border-slate-100 p-4.5 rounded-2xl space-y-4 font-sans">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-sans">📋 Condiciones & Facturación</h4>

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

                {/* Customer */}
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1 font-sans">Cliente Receptor</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-slate-400 font-sans">
                      <User size={12} />
                    </span>
                    <select
                      value={editCustomerId}
                      onChange={(e) => {
                        setEditCustomerId(e.target.value);
                        setEditPaidAmountUsd('0');
                      }}
                      className="w-full bg-white border border-slate-200 pl-7 text-xs rounded-lg p-1.5 font-bold outline-none text-slate-800 focus:border-amber-500 cursor-pointer font-sans"
                    >
                      <option value="casual" className="font-sans">Cliente Casual / Contado General</option>
                      {customers.filter(c => c.id !== 'casual').map(c => (
                        <option key={c.id} value={c.id} className="font-sans">
                          {c.name} ({c.document})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Method */}
                <div>
                  <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1 font-sans">Modo de Pago</label>
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
                    <option value="cxc" disabled={editCustomerId === 'casual'} className="font-sans font-bold">Crédito (CxC Registrada)</option>
                  </select>
                </div>

                {/* Downpayment if credit */}
                {editPaymentMethod === 'cxc' && (
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
                <div className="pt-3 border-t border-slate-100 space-y-2.5 font-sans font-sans">
                  <div className="flex justify-between items-baseline font-sans">
                    <span className="text-xs font-bold text-slate-500">Nuevo Total</span>
                    <span className="text-lg font-black text-slate-800 font-mono">${editTotalUsd.toFixed(2)} USD</span>
                  </div>
                  {rates.usdToVes > 0 && (
                    <div className="flex justify-between items-baseline text-[10px] font-mono text-teal-600 font-bold">
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
                    onClick={() => setEditingSale(null)}
                    className="flex-1 py-1.5 text-xs font-bold bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition cursor-pointer font-sans"
                  >
                    Salir
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={submitEditSale}
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
