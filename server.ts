import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Helper to initialize and read/write the JSON DB
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      companyConfig: {
        name: 'Súper Abasto Familiar',
        emoji: '🥦',
        document: 'J-12345678-0',
        phone: '0414-0001122',
        address: 'Av. Principal, Sector Centro, Caracas',
        footerText: '¡Gracias por preferirnos! Guarde su comprobante.'
      },
      rates: { usdToVes: 0, usdToCop: 0, date: '' },
      products: [
        { id: 'p1', name: 'Manzanas Rojas', category: 'frutas', emoji: '🍎', stock: 120, unit: 'kg', costUsd: 1.80, priceUsd: 2.80, minStock: 20 },
        { id: 'p2', name: 'Plátanos / Cambur', category: 'frutas', emoji: '🍌', stock: 180, unit: 'kg', costUsd: 0.50, priceUsd: 0.90, minStock: 25 },
        { id: 'p3', name: 'Tomates Frescos', category: 'verduras', emoji: '🍅', stock: 95, unit: 'kg', costUsd: 1.20, priceUsd: 2.20, minStock: 15 },
        { id: 'p4', name: 'Zanahorias', category: 'verduras', emoji: '🥕', stock: 45, unit: 'kg', costUsd: 0.80, priceUsd: 1.50, minStock: 10 },
        { id: 'p5', name: 'Papas', category: 'verduras', emoji: '🥔', stock: 300, unit: 'kg', costUsd: 0.60, priceUsd: 1.20, minStock: 30 },
        { id: 'p6', name: 'Harina de Maíz', category: 'viveres', emoji: '🫓', stock: 250, unit: 'unidad', costUsd: 1.00, priceUsd: 1.40, minStock: 40 },
        { id: 'p7', name: 'Arroz Blanco 1kg', category: 'viveres', emoji: '🍚', stock: 150, unit: 'unidad', costUsd: 0.85, priceUsd: 1.25, minStock: 30 },
        { id: 'p8', name: 'Leche Líquida 1L', category: 'viveres', emoji: '🥛', stock: 80, unit: 'unidad', costUsd: 1.10, priceUsd: 1.70, minStock: 15 },
        { id: 'p9', name: 'Cartón de Huevos (30 un)', category: 'viveres', emoji: '🥚', stock: 40, unit: 'unidad', costUsd: 3.50, priceUsd: 4.80, minStock: 10 },
        { id: 'p10', name: 'Aceite de Girasol 1L', category: 'viveres', emoji: '🍾', stock: 65, unit: 'unidad', costUsd: 2.20, priceUsd: 3.20, minStock: 12 }
      ],
      customers: [
        { id: 'casual', name: 'Cliente Casual', phone: 'N/A', document: 'V-00000000', email: '', creditLimitUsd: 0 },
        { id: 'c1', name: 'María Rodríguez', phone: '0414-1234567', document: 'V-12345678', email: 'maria@gmail.com', creditLimitUsd: 50 },
        { id: 'c2', name: 'Juan Pérez', phone: '0424-9876543', document: 'V-87654321', email: 'juan.perez@hotmail.com', creditLimitUsd: 100 },
        { id: 'c3', name: 'Cooperativa Sabor', phone: '0412-5554433', document: 'J-31234567-8', email: 'contacto@coopsabor.com', creditLimitUsd: 500 }
      ],
      providers: [
        { id: 'pr1', name: 'Distribuidora Los Andes', phone: '0212-9998877', document: 'J-12345678-9', email: 'ventas@losandes.com' },
        { id: 'pr2', name: 'Finca El Milagro', phone: '0416-8887766', document: 'V-9999888', email: 'fincaelmilagro@gmail.com' },
        { id: 'pr3', name: 'Mercacentro Mayorista', phone: '0212-3334455', document: 'J-98765432-1', email: 'mayorista@mercacentro.com' }
      ],
      sales: [
        {
          id: 's_sample_1',
          invoiceNumber: 'VEN-0001',
          customerId: 'c1',
          customerName: 'María Rodríguez',
          items: [
            { productId: 'p1', name: 'Manzanas Rojas', emoji: '🍎', quantity: 3, priceUsd: 2.80, unit: 'kg', totalUsd: 8.40 },
            { productId: 'p6', name: 'Harina de Maíz', emoji: '🫓', quantity: 5, priceUsd: 1.40, unit: 'unidad', totalUsd: 7.00 },
            { productId: 'p3', name: 'Tomates Frescos', emoji: '🍅', quantity: 2, priceUsd: 2.20, unit: 'kg', totalUsd: 4.40 }
          ],
          totalUsd: 19.80,
          paymentMethod: 'cash',
          paidAmountUsd: 19.80,
          cxcBalanceUsd: 0,
          date: '2026-05-20T14:30:00Z',
          rateAtSale: { usdToVes: 36.5, usdToCop: 3900, date: '2026-05-20' }
        },
        {
          id: 's_sample_2',
          invoiceNumber: 'VEN-0002',
          customerId: 'c2',
          customerName: 'Juan Pérez',
          items: [
            { productId: 'p9', name: 'Cartón de Huevos (30 un)', emoji: '🥚', quantity: 2, priceUsd: 4.80, unit: 'unidad', totalUsd: 9.60 },
            { productId: 'p10', name: 'Aceite de Girasol 1L', emoji: '🍾', quantity: 1, priceUsd: 3.20, unit: 'unidad', totalUsd: 3.20 }
          ],
          totalUsd: 12.80,
          paymentMethod: 'cxc',
          paidAmountUsd: 0,
          cxcBalanceUsd: 12.80,
          date: '2026-05-21T11:15:00Z',
          rateAtSale: { usdToVes: 36.6, usdToCop: 3920, date: '2026-05-21' }
        }
      ],
      purchases: [
        {
          id: 'p_sample_1',
          invoiceNumber: 'COM-0001',
          providerId: 'pr1',
          providerName: 'Distribuidora Los Andes',
          items: [
            { productId: 'p6', name: 'Harina de Maíz', emoji: '🫓', quantity: 100, costUsd: 1.00, unit: 'unidad', totalUsd: 100.00 },
            { productId: 'p7', name: 'Arroz Blanco 1kg', emoji: '🍚', quantity: 100, costUsd: 0.85, unit: 'unidad', totalUsd: 85.00 }
          ],
          totalUsd: 185.00,
          paymentMethod: 'cxp',
          paidAmountUsd: 85.00,
          cxpBalanceUsd: 100.00,
          date: '2026-05-18T09:00:00Z',
          rateAtPurchase: { usdToVes: 36.4, usdToCop: 3880, date: '2026-05-18' }
        }
      ],
      cxc: [
        {
          id: 'cxc_sample_1',
          saleId: 's_sample_2',
          customerId: 'c2',
          customerName: 'Juan Pérez',
          totalAmountUsd: 12.80,
          remainingBalanceUsd: 12.80,
          dueDate: '2026-06-21',
          status: 'pendiente',
          payments: [],
          date: '2026-05-21T11:15:00Z'
        }
      ],
      cxp: [
        {
          id: 'cxp_sample_1',
          purchaseId: 'p_sample_1',
          providerId: 'pr1',
          providerName: 'Distribuidora Los Andes',
          totalAmountUsd: 185.00,
          remainingBalanceUsd: 100.00,
          dueDate: '2026-06-18',
          status: 'pendiente',
          payments: [
            { id: 'pay_1', date: '2026-05-18T09:00:00Z', amountUsd: 85.00, paymentMethod: 'cash' }
          ],
          date: '2026-05-18T09:00:00Z'
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

function readDb() {
  initDb();
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const db = JSON.parse(content);
    let changed = false;
    if (!db.companyConfig) {
      db.companyConfig = {
        name: 'Súper Abasto Familiar',
        emoji: '🥦',
        document: 'J-12345678-0',
        phone: '0414-0001122',
        address: 'Av. Principal, Sector Centro, Caracas',
        footerText: '¡Gracias por preferirnos! Guarde su comprobante.'
      };
      changed = true;
    }
    if (!db.users || !Array.isArray(db.users) || db.users.length === 0) {
      db.users = [
        {
          id: 'usr_admin',
          username: 'admin',
          name: 'Carlos Rodríguez',
          password: 'admin',
          role: 'Administrador',
          dateRegistered: new Date().toISOString()
        }
      ];
      changed = true;
    }
    if (!db.logs || !Array.isArray(db.logs)) {
      db.logs = [
        {
          id: 'log_init',
          username: 'system',
          name: 'Sistema Autónomo',
          action: 'Bitácora de seguridad y auditoría activada correctamente',
          module: 'auth',
          date: new Date().toISOString(),
          details: 'Sistema de control local FJPM Iniciado'
        }
      ];
      changed = true;
    }
    if (changed) {
      writeDb(db);
    }
    return db;
  } catch (err) {
    console.error("Error reading db.json, returning backup default structure", err);
    return {
      companyConfig: {
        name: 'Súper Abasto Familiar',
        emoji: '🥦',
        document: 'J-12345678-0',
        phone: '0414-0001122',
        address: 'Av. Principal, Sector Centro, Caracas',
        footerText: '¡Gracias por preferirnos! Guarde su comprobante.'
      },
      rates: { usdToVes: 0, usdToCop: 0, date: '' },
      products: [],
      customers: [],
      providers: [],
      sales: [],
      purchases: [],
      cxc: [],
      cxp: [],
      users: [
        {
          id: 'usr_admin',
          username: 'admin',
          name: 'Carlos Rodríguez',
          password: 'admin',
          role: 'Administrador',
          dateRegistered: new Date().toISOString()
        }
      ],
      logs: []
    };
  }
}

function logAction(req: any, action: string, module: string, details: string = '') {
  try {
    const username = req.headers['x-user-username'] || 'system';
    const name = req.headers['x-user-name'] || 'Sistema';
    const db = readDb();
    if (!db.logs) db.logs = [];
    db.logs.push({
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      username: String(username),
      name: String(name),
      action,
      module,
      date: new Date().toISOString(),
      details
    });
    writeDb(db);
  } catch (err) {
    console.error("Error writing audit log:", err);
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving to database", err);
  }
}

// Ensure database is initialized
initDb();

// --- API ENDPOINTS ---

// Get Company Config
app.get('/api/config', (req, res) => {
  const db = readDb();
  res.json(db.companyConfig);
});

// Update Company Config
app.put('/api/config', (req, res) => {
  const { name, emoji, document, phone, address, footerText, logoBase64 } = req.body;
  
  const db = readDb();
  db.companyConfig = {
    name: name || 'Súper Abasto Familiar',
    emoji: emoji || '🥦',
    document: document || '',
    phone: phone || '',
    address: address || '',
    footerText: footerText || '',
    logoBase64: logoBase64 || ''
  };
  
  writeDb(db);
  logAction(req, `Modificó datos de la empresa`, 'config', `Nuevo Nombre: ${db.companyConfig.name}`);
  res.json(db.companyConfig);
});

// Get all DB stats and elements
app.get('/api/db', (req, res) => {
  const db = readDb();
  res.json(db);
});

// Update rates
app.post('/api/rates', (req, res) => {
  const { usdToVes, usdToCop } = req.body;
  if (!usdToVes || !usdToCop || isNaN(usdToVes) || isNaN(usdToCop)) {
    return res.status(400).json({ error: 'Valores de cotización inválidos' });
  }

  const db = readDb();
  const dateStr = new Date().toISOString().split('T')[0];
  db.rates = {
    usdToVes: Number(usdToVes),
    usdToCop: Number(usdToCop),
    date: dateStr
  };

  writeDb(db);
  logAction(req, `Actualizó cotización: VES Bs.${db.rates.usdToVes} / COP $${db.rates.usdToCop.toLocaleString()}`, 'rates');
  res.json({ message: 'Cotización actualizada', rates: db.rates });
});

// Products CRUD
app.post('/api/products', (req, res) => {
  const { name, category, emoji, stock, unit, costUsd, priceUsd, minStock } = req.body;
  if (!name || !category || !emoji || isNaN(stock) || isNaN(costUsd) || isNaN(priceUsd)) {
    return res.status(400).json({ error: 'Datos de producto inválidos' });
  }

  const db = readDb();
  const newProduct = {
    id: 'prod_' + Math.random().toString(36).substr(2, 9),
    name,
    category,
    emoji,
    stock: Number(stock),
    unit: unit || 'unidad',
    costUsd: Number(costUsd),
    priceUsd: Number(priceUsd),
    minStock: Number(minStock || 0)
  };

  db.products.push(newProduct);
  writeDb(db);
  logAction(req, `Añadió un producto: ${newProduct.emoji} ${newProduct.name}`, 'inventory', `Precio: $${newProduct.priceUsd}, Cantidad inicial: ${newProduct.stock} ${newProduct.unit}`);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, category, emoji, stock, unit, costUsd, priceUsd, minStock } = req.body;

  const db = readDb();
  const idx = db.products.findIndex((p: any) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Producto no encontrado' });

  const updatedProduct = {
    ...db.products[idx],
    name: name || db.products[idx].name,
    category: category || db.products[idx].category,
    emoji: emoji || db.products[idx].emoji,
    stock: stock !== undefined ? Number(stock) : db.products[idx].stock,
    unit: unit || db.products[idx].unit,
    costUsd: costUsd !== undefined ? Number(costUsd) : db.products[idx].costUsd,
    priceUsd: priceUsd !== undefined ? Number(priceUsd) : db.products[idx].priceUsd,
    minStock: minStock !== undefined ? Number(minStock) : db.products[idx].minStock
  };

  db.products[idx] = updatedProduct;
  writeDb(db);
  res.json(updatedProduct);
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const index = db.products.findIndex((p: any) => p.id === id);
  if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });

  db.products.splice(index, 1);
  writeDb(db);
  res.json({ message: 'Producto eliminado' });
});

