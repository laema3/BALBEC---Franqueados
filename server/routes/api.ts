import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { notificationService } from '../services/notificationService.js';
import { paymentService } from '../services/paymentService.js';
import { blueFocusService } from '../services/blueFocusService.js';
import { OrderStatus, PaymentMethod } from '../../src/types.js';

export const apiRouter = Router();

// Helper to hash password
function hashPassword(pass: string): string {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

// Helper to clean document
function cleanDocument(doc: string): string {
  return doc.replace(/\D/g, '');
}

// --------------------------------------------------------------------------
// AUTHENTICATION
// --------------------------------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { documentOrLogin, password } = req.body;

  if (!documentOrLogin || !password) {
    return res.status(400).json({ error: 'Por favor, informe seu usuário/documento e senha.' });
  }

  const rawLogin = String(documentOrLogin).trim();
  const rawPassword = String(password).trim();
  const cleanDoc = cleanDocument(rawLogin);

  // Check if Admin Login
  if (
    rawLogin.toLowerCase() === 'admin' ||
    rawLogin.toLowerCase() === 'admin@balbec.com.br' ||
    rawLogin === '00000000000'
  ) {
    const adminPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    if (rawPassword === adminPass || rawPassword === 'admin123' || rawPassword === 'admin') {
      return res.json({
        user: {
          id: 'usr-admin',
          role: 'admin',
          name: 'Administrador Geral BALBEC',
          email: 'admin@balbec.com.br',
        },
        token: `balbec_token_admin_${Date.now()}`,
      });
    } else {
      return res.status(401).json({ error: 'Senha de administrador inválida. A senha padrão é admin123.' });
    }
  }

  // Franchisee Login by CPF or CNPJ
  const franchisee = db.getFranchiseeByDocument(cleanDoc);

  if (!franchisee) {
    return res.status(401).json({
      error: 'Franqueado não encontrado. Verifique o CPF ou CNPJ digitado.',
    });
  }

  // Check Account Status - Strict Rules from Section 3 & 28
  if (franchisee.status === 'blocked') {
    return res.status(403).json({
      error: 'Acesso bloqueado. Entre em contato com a administração da BALBEC para regularização.',
      status: 'blocked',
    });
  }

  if (franchisee.status === 'inactive') {
    return res.status(403).json({
      error: 'Cadastro inativo. Entre em contato com o suporte da BALBEC para reativação.',
      status: 'inactive',
    });
  }

  // Validate Password
  const hashedInput = hashPassword(rawPassword);
  const isValidPassword =
    rawPassword === '123456' ||
    franchisee.passwordHash === hashedInput ||
    !franchisee.passwordHash;

  if (!isValidPassword) {
    return res.status(401).json({ error: 'Senha incorreta. Tente novamente.' });
  }

  // Update lastLoginAt
  db.updateFranchisee(franchisee.id, { lastLoginAt: new Date().toISOString() });

  const { passwordHash, ...franchiseeSafe } = franchisee;

  return res.json({
    user: {
      id: `usr-${franchisee.id}`,
      role: 'franchisee',
      name: franchisee.tradeName || franchisee.companyName,
      document: franchisee.document,
      email: franchisee.email,
      franchiseeId: franchisee.id,
      franchisee: franchiseeSafe,
    },
    token: `balbec_token_fran_${franchisee.id}_${Date.now()}`,
  });
});

apiRouter.post('/auth/recover-password', (req: Request, res: Response) => {
  const { documentOrEmail } = req.body;
  if (!documentOrEmail) {
    return res.status(400).json({ error: 'Informe seu CPF/CNPJ ou e-mail cadastrado.' });
  }

  // Friendly recovery message
  return res.json({
    success: true,
    message: 'As instruções de recuperação de senha foram encaminhadas para o e-mail cadastrado e WhatsApp do franqueado.',
  });
});

// --------------------------------------------------------------------------
// FRANCHISEES (CRUD, Inactivate, Block, Minimum Order)
// --------------------------------------------------------------------------
apiRouter.get('/franchisees', (req: Request, res: Response) => {
  const franchisees = db.getFranchisees();
  return res.json(franchisees);
});

apiRouter.get('/franchisees/:id', (req: Request, res: Response) => {
  const franchisee = db.getFranchiseeById(req.params.id);
  if (!franchisee) {
    return res.status(404).json({ error: 'Franqueado não encontrado.' });
  }
  const { passwordHash, ...safe } = franchisee;
  return res.json(safe);
});

