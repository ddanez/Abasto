import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  AlertTriangle,
  Grid,
  Sparkles,
  ChevronDown,
  X,
  Store
} from 'lucide-react';
import { Product, CategoryType, ProductUnit, ExchangeRate } from '../types';

interface ProductsModuleProps {
  products: Product[];
  rates: ExchangeRate;
  onAddProduct: (prod: Omit<Product, 'id'>) => Promise<void>;
  onUpdateProduct: (id: string, prod: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
}

const CATEGORY_LABELS: Record<CategoryType, string> = {
  viveres: 'Víveres 🫓',
  frutas: 'Frutas 🍎',
  verduras: 'Verduras 🥕'
};

const UNIT_LABELS: Record<ProductUnit, string> = {
  kg: 'Kg (Kilogramo)',
  unidad: 'Unidad',
  paquete: 'Paquete',
  mano: 'Mano (Plátanos/etc)',
  saco: 'Saco',
  litro: 'Litro (L)'
};

const EMOJI_BANK = [
  '🍎', '🍏', '🍌', '🍅', '🥬', '🥕', '🥔', '🧅', '🧄', '🥦', '🥑', '🍋', '🍊', '🍇', '🍓', '🍉', '🍍', '🍈', '🌽', '🌶️', '🫓', '🍚', '🥛', '🥚', '🍾', '🧂', '🥫', '🥖', '🧀', '🫙', '🥩', '☕', '🥤', '🥔'
];

export default function ProductsModule({ products, rates, onAddProduct, onUpdateProduct, onDeleteProduct }: ProductsModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | CategoryType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('viveres');
  const [emoji, setEmoji] = useState('🍎');
  const [stock, setStock] = useState('0');
  const [unit, setUnit] = useState<ProductUnit>('unidad');
  const [costUsd, setCostUsd] = useState('0');
  const [priceUsd, setPriceUsd] = useState('0');
  const [minStock, setMinStock] = useState('5');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('viveres');
    setEmoji('🍎');
    setStock('0');
    setUnit('unidad');
    setCostUsd('0');
    setPriceUsd('0');
    setMinStock('5');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategory(prod.category);
    setEmoji(prod.emoji);
    setStock(String(prod.stock));
    setUnit(prod.unit);
    setCostUsd(String(prod.costUsd));
    setPriceUsd(String(prod.priceUsd));
    setMinStock(String(prod.minStock));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      name,
      category,
      emoji,
      stock: parseFloat(stock) || 0,
      unit,
      costUsd: parseFloat(costUsd) || 0,
      priceUsd: parseFloat(priceUsd) || 0,
      minStock: parseFloat(minStock) || 0
    };

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, payload);
    } else {
      await onAddProduct(payload);
    }
    setIsModalOpen(false);
  };

  const formatSecondaryCurrency = (usdVal: number) => {
    const bsf = usdVal * rates.usdToVes;
    const cop = usdVal * rates.usdToCop;
    return `Bs. ${bsf.toFixed(1)} / COP $${Math.round(cop).toLocaleString('es-CO')}`;
  };

  return (
    <div id="products-module" className="space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            🥦 Catálogo e Inventario de Productos
          </h2>
          <p className="text-xs text-slate-500">Agrega, consulta y edita víveres, frutas fresca y verduras del negocio</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-sm cursor-pointer transition-all hover:scale-[1.01] text-xs"
        >
          <Plus size={16} />
          Nuevo Producto
        </button>
      </div>

      {/* Filters & Search section */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-3.5 text-slate-400">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre (ej: tomate, harina)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 outline-none text-sm text-slate-800 bg-white placeholder-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
          />
        </div>

        {/* Category Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${selectedCategory === 'all' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedCategory('viveres')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${selectedCategory === 'viveres' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Víveres 🫓
          </button>
          <button
            onClick={() => setSelectedCategory('frutas')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${selectedCategory === 'frutas' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Frutas 🍎
          </button>
          <button
            onClick={() => setSelectedCategory('verduras')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${selectedCategory === 'verduras' ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            Verduras 🥕
          </button>
        </div>
      </div>

      {/* Grid of Product Cards */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="bg-slate-100 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto text-slate-400">
            <Store size={24} />
          </div>
          <p className="font-bold text-slate-700">No se encontraron productos</p>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">Prueba ajustando el filtro o busca con otra palabra clave en el menú.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(p => {
            const isLowStock = p.stock <= p.minStock;
            return (
              <div
                key={p.id}
                id={`product-card-${p.id}`}
                className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border relative flex flex-col justify-between ${isLowStock ? 'border-rose-200 hover:border-rose-400 bg-rose-50/10' : 'border-slate-100 hover:border-slate-300'}`}
              >
                {/* Product header styling with color based on stock */}
                <div className={`p-4 flex items-start gap-3 relative ${isLowStock ? 'bg-rose-50/50' : 'bg-slate-50/30'}`}>
                  {/* Emoji Icon Container */}
                  <div className="bg-white p-3 rounded-2xl shadow-inner text-3xl select-none w-14 h-14 flex items-center justify-center border border-slate-100/80">
                    {p.emoji}
                  </div>

                  {/* Product quick labels */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">{CATEGORY_LABELS[p.category]}</span>
                    <h3 className="text-sm font-bold text-slate-800 truncate" title={p.name}>{p.name}</h3>
                    <span className="text-[11px] font-mono font-bold text-slate-500 block">Unidad: {p.unit}</span>
                  </div>

                  {/* Stock counter label */}
                  <div className="text-right">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full ${isLowStock ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                      {p.stock} {p.unit}
                    </span>
                  </div>
                </div>

                {/* Body details & Pricing hierarchy */}
                <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                  {/* Price display stack */}
                  <div className="space-y-1 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 shadow-inner">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Precio de venta público</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-800">${p.priceUsd.toFixed(2)}</span>
                      <span className="text-xs text-slate-400 font-bold uppercase">USD</span>
                    </div>
                    {rates.usdToVes > 0 && rates.usdToCop > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 block pt-0.5">
                        {formatSecondaryCurrency(p.priceUsd)}
                      </span>
                    )}
                  </div>

                  {/* Cost & Min thresholds */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 px-2.5 py-1.5 rounded-xl text-slate-500">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold block">Costo Compra</span>
                      <span className="font-bold text-slate-700">${p.costUsd.toFixed(2)} USD</span>
                    </div>
                    <div className="bg-slate-50 px-2.5 py-1.5 rounded-xl text-slate-500">
                      <span className="text-[9px] text-slate-400 uppercase font-semibold block">Stock Mínimo</span>
                      <span className="font-bold text-slate-700">{p.minStock} {p.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Edit/Delete buttons */}
                <div className="px-4 pb-4 flex items-center justify-between gap-2">
                  {isLowStock ? (
                    <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle size={12} /> Stock Crítico!
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono">Disponibilidad OK</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Estás seguro de que deseas eliminar "${p.name}" del catálogo? esta acción es irreversible.`)) {
                          onDeleteProduct(p.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* POPUP MODAL (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col justify-between">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-400" />
                  {editingProduct ? 'Editar Producto del Almacén' : 'Añadir Nuevo Producto al Catálogo'}
                </h3>
                <p className="text-xs text-slate-400">Introduce los parámetros comerciales para el control fiscal e inventario</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 px-2 hover:bg-slate-800 text-slate-400 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Selector */}
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5">Categoría Comercial *</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value as CategoryType);
                      // Set a fallback/suitable emoji based on category
                      if (e.target.value === 'frutas') setEmoji('🍎');
                      if (e.target.value === 'verduras') setEmoji('🥕');
                      if (e.target.value === 'viveres') setEmoji('🫓');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800 text-sm font-semibold focus:border-emerald-500 focus:bg-white transition-all"
                  >
                    <option value="viveres">Víveres 🫓</option>
                    <option value="frutas">Frutas frescas 🍎</option>
                    <option value="verduras">Verduras y Hortalizas 🥕</option>
                  </select>
                </div>

                {/* Product Unit */}
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5">Unidad de Medida *</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as ProductUnit)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800 text-sm font-semibold focus:border-emerald-500 focus:bg-white transition-all"
                  >
                    {Object.entries(UNIT_LABELS).map(([unitKey, label]) => (
                      <option key={unitKey} value={unitKey}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Name */}
                <div className="md:col-span-2">
                  <label className="block text-slate-700 text-xs font-bold mb-1.5">Nombre del Producto / Alimento *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Cilantro fresco, Harina Pan, Papas Blancas"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800 text-sm focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Emoji Selector Bank */}
                <div className="md:col-span-2">
                  <label className="block text-slate-700 text-xs font-bold mb-1.5">Emoji Ilustrativo ({emoji})</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {EMOJI_BANK.map((emo) => (
                      <button
                        type="button"
                        key={emo}
                        onClick={() => setEmoji(emo)}
                        className={`text-2xl p-1.5 rounded-lg border hover:scale-110 active:scale-95 transition-all cursor-pointer ${emoji === emo ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200'}`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cost buying USD */}
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5">Costo de Compra (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={costUsd}
                      onChange={(e) => setCostUsd(e.target.value)}
                      className="w-full pl-7 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800 text-sm focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Selling Price USD */}
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5">Precio de Venta (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={priceUsd}
                      onChange={(e) => setPriceUsd(e.target.value)}
                      className="w-full pl-7 bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800 text-sm font-bold text-emerald-600 focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Starting Stock */}
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5">Stock en Tienda *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800 text-sm focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Min stock for warnings */}
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1.5">Stock Mínimo de Alerta</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800 text-sm focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 shadow-sm cursor-pointer"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Añadir Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