// Customers CRUD
app.post('/api/customers', (req, res) => {
  const { name, phone, document, email, creditLimitUsd } = req.body;
  if (!name || !document) return res.status(400).json({ error: 'Nombre y documento son requeridos' });

  const db = readDb();
  const newCustomer = {
    id: 'cust_' + Math.random().toString(36).substr(2, 9),
    name,
    phone: phone || '',
    document,
    email: email || '',
    creditLimitUsd: creditLimitUsd !== undefined ? Number(creditLimitUsd) : 0
  };

  db.customers.push(newCustomer);
  writeDb(db);
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, document, email, creditLimitUsd } = req.body;

  const db = readDb();
  const idx = db.customers.findIndex((c: any) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Cliente no encontrado' });

  db.customers[idx] = {
    ...db.customers[idx],
    name: name || db.customers[idx].name,
    phone: phone !== undefined ? phone : db.customers[idx].phone,
    document: document || db.customers[idx].document,
    email: email !== undefined ? email : db.customers[idx].email,
    creditLimitUsd: creditLimitUsd !== undefined ? Number(creditLimitUsd) : db.customers[idx].creditLimitUsd
  };

  writeDb(db);
  res.json(db.customers[idx]);
});

// Providers CRUD
app.post('/api/providers', (req, res) => {
  const { name, phone, document, email } = req.body;
  if (!name || !document) return res.status(400).json({ error: 'Nombre y documento son requeridos' });

  const db = readDb();
  const newProvider = {
    id: 'prov_' + Math.random().toString(36).substr(2, 9),
    name,
    phone: phone || '',
    document,
    email: email || ''
  };

  db.providers.push(newProvider);
  writeDb(db);
  res.status(201).json(newProvider);
});