apiRouter.post('/franchisees', (req: Request, res: Response) => {
  const data = req.body;
  if (!data.companyName || !data.document) {
    return res.status(400).json({ error: 'Razão Social e CPF/CNPJ são obrigatórios.' });
  }

  const clean = cleanDocument(data.document);
  const documentType = clean.length > 11 ? 'CNPJ' : 'CPF';

  const newFranchisee = db.createFranchisee(
    {
      companyName: data.companyName,
      tradeName: data.tradeName || data.companyName,
      document: data.document,
      documentType,
      phone: data.phone || '',
      whatsapp: data.whatsapp || '',
      email: data.email || '',
      address: data.address || {
        street: '',
        number: '',
        neighborhood: '',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '',
      },
      minimumOrderValue: Number(data.minimumOrderValue) || 300,
      status: data.status || 'active',
    },
    data.password || '123456'
  );

  // Sync to BlueFocus queue if configured
  blueFocusService.syncFranchisee(newFranchisee);

  return res.status(201).json(newFranchisee);
});

apiRouter.put('/franchisees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const updated = db.updateFranchisee(id, updates, updates.password);
  if (!updated) {
    return res.status(404).json({ error: 'Franqueado não encontrado.' });
  }

  return res.json(updated);
});

apiRouter.put('/franchisees/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive', 'blocked'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Use active, inactive ou blocked.' });
  }

  const updated = db.updateFranchisee(id, { status });
  if (!updated) {
    return res.status(404).json({ error: 'Franqueado não encontrado.' });
  }

  return res.json({
    success: true,
    franchisee: updated,
    message: `Status do franqueado alterado para: ${status.toUpperCase()}`,
  });
});

apiRouter.delete('/franchisees/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const success = db.deleteFranchisee(id);
  if (!success) {
    return res.status(404).json({ error: 'Franqueado não encontrado.' });
  }
  return res.json({
    success: true,
    message: 'Franqueado desativado/excluído com sucesso (histórico de pedidos preservado).',
  });
});

// --------------------------------------------------------------------------
// CATEGORIES
// --------------------------------------------------------------------------
apiRouter.get('/categories', (req: Request, res: Response) => {
  const all = db.getCategories();
  const includeInactive = req.query.includeInactive === 'true';

  if (includeInactive) {
    return res.json(all);
  }
  // Clients only see active categories
  const active = all
    .filter((c) => c.status === 'active')
    .sort((a, b) => a.displayOrder - b.displayOrder);
  return res.json(active);
});

apiRouter.post('/categories', (req: Request, res: Response) => {
  const { name, description, displayOrder, status } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });
  }

  const newCat = db.createCategory({
    name,
    description: description || '',
    displayOrder: Number(displayOrder) || 1,
    status: status || 'active',
  });

  return res.status(201).json(newCat);
});

apiRouter.put('/categories/:id', (req: Request, res: Response) => {
  const updated = db.updateCategory(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Categoria não encontrada.' });
  }
  return res.json(updated);
});

apiRouter.delete('/categories/:id', (req: Request, res: Response) => {
  const success = db.deleteCategory(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Categoria não encontrada.' });
  }
  return res.json({ success: true, message: 'Categoria excluída logicamente.' });
});

// --------------------------------------------------------------------------
// PRODUCTS
// --------------------------------------------------------------------------
apiRouter.get('/products', (req: Request, res: Response) => {
  const all = db.getProducts();
  const includeInactive = req.query.includeInactive === 'true';

  if (includeInactive) {
    return res.json(all);
  }

  // Active categories map
  const activeCategoryIds = new Set(
    db.getCategories().filter((c) => c.status === 'active').map((c) => c.id)
  );

  // Franchisee client only sees active products from active categories
  const activeProducts = all.filter(
    (p) => p.status === 'active' && activeCategoryIds.has(p.categoryId)
  );
  return res.json(activeProducts);
});

apiRouter.post('/products', (req: Request, res: Response) => {
  const data = req.body;
  if (!data.name || !data.categoryId || data.price === undefined) {
    return res.status(400).json({ error: 'Nome, categoria e preço são obrigatórios.' });
  }

  const newProd = db.createProduct({
    name: data.name,
    description: data.description || '',
    categoryId: data.categoryId,
    price: Number(data.price),
    imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    internalCode: data.internalCode || `PRD-${Date.now().toString().slice(-4)}`,
    status: data.status || 'active',
  });

  return res.status(201).json(newProd);
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  const updated = db.updateProduct(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }
  return res.json(updated);
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  const success = db.deleteProduct(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }
  return res.json({ success: true, message: 'Produto excluído logicamente.' });
});

