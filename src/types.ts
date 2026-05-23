export type CategoryType = 'viveres' | 'frutas' | 'verduras';

export type ProductUnit = 'kg' | 'unidad' | 'paquete' | 'mano' | 'saco' | 'litro';

export interface Product {
  id: string;
  name: string;
  category: CategoryType;
  emoji: string;
  stock: number;
  unit: ProductUnit;
  costUsd: number;  // Precio de compra
  priceUsd: number; // Precio de venta
  minStock: number; // Stock mínimo para alertas
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  document: string; // Cédula / RIF / NIT
  email: string;
  creditLimitUsd: number;
}

export interface Provider {
  id: string;
  name: string;
  phone: string;
  document: string; // RIF / NIT / Cédula
  email: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  emoji: string;
  quantity: number;
  priceUsd: number;
  unit: ProductUnit;
  totalUsd: number;
}

export interface ExchangeRate {
  usdToVes: number; // 1 USD = X VES
  usdToCop: number; // 1 USD = X COP
  date: string;     // YYYY-MM-DD
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string; // "casual" para clientes casuales
  customerName: string;
  items: SaleItem[];
  totalUsd: number;
  paymentMethod: 'cash' | 'cxc' | 'transfer';
  paidAmountUsd: number;
  cxcBalanceUsd: number;
  date: string; // ISO String o YYYY-MM-DD
  rateAtSale: ExchangeRate;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  emoji: string;
  quantity: number;
  costUsd: number;
  unit: ProductUnit;
  totalUsd: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  providerId: string;
  providerName: string;
  items: PurchaseItem[];
  totalUsd: number;
  paymentMethod: 'cash' | 'cxp' | 'transfer';
  paidAmountUsd: number;
  cxpBalanceUsd: number;
  date: string;
  rateAtPurchase: ExchangeRate;
}

export interface DebtPayment {
  id: string;
  date: string;
  amountUsd: number;
  paymentMethod: 'cash' | 'transfer';
  reference?: string;
}

export interface CxcInvoice {
  id: string;
  saleId: string;
  customerId: string;
  customerName: string;
  totalAmountUsd: number;
  remainingBalanceUsd: number;
  dueDate: string;
  status: 'pendiente' | 'pagado' | 'vencido';
  payments: DebtPayment[];
  date: string;
}

export interface CxpInvoice {
  id: string;
  purchaseId: string;
  providerId: string;
  providerName: string;
  totalAmountUsd: number;
  remainingBalanceUsd: number;
  dueDate: string;
  status: 'pendiente' | 'pagado' | 'vencido';
  payments: DebtPayment[];
  date: string;
}

export interface FinancialStats {
  totalSalesUsd: number;
  totalPurchasesUsd: number;
  grossProfitUsd: number;
  cxcTotalPendingUsd: number;
  cxpTotalPendingUsd: number;
  cashOnHandUsd: number;
  bankBalanceUsd: number;
  inventoryValueCostUsd: number;
  inventoryValueSaleUsd: number;
  projectedProfitUsd: number;
}

export interface CompanyConfig {
  name: string;
  emoji: string;
  document: string;
  phone: string;
  address: string;
  footerText: string;
}