app.put('/api/providers/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, document, email } = req.body;

  const db = readDb();
  const idx = db.providers.findIndex((p: any) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Proveedor no encontrado' });

  db.providers[idx] = {
    ...db.providers[idx],
    name: name || db.providers[idx].name,
    phone: phone !== undefined ? phone : db.providers[idx].phone,
    document: document || db.providers[idx].document,
    email: email !== undefined ? email : db.providers[idx].email
  };

  writeDb(db);
  res.json(db.providers[idx]);
});

// Recording a Sale (Ventas)
app.post('/api/sales', (req, res) => {
  const { customerId, customerName, items, paymentMethod, paidAmountUsd } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'Debe agregar al menos un producto' });

  const db = readDb();

  // Validate stock and count totals
  let computedTotalUsd = 0;
  for (const item of items) {
    const prod = db.products.find((p: any) => p.id === item.productId);
    if (!prod) return res.status(400).json({ error: `Producto con ID ${item.productId} no existe` });
    if (prod.stock < item.quantity) {
      return res.status(400).json({ error: `Stock insuficiente para ${prod.name}. Disponible: ${prod.stock} ${prod.unit}` });
    }
    computedTotalUsd += item.priceUsd * item.quantity;
  }

  // Deduct stock
  for (const item of items) {
    const prodIndex = db.products.findIndex((p: any) => p.id === item.productId);
    db.products[prodIndex].stock -= item.quantity;
  }

  const invoiceNum = 'VEN-' + String(db.sales.length + 1).padStart(4, '0');
  const saleId = 'sale_' + Math.random().toString(36).substr(2, 9);
  const rateNow = db.rates;

  let cxcBalance = 0;
  if (paymentMethod === 'cxc') {
    cxcBalance = computedTotalUsd - (Number(paidAmountUsd) || 0);
  }

  const itemsWithTotals = items.map((item: any) => ({
    ...item,
    totalUsd: Number((item.quantity * item.priceUsd).toFixed(2))
  }));

  const newSale = {
    id: saleId,
    invoiceNumber: invoiceNum,
    customerId: customerId || 'casual',
    customerName: customerName || 'Cliente Casual',
    items: itemsWithTotals,
    totalUsd: Number(computedTotalUsd.toFixed(2)),
    paymentMethod,
    paidAmountUsd: paymentMethod === 'cxc' ? (Number(paidAmountUsd) || 0) : Number(computedTotalUsd.toFixed(2)),
    cxcBalanceUsd: Number(cxcBalance.toFixed(2)),
    date: new Date().toISOString(),
    rateAtSale: { ...rateNow }
  };

  db.sales.push(newSale);

  // If there is account receivable, create a CxC Invoice
  if (cxcBalance > 0) {
    db.cxc.push({
      id: 'cxc_' + Math.random().toString(36).substr(2, 9),
      saleId: saleId,
      customerId: customerId || 'casual',
      customerName: customerName || 'Cliente Casual',
      totalAmountUsd: Number(computedTotalUsd.toFixed(2)),
      remainingBalanceUsd: Number(cxcBalance.toFixed(2)),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias de plazo
      status: 'pendiente',
      payments: paidAmountUsd > 0 ? [{ id: 'cxpay_init', date: new Date().toISOString(), amountUsd: Number(paidAmountUsd), paymentMethod: 'cash' }] : [],
      date: new Date().toISOString()
    });
  }

  writeDb(db);
  logAction(req, `Registró venta: ${newSale.invoiceNumber}`, 'sales', `Monto: $${newSale.totalUsd}, Cliente: ${newSale.customerName}, Pago: ${newSale.paymentMethod}`);
  res.status(201).json(newSale);
});