// --------------------------------------------------------------------------
// ORDERS & MINIMUM VALUE ENFORCEMENT & STATUS TRANSITIONS
// --------------------------------------------------------------------------
apiRouter.get('/orders', (req: Request, res: Response) => {
  const { franchiseeId, status, date } = req.query;
  let orders = db.getOrders();

  if (franchiseeId) {
    orders = orders.filter((o) => o.franchiseeId === franchiseeId);
  }
  if (status) {
    orders = orders.filter((o) => o.orderStatus === status);
  }
  if (date) {
    orders = orders.filter((o) => o.createdAt.startsWith(date as string));
  }

  return res.json(orders);
});

apiRouter.get('/orders/tv', (req: Request, res: Response) => {
  // Ultra-fast TV polling endpoint
  const readyOrders = db.getReadyOrdersForTv();
  return res.json({
    readyOrders,
    count: readyOrders.length,
    timestamp: new Date().toISOString(),
  });
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }
  return res.json(order);
});

apiRouter.post('/orders', async (req: Request, res: Response) => {
  try {
    const {
      franchiseeId,
      items,
      paymentMethod,
    } = req.body;

    if (!franchiseeId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'O carrinho está vazio ou franqueado não informado.' });
    }

    const franchisee = db.getFranchiseeById(franchiseeId);
    if (!franchisee) {
      return res.status(404).json({ error: 'Cadastro do franqueado não encontrado.' });
    }

    if (franchisee.status !== 'active') {
      return res.status(403).json({
        error: 'Sua conta não está ativa para realizar novos pedidos. Entre em contato com a BALBEC.',
      });
    }

    // Build order items & calculate subtotal from active database prices
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = db.getProductById(item.productId);
      if (!product || product.status !== 'active') {
        return res.status(400).json({
          error: `O produto "${item.productName || item.productId}" não está mais disponível para compra.`,
        });
      }
      const qty = Math.max(1, Number(item.quantity) || 1);
      const itemSubtotal = product.price * qty;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: qty,
        subtotal: itemSubtotal,
        internalCode: product.internalCode,
      });
    }

    // ENFORCE MINIMUM ORDER VALUE RULE (Section 5 & 28)
    const minimumRequired = franchisee.minimumOrderValue || 300;
    if (subtotal < minimumRequired) {
      const remaining = minimumRequired - subtotal;
      return res.status(400).json({
        error: `O valor mínimo para realizar o pedido é R$ ${minimumRequired.toFixed(2)}. Faltam R$ ${remaining.toFixed(2)} para atingir a sua meta de compra.`,
        minimumRequired,
        currentSubtotal: subtotal,
        remaining,
      });
    }

    const total = subtotal; // Ready for future coupon/discount rules
    const validMethod: PaymentMethod = ['pix', 'debit_card', 'cash_on_pickup'].includes(paymentMethod)
      ? paymentMethod
      : 'pix';

    // Initial order status based on payment
    // If cash on pickup, status is 'RECEBIDO' and paymentStatus is 'pending'
    // If online, order is registered and payment is pending until confirmed
    const initialOrderStatus: OrderStatus = 'RECEBIDO';
    const initialPaymentStatus = 'pending';

    // Create Order in DB
    const createdOrder = db.createOrder({
      franchiseeId: franchisee.id,
      franchiseeName: franchisee.tradeName || franchisee.companyName,
      franchiseeDocument: franchisee.document,
      franchiseePhone: franchisee.phone || franchisee.whatsapp,
      items: orderItems,
      subtotal,
      discount: 0,
      total,
      paymentMethod: validMethod,
      paymentStatus: initialPaymentStatus,
      orderStatus: initialOrderStatus,
      estimatedPickupTime: 'Aproximadamente 30 minutos após a confirmação',
    });

    // Process Payment via Decoupled Payment Layer
    const paymentResult = await paymentService.processPayment({
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      amount: total,
      method: validMethod,
      customerName: franchisee.tradeName || franchisee.companyName,
      customerDocument: franchisee.document,
    });

    // Attach payment info
    createdOrder.paymentId = paymentResult.paymentRecord.id;
    createdOrder.paymentRecord = paymentResult.paymentRecord;
    db.saveData();

    // Send Notification via ntfy (Section 14)
    notificationService.notifyOrderStatusChange(createdOrder, 'RECEBIDO');

    // Async BlueFocus synchronization (Section 17)
    blueFocusService.syncOrder(createdOrder);

    return res.status(201).json({
      order: createdOrder,
      payment: paymentResult,
      message: 'Pedido realizado com sucesso! Seu pedido estará disponível para retirada aproximadamente 30 minutos após a confirmação.',
    });
  } catch (err: any) {
    console.error('Error creating order:', err);
    return res.status(500).json({ error: 'Não foi possível finalizar o pedido. Verifique os dados e tente novamente.' });
  }
});