// Recording a Purchase (Compras)
app.post('/api/purchases', (req, res) => {
  const { providerId, providerName, items, paymentMethod, paidAmountUsd } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'Debe agregar productos a la compra' });

  const db = readDb();

  // Compute total, adjust stock, and update buying price
  let computedTotalUsd = 0;
  for (const item of items) {
    computedTotalUsd += item.costUsd * item.quantity;
  }

  // Adjust stock & update prices
  for (const item of items) {
    const prodIdx = db.products.findIndex((p: any) => p.id === item.productId);
    if (prodIdx !== -1) {
      db.products[prodIdx].stock += item.quantity;
      db.products[prodIdx].costUsd = item.costUsd; // Actualizar costo promedio / ultimo costo
    }
  }

  const invoiceNum = 'COM-' + String(db.purchases.length + 1).padStart(4, '0');
  const purchaseId = 'pur_' + Math.random().toString(36).substr(2, 9);
  const rateNow = db.rates;

  let cxpBalance = 0;
  if (paymentMethod === 'cxp') {
    cxpBalance = computedTotalUsd - (Number(paidAmountUsd) || 0);
  }

  const newPurchase = {
    id: purchaseId,
    invoiceNumber: invoiceNum,
    providerId: providerId,
    providerName: providerName,
    items,
    totalUsd: Number(computedTotalUsd.toFixed(2)),
    paymentMethod,
    paidAmountUsd: paymentMethod === 'cxp' ? (Number(paidAmountUsd) || 0) : Number(computedTotalUsd.toFixed(2)),
    cxpBalanceUsd: Number(cxpBalance.toFixed(2)),
    date: new Date().toISOString(),
    rateAtPurchase: { ...rateNow }
  };

  db.purchases.push(newPurchase);

  // If accounts payable, create a CxP record
  if (cxpBalance > 0) {
    db.cxp.push({
      id: 'cxp_' + Math.random().toString(36).substr(2, 9),
      purchaseId: purchaseId,
      providerId: providerId,
      providerName: providerName,
      totalAmountUsd: Number(computedTotalUsd.toFixed(2)),
      remainingBalanceUsd: Number(cxpBalance.toFixed(2)),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias de plazo
      status: 'pendiente',
      payments: paidAmountUsd > 0 ? [{ id: 'cxppay_init', date: new Date().toISOString(), amountUsd: Number(paidAmountUsd), paymentMethod: 'cash' }] : [],
      date: new Date().toISOString()
    });
  }

  writeDb(db);
  res.status(201).json(newPurchase);
});