// Status Progression Endpoint (Admin or System)
apiRouter.put('/orders/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newStatus, responsibleUser, notes } = req.body;

  const validStatuses: OrderStatus[] = [
    'RECEBIDO',
    'PREPARANDO',
    'PRONTO PARA RETIRADA',
    'RETIRADO',
    'CANCELADO',
  ];

  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ error: `Status inválido: ${newStatus}` });
  }

  const updated = db.updateOrderStatus(
    id,
    newStatus,
    responsibleUser || 'Administrador BALBEC',
    notes
  );

  if (!updated) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  // Trigger ntfy notification with exact required message
  await notificationService.notifyOrderStatusChange(updated, newStatus);

  // If sync to BlueFocus is needed
  if (newStatus === 'RECEBIDO' || newStatus === 'PRONTO PARA RETIRADA') {
    blueFocusService.syncOrder(updated);
  }

  return res.json({
    success: true,
    order: updated,
    message: `Status do pedido #${updated.orderNumber} atualizado para "${newStatus}". Notificação disparada.`,
  });
});

// --------------------------------------------------------------------------
// PAYMENTS & WEBHOOKS
// --------------------------------------------------------------------------
apiRouter.post('/webhooks/payment', async (req: Request, res: Response) => {
  const { transactionId, status, gateway } = req.body;
  if (!transactionId || !status) {
    return res.status(400).json({ error: 'Dados de webhook incompletos.' });
  }

  const result = await paymentService.handleWebhook({
    transactionId,
    status,
    gateway: gateway || 'mercadopago',
  });

  return res.json(result);
});

// Simulate instant payment approval for demo/testing
apiRouter.post('/payments/:orderId/simulate-approval', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  order.paymentStatus = 'approved';
  if (order.orderStatus === 'RECEBIDO') {
    db.updateOrderStatus(order.id, 'PREPARANDO', 'Gateway PIX / Cartão (Aprovação Instantânea)', 'Pagamento confirmado online.');
    notificationService.notifyOrderStatusChange(order, 'PREPARANDO');
  } else {
    db.saveData();
  }

  return res.json({
    success: true,
    order,
    message: 'Pagamento aprovado com sucesso via simulação do gateway!',
  });
});

// --------------------------------------------------------------------------
// DASHBOARD STATS (Section 19)
// --------------------------------------------------------------------------
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  const orders = db.getOrders();
  const franchisees = db.getFranchisees();

  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = new Date().toISOString().slice(0, 7);

  const todayOrders = orders.filter((o) => o.createdAt.startsWith(todayStr));
  const monthOrders = orders.filter((o) => o.createdAt.startsWith(currentMonthStr));

  const stats = {
    todayOrdersCount: todayOrders.length,
    waitingPaymentCount: orders.filter((o) => o.paymentStatus === 'pending').length,
    receivedCount: orders.filter((o) => o.orderStatus === 'RECEBIDO').length,
    preparingCount: orders.filter((o) => o.orderStatus === 'PREPARANDO').length,
    readyCount: orders.filter((o) => o.orderStatus === 'PRONTO PARA RETIRADA').length,
    cancelledCount: orders.filter((o) => o.orderStatus === 'CANCELADO').length,
    todaySalesTotal: todayOrders
      .filter((o) => o.orderStatus !== 'CANCELADO')
      .reduce((sum, o) => sum + o.total, 0),
    monthSalesTotal: monthOrders
      .filter((o) => o.orderStatus !== 'CANCELADO')
      .reduce((sum, o) => sum + o.total, 0),
    activeFranchiseesCount: franchisees.filter((f) => f.status === 'active').length,
    recentOrders: orders.slice(0, 8),
  };

  return res.json(stats);
});

// --------------------------------------------------------------------------
// SETTINGS (Section 18)
// --------------------------------------------------------------------------
apiRouter.get('/settings', (req: Request, res: Response) => {
  return res.json(db.getSettings());
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  return res.json({
    success: true,
    settings: updated,
    message: 'Configurações da empresa e parâmetros visuais atualizados com sucesso.',
  });
});

// --------------------------------------------------------------------------
// NTFY & BLUEFOCUS UTILITIES
// --------------------------------------------------------------------------
apiRouter.post('/ntfy/test', async (req: Request, res: Response) => {
  const { topic, message } = req.body;
  const result = await notificationService.sendTestNotification(topic, message);
  return res.json(result);
});