// Edit a Sale
app.put('/api/sales/:id', (req, res) => {
  const { id } = req.params;
  const { customerId, customerName, items, paymentMethod, paidAmountUsd, date } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'Debe agregar al menos un producto' });

  const db = readDb();
  const saleIdx = db.sales.findIndex((s: any) => s.id === id);
  if (saleIdx === -1) return res.status(404).json({ error: 'Venta no encontrada' });

  const oldSale = db.sales[saleIdx];

  // 1. Rollback stock of old items
  for (const oldItem of oldSale.items) {
    const pIdx = db.products.findIndex((p: any) => p.id === oldItem.productId);
    if (pIdx !== -1) {
      db.products[pIdx].stock += oldItem.quantity;
    }
  }

  // 2. Validate stock for new items
  for (const newItem of items) {
    const prod = db.products.find((p: any) => p.id === newItem.productId);
    if (!prod) {
      // Revert rollback
      for (const oldItem of oldSale.items) {
        const pIdx = db.products.findIndex((p: any) => p.id === oldItem.productId);
        if (pIdx !== -1) db.products[pIdx].stock -= oldItem.quantity;
      }
      return res.status(400).json({ error: `Producto con ID ${newItem.productId} no existe` });
    }
    if (prod.stock < newItem.quantity) {
      // Revert rollback
      for (const oldItem of oldSale.items) {
        const pIdx = db.products.findIndex((p: any) => p.id === oldItem.productId);
        if (pIdx !== -1) db.products[pIdx].stock -= oldItem.quantity;
      }
      return res.status(400).json({ error: `Stock insuficiente para ${prod.name}. Disponible tras reversión: ${prod.stock} ${prod.unit}` });
    }
  }

  // 3. Deduct new stock
  for (const newItem of items) {
    const pIdx = db.products.findIndex((p: any) => p.id === newItem.productId);
    if (pIdx !== -1) {
      db.products[pIdx].stock -= newItem.quantity;
    }
  }

  // 4. Compute totals
  let computedTotalUsd = 0;
  for (const newItem of items) {
    computedTotalUsd += newItem.priceUsd * newItem.quantity;
  }

  const cxcBalance = paymentMethod === 'cxc' ? (computedTotalUsd - (Number(paidAmountUsd) || 0)) : 0;

  // 5. Update sale properties
  oldSale.customerId = customerId || 'casual';
  oldSale.customerName = customerName || 'Cliente Casual';
  oldSale.items = items.map((i: any) => ({
    ...i,
    totalUsd: Number((i.quantity * i.priceUsd).toFixed(2))
  }));
  oldSale.totalUsd = Number(computedTotalUsd.toFixed(2));
  oldSale.paymentMethod = paymentMethod;
  oldSale.paidAmountUsd = paymentMethod === 'cxc' ? (Number(paidAmountUsd) || 0) : Number(computedTotalUsd.toFixed(2));
  oldSale.cxcBalanceUsd = Number(cxcBalance.toFixed(2));
  if (date) oldSale.date = date;

  // Update CxC records: remove old one and create new one if needed
  db.cxc = db.cxc.filter((c: any) => c.saleId !== id);
  if (cxcBalance > 0) {
    db.cxc.push({
      id: 'cxc_' + Math.random().toString(36).substr(2, 9),
      saleId: id,
      customerId: oldSale.customerId,
      customerName: oldSale.customerName,
      totalAmountUsd: oldSale.totalUsd,
      remainingBalanceUsd: oldSale.cxcBalanceUsd,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pendiente',
      payments: oldSale.paidAmountUsd > 0 ? [{ id: 'cxpay_init', date: new Date().toISOString(), amountUsd: oldSale.paidAmountUsd, paymentMethod: 'cash' }] : [],
      date: oldSale.date
    });
  }

  writeDb(db);
  res.json(oldSale);
});

// Delete a Sale
app.delete('/api/sales/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const saleIdx = db.sales.findIndex((s: any) => s.id === id);
  if (saleIdx === -1) return res.status(404).json({ error: 'Venta no encontrada' });

  const oldSale = db.sales[saleIdx];

  // Rollback stock
  for (const item of oldSale.items) {
    const pIdx = db.products.findIndex((p: any) => p.id === item.productId);
    if (pIdx !== -1) {
      db.products[pIdx].stock += item.quantity;
    }
  }

  // Remove CxC
  db.cxc = db.cxc.filter((c: any) => c.saleId !== id);

  // Remove Sale
  db.sales.splice(saleIdx, 1);

  writeDb(db);
  res.json({ success: true, message: 'Venta eliminada e inventario restablecido.' });
});

// Edit a Purchase
app.put('/api/purchases/:id', (req, res) => {
  const { id } = req.params;
  const { providerId, providerName, items, paymentMethod, paidAmountUsd, date } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'Debe agregar productos a la compra' });

  const db = readDb();
  const purIdx = db.purchases.findIndex((p: any) => p.id === id);
  if (purIdx === -1) return res.status(404).json({ error: 'Compra no encontrada' });

  const oldPurchase = db.purchases[purIdx];

  // 1. Rollback old stock (subtract what was bought)
  for (const oldItem of oldPurchase.items) {
    const pIdx = db.products.findIndex((p: any) => p.id === oldItem.productId);
    if (pIdx !== -1) {
      db.products[pIdx].stock -= oldItem.quantity;
    }
  }

  // 2. Add new quantities and update costs
  for (const newItem of items) {
    const pIdx = db.products.findIndex((p: any) => p.id === newItem.productId);
    if (pIdx !== -1) {
      db.products[pIdx].stock += newItem.quantity;
      db.products[pIdx].costUsd = newItem.costUsd;
    }
  }

  // 3. Compute totals
  let computedTotalUsd = 0;
  for (const newItem of items) {
    computedTotalUsd += newItem.costUsd * newItem.quantity;
  }

  const cxpBalance = paymentMethod === 'cxp' ? (computedTotalUsd - (Number(paidAmountUsd) || 0)) : 0;

  // 4. Update purchase
  oldPurchase.providerId = providerId;
  oldPurchase.providerName = providerName;
  oldPurchase.items = items;
  oldPurchase.totalUsd = Number(computedTotalUsd.toFixed(2));
  oldPurchase.paymentMethod = paymentMethod;
  oldPurchase.paidAmountUsd = paymentMethod === 'cxp' ? (Number(paidAmountUsd) || 0) : Number(computedTotalUsd.toFixed(2));
  oldPurchase.cxpBalanceUsd = Number(cxpBalance.toFixed(2));
  if (date) oldPurchase.date = date;

  // Update CxP records
  db.cxp = db.cxp.filter((c: any) => c.purchaseId !== id);
  if (cxpBalance > 0) {
    db.cxp.push({
      id: 'cxp_' + Math.random().toString(36).substr(2, 9),
      purchaseId: id,
      providerId: oldPurchase.providerId,
      providerName: oldPurchase.providerName,
      totalAmountUsd: oldPurchase.totalUsd,
      remainingBalanceUsd: oldPurchase.cxpBalanceUsd,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pendiente',
      payments: oldPurchase.paidAmountUsd > 0 ? [{ id: 'cxppay_init', date: new Date().toISOString(), amountUsd: oldPurchase.paidAmountUsd, paymentMethod: 'cash' }] : [],
      date: oldPurchase.date
    });
  }

  writeDb(db);
  res.json(oldPurchase);
});