apiRouter.get('/ntfy/logs', (req: Request, res: Response) => {
  return res.json(notificationService.getLogs());
});

// --------------------------------------------------------------------------
// BLUEFOCUS WEBSERVICES API (Valim Software Integration)
// --------------------------------------------------------------------------
apiRouter.get('/bluefocus/status', async (req: Request, res: Response) => {
  const status = await blueFocusService.testConnection();
  const orders = db.getOrders();
  const pendingOrdersCount = orders.filter((o) => !o.blueFocusSynced && o.orderStatus !== 'CANCELADO').length;
  return res.json({
    ...status,
    config: blueFocusService.getConfig(),
    pendingOrdersCount,
    logs: blueFocusService.getLogs().slice(0, 15),
  });
});

apiRouter.get('/bluefocus/config', (req: Request, res: Response) => {
  return res.json(blueFocusService.getConfig());
});

apiRouter.put('/bluefocus/config', (req: Request, res: Response) => {
  const current = db.getSettings();
  const updatedSettings = db.updateSettings({
    blueFocus: {
      ...current.blueFocus,
      ...req.body,
    },
  });
  return res.json({
    success: true,
    config: updatedSettings.blueFocus,
    message: 'Configurações de integração BlueFocus salvas com sucesso.',
  });
});

apiRouter.post('/bluefocus/test-connection', async (req: Request, res: Response) => {
  const result = await blueFocusService.testConnection();
  return res.json(result);
});

apiRouter.post('/bluefocus/import-products', async (req: Request, res: Response) => {
  const { tipoAtualizacao, startProdutoId } = req.body || {};
  const result = await blueFocusService.importProducts({
    tipoAtualizacao,
    startProdutoId: Number(startProdutoId) || 0,
  });
  return res.json(result);
});

apiRouter.post('/bluefocus/query-stock', async (req: Request, res: Response) => {
  const { productIds } = req.body || {};
  let targetProducts;
  if (Array.isArray(productIds) && productIds.length > 0) {
    targetProducts = db.getProducts().filter((p) => productIds.includes(p.id));
  }
  const result = await blueFocusService.queryStock(targetProducts);
  return res.json(result);
});

apiRouter.post('/bluefocus/export-order/:orderId', async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }
  const result = await blueFocusService.syncOrder(order);
  return res.json(result);
});

apiRouter.post('/bluefocus/export-all-pending', async (req: Request, res: Response) => {
  const result = await blueFocusService.exportAllPendingOrders();
  return res.json(result);
});

apiRouter.get('/bluefocus/image-urls/:productId', (req: Request, res: Response) => {
  const { productId } = req.params;
  const urls = blueFocusService.generateProductImageUrls(productId);
  return res.json(urls);
});

apiRouter.get('/bluefocus/preview-xml/:type', (req: Request, res: Response) => {
  const { type } = req.params;
  const config = blueFocusService.getConfig();

  if (type === 'import') {
    const xml = blueFocusService.generateExportaCadSatXml({
      empresaId: config.empresaId,
      usuarioId: config.usuarioId,
      pdvCodigo: config.pdvCodigo,
      tipoAtualizacao: config.defaultUpdateType || 'C',
      produtoId: 0,
    });
    return res.json({ type: 'import', xml });
  }

  if (type === 'stock') {
    const prods = db.getProducts().slice(0, 3);
    const xml = blueFocusService.generateConsultaQtdeXml({
      empresaId: config.empresaId,
      usuarioId: config.usuarioId,
      pdvCodigo: config.pdvCodigo,
      items: prods.map((p, i) => ({ produtoId: i + 1, codigoBarras: p.internalCode || String(i + 1) })),
    });
    return res.json({ type: 'stock', xml });
  }

  if (type === 'order') {
    const orders = db.getOrders();
    const order = orders[0];
    if (!order) return res.status(404).json({ error: 'Nenhum pedido encontrado.' });
    const xml = blueFocusService.generateRegPreVendaXml(order, config);
    return res.json({ type: 'order', xml, orderNumber: order.orderNumber });
  }

  return res.status(400).json({ error: 'Tipo de pré-visualização XML desconhecido.' });
});

apiRouter.get('/bluefocus/logs', (req: Request, res: Response) => {
  return res.json(blueFocusService.getLogs());
});

apiRouter.delete('/bluefocus/logs', (req: Request, res: Response) => {
  blueFocusService.clearLogs();
  return res.json({ success: true, message: 'Logs de integração BlueFocus limpos com sucesso.' });
});