// Delete a Purchase
app.delete('/api/purchases/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const purIdx = db.purchases.findIndex((p: any) => p.id === id);
  if (purIdx === -1) return res.status(404).json({ error: 'Compra no encontrada' });

  const oldPurchase = db.purchases[purIdx];

  // Rollback stock (purchased items subtracted from stock)
  for (const item of oldPurchase.items) {
    const pIdx = db.products.findIndex((p: any) => p.id === item.productId);
    if (pIdx !== -1) {
      db.products[pIdx].stock -= item.quantity;
    }
  }

  // Remove CxP
  db.cxp = db.cxp.filter((c: any) => c.purchaseId !== id);

  // Remove Purchase
  db.purchases.splice(purIdx, 1);

  writeDb(db);
  res.json({ success: true, message: 'Compra eliminada e inventario descontado.' });
});

// CxC (Cuentas por Cobrar) Payment
app.post('/api/cxc/:id/payments', (req, res) => {
  const { id } = req.params;
  const { amountUsd, paymentMethod, reference } = req.body;
  if (isNaN(amountUsd) || amountUsd <= 0) return res.status(400).json({ error: 'Monto de pago inválido' });

  const db = readDb();
  const index = db.cxc.findIndex((item: any) => item.id === id);
  if (index === -1) return res.status(404).json({ error: 'Registro CxC no encontrado' });

  const cxc = db.cxc[index];
  if (amountUsd > cxc.remainingBalanceUsd) {
    return res.status(400).json({ error: `El pago (${amountUsd} USD) sobrepasa el saldo pendiente (${cxc.remainingBalanceUsd} USD)` });
  }

  const paymentObj = {
    id: 'cxpay_' + Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString(),
    amountUsd: Number(amountUsd),
    paymentMethod,
    reference: reference || ''
  };

  cxc.payments.push(paymentObj);
  cxc.remainingBalanceUsd = Number((cxc.remainingBalanceUsd - amountUsd).toFixed(2));
  if (cxc.remainingBalanceUsd <= 0.01) {
    cxc.status = 'pagado';
  }

  // Update original sale paid status too
  const saleIdx = db.sales.findIndex((s: any) => s.id === cxc.saleId);
  if (saleIdx !== -1) {
    db.sales[saleIdx].paidAmountUsd = Number((db.sales[saleIdx].paidAmountUsd + amountUsd).toFixed(2));
    db.sales[saleIdx].cxcBalanceUsd = Number((db.sales[saleIdx].cxcBalanceUsd - amountUsd).toFixed(2));
  }

  writeDb(db);
  res.json(cxc);
});

// CxP (Cuentas por Pagar) Payment
app.post('/api/cxp/:id/payments', (req, res) => {
  const { id } = req.params;
  const { amountUsd, paymentMethod, reference } = req.body;
  if (isNaN(amountUsd) || amountUsd <= 0) return res.status(400).json({ error: 'Monto de pago inválido' });

  const db = readDb();
  const index = db.cxp.findIndex((item: any) => item.id === id);
  if (index === -1) return res.status(404).json({ error: 'Registro CxP no encontrado' });

  const cxp = db.cxp[index];
  if (amountUsd > cxp.remainingBalanceUsd) {
    return res.status(400).json({ error: `El pago (${amountUsd} USD) sobrepasa el saldo pendiente (${cxp.remainingBalanceUsd} USD)` });
  }

  const paymentObj = {
    id: 'cxppay_' + Math.random().toString(36).substr(2, 9),
    date: new Date().toISOString(),
    amountUsd: Number(amountUsd),
    paymentMethod,
    reference: reference || ''
  };

  cxp.payments.push(paymentObj);
  cxp.remainingBalanceUsd = Number((cxp.remainingBalanceUsd - amountUsd).toFixed(2));
  if (cxp.remainingBalanceUsd <= 0.01) {
    cxp.status = 'pagado';
  }

  // Update original purchase paid status too
  const purIdx = db.purchases.findIndex((p: any) => p.id === cxp.purchaseId);
  if (purIdx !== -1) {
    db.purchases[purIdx].paidAmountUsd = Number((db.purchases[purIdx].paidAmountUsd + amountUsd).toFixed(2));
    db.purchases[purIdx].cxpBalanceUsd = Number((db.purchases[purIdx].cxpBalanceUsd - amountUsd).toFixed(2));
  }

  writeDb(db);
  res.json(cxp);
});

// --- USER AUTHENTICATION & AUDIT LOGS ENDPOINTS ---

// Login user
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  const db = readDb();
  const user = db.users.find(
    (u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );

  if (!user) {
    // Record log for failed access
    db.logs.push({
      id: 'log_' + Math.random().toString(36).substr(2, 9),
      username: username,
      name: 'Intento de Acceso',
      action: `Intento fallido de inicio de sesión para el usuario '${username}'`,
      module: 'auth',
      date: new Date().toISOString(),
      details: 'Clave incorrecta o usuario inexistente'
    });
    writeDb(db);
    return res.status(401).json({ error: 'Credenciales inválidas. Verifique e intente nuevamente o cree una cuenta.' });
  }

  const userRes = {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    dateRegistered: user.dateRegistered
  };

  logAction(req, `Sesión iniciada: ${user.name} (${user.username})`, 'auth', `Rol: ${user.role}`);
  res.json({ success: true, user: userRes });
});

// Register user
app.post('/api/auth/register', (req, res) => {
  const { username, password, name, role } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: 'Todos los campos son requeridos (usuario, clave, nombre, rol)' });
  }

  const db = readDb();
  const exists = db.users.some((u: any) => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
  }

  const newUser = {
    id: 'usr_' + Math.random().toString(36).substr(2, 9),
    username: username.toLowerCase().trim(),
    name: name.trim(),
    password,
    role,
    dateRegistered: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDb(db);

  logAction(req, `Registró nuevo usuario: ${newUser.name} (${newUser.username})`, 'auth', `Asignó rol: ${newUser.role}`);
  
  const userRes = {
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
    dateRegistered: newUser.dateRegistered
  };

  res.status(201).json({ success: true, user: userRes });
});

// Get users list
app.get('/api/users', (req, res) => {
  const db = readDb();
  // Safe mapping, do not expose password
  const users = db.users.map((u: any) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    dateRegistered: u.dateRegistered
  }));
  res.json(users);
});

// Delete user
app.delete('/api/users/:username', (req, res) => {
  const { username } = req.params;
  const db = readDb();
  
  if (username.toLowerCase() === 'admin') {
    return res.status(400).json({ error: 'No está permitido eliminar la cuenta raíz de administrador (admin).' });
  }

  const idx = db.users.findIndex((u: any) => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const deletedUser = db.users[idx];
  db.users.splice(idx, 1);
  writeDb(db);

  logAction(req, `Eliminó cuenta de usuario: ${deletedUser.name} (${deletedUser.username})`, 'auth', `Rol eliminado: ${deletedUser.role}`);
  res.json({ success: true, message: 'Usuario eliminado correctamente' });
});

// Get audit logs
app.get('/api/logs', (req, res) => {
  const db = readDb();
  const logsList = db.logs || [];
  // Send sorted newest first
  const sortedLogs = [...logsList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(sortedLogs);
});

// Write custom log (e.g. error reporting or diagnostic status)
app.post('/api/logs', (req, res) => {
  const { action, module, details } = req.body;
  if (!action || !module) {
    return res.status(400).json({ error: 'Acción y módulo son requeridos para la bitácora.' });
  }
  logAction(req, action, module, details || '');
  res.json({ success: true });
});

// Get Database Reset endpoint for safety/cleaning
app.post('/api/reset-db', (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    fs.unlinkSync(DB_FILE);
  }
  initDb();
  res.json({ message: 'Base de datos restaurada de fábrica', db: readDb() });
});

// Setup development or production routing
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**']
        }
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server fully active under http://localhost:${PORT}`);
  });
}

startServer();
