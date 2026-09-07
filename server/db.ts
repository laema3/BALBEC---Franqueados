import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Category,
  CompanySettings,
  Franchisee,
  Order,
  OrderStatus,
  OrderStatusHistoryItem,
  PaymentRecord,
  Product,
} from '../src/types.js';

interface DatabaseSchema {
  categories: Category[];
  products: Product[];
  franchisees: (Franchisee & { passwordHash?: string })[];
  orders: Order[];
  payments: PaymentRecord[];
  settings: CompanySettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

function hashPassword(pass: string): string {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

const initialSettings: CompanySettings = {
  companyName: 'BALBEC Salgados & Cia',
  logoUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=160&auto=format&fit=crop&q=80',
  whatsapp: '(11) 98765-4321',
  phone: '(11) 3456-7890',
  email: 'pedidos@balbec.com.br',
  address: {
    street: 'Avenida das Indústrias',
    number: '1500',
    complement: 'Galpão 4',
    neighborhood: 'Distrito Industrial',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '04571-000',
  },
  visual: {
    primaryColor: '#F59E0B', // Amarelo BALBEC (Amber 500)
    secondaryColor: '#D97706',
    buttonColor: '#DC2626',  // Vermelho para botões de adicionar ao carrinho
    textColor: '#1F2937',
    highlightColor: '#EF4444',
  },
  ntfy: {
    serverUrl: process.env.NTFY_SERVER_URL || 'https://ntfy.sh',
    defaultTopic: process.env.NTFY_TOPIC || 'balbec_pedidos_notificacoes',
    enabled: true,
  },
  blueFocus: {
    apiUrl: process.env.BLUEFOCUS_API_URL || 'http://localhost:8080/api/bluefocus',
    apiKey: process.env.BLUEFOCUS_API_KEY || '',
    enabled: false,
    syncMode: 'manual',
  },
  tvPanel: {
    alertSoundEnabled: true,
    autoDismissMinutes: 60,
    fontSize: 'large',
  },
};

const initialCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Salgados Fritos',
    description: 'Salgados tradicionais fritos sequinhos na hora',
    displayOrder: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-2',
    name: 'Salgados Assados',
    description: 'Massa leve e recheios selecionados assados no forno',
    displayOrder: 2,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-3',
    name: 'Mini Salgados (Cento)',
    description: 'Centos de mini salgados congelados ou prontos para eventos e revenda',
    displayOrder: 3,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-4',
    name: 'Bebidas & Sucos',
    description: 'Refrigerantes, sucos naturais e águas para complementar',
    displayOrder: 4,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cat-5',
    name: 'Doces & Sobremesas',
    description: 'Churros, brigadeiros e sobremesas especiais',
    displayOrder: 5,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Coxinha Especial de Frango c/ Catupiry (100g)',
    description: 'Massa de batata crocante recheada com peito de frango desfiado temperado e requeijão Catupiry original.',
    categoryId: 'cat-1',
    price: 6.50,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    internalCode: 'SLG-101',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    name: 'Quibe Recheado com Queijo (100g)',
    description: 'Trigo selecionado temperado com hortelã fresca e carne bovina moída de primeira recheado com mussarela derretida.',
    categoryId: 'cat-1',
    price: 6.50,
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
    internalCode: 'SLG-102',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    name: 'Bolinho de Queijo Provolone & Mussarela (90g)',
    description: 'Massa cremosa e crocante com blend nobre de queijos fundidos irresistíveis.',
    categoryId: 'cat-1',
    price: 6.00,
    imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80',
    internalCode: 'SLG-103',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    name: 'Enroladinho de Salsicha Especial c/ Parmesão',
    description: 'Salsicha defumada de alta qualidade envolta em massa fina douradinha.',
    categoryId: 'cat-1',
    price: 5.50,
    imageUrl: 'https://images.unsplash.com/photo-1619860860774-1e2e17343432?w=600&auto=format&fit=crop&q=80',
    internalCode: 'SLG-104',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-5',
    name: 'Esfiha Fechada de Carne Temperada (120g)',
    description: 'Massa folhada macia recheada com carne moída, cebola, tomate e especiarias sírias.',
    categoryId: 'cat-2',
    price: 7.00,
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80',
    internalCode: 'ASD-201',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-6',
    name: 'Empada de Palmito Cremoso (110g)',
    description: 'Massa podre artesanal que derrete na boca com recheio aveludado de palmito pupunha.',
    categoryId: 'cat-2',
    price: 7.50,
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
    internalCode: 'ASD-202',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-7',
    name: 'Pastel de Forno Integral de Ricota c/ Espinafre',
    description: 'Opção leve e saudável com massa enriquecida de grãos e recheio cremoso.',
    categoryId: 'cat-2',
    price: 7.00,
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    internalCode: 'ASD-203',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-8',
    name: 'Cento de Mini Coxinhas Festivas (100 un)',
    description: 'Caixa com 100 unidades de mini coxinhas perfeitas para revenda e balcão aquecido.',
    categoryId: 'cat-3',
    price: 75.00,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    internalCode: 'CNT-301',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-9',
    name: 'Cento de Mini Kibe c/ Hortelã (100 un)',
    description: 'Caixa com 100 unidades de mini kibes congelados no ponto para fritura rápida.',
    categoryId: 'cat-3',
    price: 75.00,
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80',
    internalCode: 'CNT-302',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-10',
    name: 'Cento Sortido Especial BALBEC (100 un)',
    description: '25 Coxinhas, 25 Kibes, 25 Bolinhas de Queijo e 25 Enroladinhos.',
    categoryId: 'cat-3',
    price: 80.00,
    imageUrl: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80',
    internalCode: 'CNT-303',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-11',
    name: 'Guaraná Antarctica 2L (Fardo c/ 6 unidades)',
    description: 'Fardo promocional para revenda em lanchonetes parceiras.',
    categoryId: 'cat-4',
    price: 54.00,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
    internalCode: 'BEB-401',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'prod-12',
    name: 'Mini Churros de Doce de Leite (Cento 100 un)',
    description: 'Crocantes por fora com generoso recheio de doce de leite artesanal.',
    categoryId: 'cat-5',
    price: 70.00,
    imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&auto=format&fit=crop&q=80',
    internalCode: 'DOC-501',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

const initialFranchisees: (Franchisee & { passwordHash?: string })[] = [
  {
    id: 'fran-1',
    companyName: 'Padaria & Lanchonete Estação Central Ltda',
    tradeName: 'Estação Central dos Salgados (Simulação de Compra)',
    document: '12.345.678/0001-90',
    documentType: 'CNPJ',
    phone: '(11) 3322-1100',
    whatsapp: '(11) 98111-2233',
    email: 'estacao.central@balbecparceiros.com.br',
    address: {
      street: 'Praça da Sé',
      number: '250',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01001-000',
    },
    minimumOrderValue: 500.00, // Meta de R$ 500,00
    status: 'active',
    createdAt: '2025-01-15T09:00:00Z',
    passwordHash: hashPassword('123456'),
  },
  {
    id: 'fran-2',
    companyName: 'Café & Conveniência Sul Eireli',
    tradeName: 'Cafeteria e Salgaderia Sul',
    document: '98.765.432/0001-10',
    documentType: 'CNPJ',
    phone: '(11) 5544-3322',
    whatsapp: '(11) 97766-5544',
    email: 'cafe.sul@balbecparceiros.com.br',
    address: {
      street: 'Avenida Santo Amaro',
      number: '3410',
      neighborhood: 'Brooklin',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04556-300',
    },
    minimumOrderValue: 300.00, // Meta de R$ 300,00
    status: 'active',
    createdAt: '2025-02-10T14:30:00Z',
    passwordHash: hashPassword('123456'),
  },
  {
    id: 'fran-3',
    companyName: 'João da Silva ME',
    tradeName: 'Lanchonete Silva & Filhos',
    document: '123.456.789-00',
    documentType: 'CPF',
    phone: '(11) 2987-6543',
    whatsapp: '(11) 99123-4567',
    email: 'joao.silva@balbecparceiros.com.br',
    address: {
      street: 'Rua Voluntários da Pátria',
      number: '890',
      neighborhood: 'Santana',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '02010-100',
    },
    minimumOrderValue: 1000.00, // Meta de R$ 1.000,00
    status: 'active',
    createdAt: '2025-03-01T10:15:00Z',
    passwordHash: hashPassword('123456'),
  },
  {
    id: 'fran-4',
    companyName: 'Mercado & Empório Central ME',
    tradeName: 'Mercado Central',
    document: '55.666.777/0001-88',
    documentType: 'CNPJ',
    phone: '(11) 4433-2211',
    whatsapp: '(11) 98899-0011',
    email: 'mercadocentral@balbecparceiros.com.br',
    address: {
      street: 'Rua da Cantareira',
      number: '306',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01024-000',
    },
    minimumOrderValue: 500.00,
    status: 'active',
    createdAt: '2025-03-05T11:00:00Z',
    passwordHash: hashPassword('123456'),
  },
  {
    id: 'fran-5',
    companyName: 'Empório do Sabor Ltda',
    tradeName: 'Empório do Sabor (Bloqueado p/ teste)',
    document: '11.222.333/0001-44',
    documentType: 'CNPJ',
    phone: '(11) 4002-8922',
    whatsapp: '(11) 98877-6655',
    email: 'bloqueado@balbecparceiros.com.br',
    address: {
      street: 'Avenida Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
    },
    minimumOrderValue: 400.00,
    status: 'blocked', // Teste de bloqueio de acesso
    createdAt: '2025-02-20T08:00:00Z',
    passwordHash: hashPassword('123456'),
  },
  {
    id: 'fran-6',
    companyName: 'Quiosque Avenida Eireli',
    tradeName: 'Quiosque Avenida (Inativo p/ teste)',
    document: '444.555.666-77',
    documentType: 'CPF',
    phone: '(11) 3211-9988',
    whatsapp: '(11) 97788-9900',
    email: 'inativo@balbecparceiros.com.br',
    address: {
      street: 'Rua Augusta',
      number: '500',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-000',
    },
    minimumOrderValue: 350.00,
    status: 'inactive', // Teste de inativação
    createdAt: '2025-01-28T16:00:00Z',
    passwordHash: hashPassword('123456'),
  },
];

const now = new Date();
const formattedDate = now.toISOString();

const initialOrders: Order[] = [
  {
    id: 'ord-1025',
    orderNumber: 1025,
    franchiseeId: 'fran-3',
    franchiseeName: 'Lanchonete Silva & Filhos',
    franchiseeDocument: '123.456.789-00',
    franchiseePhone: '(11) 99123-4567',
    items: [
      {
        productId: 'prod-10',
        productName: 'Cento Sortido Especial BALBEC (100 un)',
        unitPrice: 80.00,
        quantity: 10,
        subtotal: 800.00,
        internalCode: 'CNT-303',
      },
      {
        productId: 'prod-8',
        productName: 'Cento de Mini Coxinhas Festivas (100 un)',
        unitPrice: 75.00,
        quantity: 3,
        subtotal: 225.00,
        internalCode: 'CNT-301',
      },
    ],
    subtotal: 1025.00,
    discount: 0,
    total: 1025.00,
    paymentMethod: 'pix',
    paymentStatus: 'approved',
    paymentId: 'pay-1025',
    orderStatus: 'PRONTO PARA RETIRADA', // Ready on TV!
    estimatedPickupTime: 'Aproximadamente 30 minutos após a confirmação',
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    readyAt: new Date(Date.now() - 10 * 60000).toISOString(),
    statusHistory: [
      {
        id: 'hist-1',
        orderId: 'ord-1025',
        previousStatus: null,
        newStatus: 'RECEBIDO',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        responsibleUser: 'Sistema BALBEC',
        notes: 'Pedido registrado via PIX online aprovado.',
      },
      {
        id: 'hist-2',
        orderId: 'ord-1025',
        previousStatus: 'RECEBIDO',
        newStatus: 'PREPARANDO',
        timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
        responsibleUser: 'Admin Balbec (Cozinha Central)',
        notes: 'Fritura e embalagem em andamento.',
      },
      {
        id: 'hist-3',
        orderId: 'ord-1025',
        previousStatus: 'PREPARANDO',
        newStatus: 'PRONTO PARA RETIRADA',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        responsibleUser: 'Admin Balbec (Expedição)',
        notes: 'Disponibilizado na estufa de retirada e enviado para a TV.',
      },
    ],
    ntfyTopic: 'balbec_pedidos_notificacoes',
    blueFocusSynced: true,
  },
  {
    id: 'ord-1026',
    orderNumber: 1026,
    franchiseeId: 'fran-4',
    franchiseeName: 'MERCADO CENTRAL',
    franchiseeDocument: '55.666.777/0001-88',
    franchiseePhone: '(11) 98899-0011',
    items: [
      {
        productId: 'prod-8',
        productName: 'Cento de Mini Coxinhas Festivas (100 un)',
        unitPrice: 75.00,
        quantity: 5,
        subtotal: 375.00,
        internalCode: 'CNT-301',
      },
      {
        productId: 'prod-9',
        productName: 'Cento de Mini Kibe c/ Hortelã (100 un)',
        unitPrice: 75.00,
        quantity: 3,
        subtotal: 225.00,
        internalCode: 'CNT-302',
      },
    ],
    subtotal: 600.00,
    discount: 0,
    total: 600.00,
    paymentMethod: 'debit_card',
    paymentStatus: 'approved',
    paymentId: 'pay-1026',
    orderStatus: 'PRONTO PARA RETIRADA', // Ready on TV!
    estimatedPickupTime: 'Aproximadamente 30 minutos após a confirmação',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    readyAt: new Date(Date.now() - 5 * 60000).toISOString(),
    statusHistory: [
      {
        id: 'hist-4',
        orderId: 'ord-1026',
        previousStatus: null,
        newStatus: 'RECEBIDO',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        responsibleUser: 'Sistema BALBEC',
      },
      {
        id: 'hist-5',
        orderId: 'ord-1026',
        previousStatus: 'RECEBIDO',
        newStatus: 'PREPARANDO',
        timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
        responsibleUser: 'Admin Balbec',
      },
      {
        id: 'hist-6',
        orderId: 'ord-1026',
        previousStatus: 'PREPARANDO',
        newStatus: 'PRONTO PARA RETIRADA',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        responsibleUser: 'Admin Balbec',
      },
    ],
    blueFocusSynced: true,
  },
  {
    id: 'ord-1027',
    orderNumber: 1027,
    franchiseeId: 'fran-1',
    franchiseeName: 'Estação Central dos Salgados',
    franchiseeDocument: '12.345.678/0001-90',
    franchiseePhone: '(11) 98111-2233',
    items: [
      {
        productId: 'prod-1',
        productName: 'Coxinha Especial de Frango c/ Catupiry (100g)',
        unitPrice: 6.50,
        quantity: 50,
        subtotal: 325.00,
        internalCode: 'SLG-101',
      },
      {
        productId: 'prod-5',
        productName: 'Esfiha Fechada de Carne Temperada (120g)',
        unitPrice: 7.00,
        quantity: 30,
        subtotal: 210.00,
        internalCode: 'ASD-201',
      },
    ],
    subtotal: 535.00,
    discount: 0,
    total: 535.00,
    paymentMethod: 'cash_on_pickup',
    paymentStatus: 'pending',
    orderStatus: 'PREPARANDO',
    estimatedPickupTime: 'Aproximadamente 30 minutos após a confirmação',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    statusHistory: [
      {
        id: 'hist-7',
        orderId: 'ord-1027',
        previousStatus: null,
        newStatus: 'RECEBIDO',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        responsibleUser: 'Franqueado (Estação Central)',
        notes: 'Pagamento na retirada selecionado.',
      },
      {
        id: 'hist-8',
        orderId: 'ord-1027',
        previousStatus: 'RECEBIDO',
        newStatus: 'PREPARANDO',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
        responsibleUser: 'Admin Balbec',
      },
    ],
    blueFocusSynced: false,
  },
];

class DatabaseService {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return parsed;
      }
    } catch (err) {
      console.warn('Could not read persistent database.json, initializing fresh data:', err);
    }

    const defaultData: DatabaseSchema = {
      categories: initialCategories,
      products: initialProducts,
      franchisees: initialFranchisees,
      orders: initialOrders,
      payments: [],
      settings: initialSettings,
    };

    this.saveData(defaultData);
    return defaultData;
  }

  public saveData(customData?: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(customData || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving data to database.json:', err);
    }
  }

  // Categories
  getCategories(): Category[] {
    return this.data.categories.filter((c) => !c.isDeleted);
  }

  getCategoryById(id: string): Category | undefined {
    return this.data.categories.find((c) => c.id === id && !c.isDeleted);
  }

  createCategory(category: Omit<Category, 'id' | 'createdAt'>): Category {
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.categories.push(newCategory);
    this.saveData();
    return newCategory;
  }

  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };
    this.saveData();
    return this.data.categories[idx];
  }

  deleteCategory(id: string): boolean {
    const category = this.data.categories.find((c) => c.id === id);
    if (!category) return false;
    // Logical deletion to preserve references
    category.isDeleted = true;
    this.saveData();
    return true;
  }

  // Products
  getProducts(): Product[] {
    return this.data.products.filter((p) => !p.isDeleted);
  }

  getProductById(id: string): Product | undefined {
    return this.data.products.find((p) => p.id === id && !p.isDeleted);
  }

  createProduct(product: Omit<Product, 'id' | 'createdAt'>): Product {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.products.push(newProduct);
    this.saveData();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.products[idx] = { ...this.data.products[idx], ...updates };
    this.saveData();
    return this.data.products[idx];
  }

  deleteProduct(id: string): boolean {
    const prod = this.data.products.find((p) => p.id === id);
    if (!prod) return false;
    prod.isDeleted = true;
    this.saveData();
    return true;
  }

  // Franchisees
  getFranchisees(): Franchisee[] {
    return this.data.franchisees
      .filter((f) => !f.isDeleted)
      .map(({ passwordHash, ...rest }) => rest);
  }

  getFranchiseeById(id: string): (Franchisee & { passwordHash?: string }) | undefined {
    return this.data.franchisees.find((f) => f.id === id && !f.isDeleted);
  }

  getFranchiseeByDocument(documentClean: string): (Franchisee & { passwordHash?: string }) | undefined {
    const cleanNumber = documentClean.replace(/\D/g, '');
    return this.data.franchisees.find((f) => {
      if (f.isDeleted) return false;
      const fClean = f.document.replace(/\D/g, '');
      return fClean === cleanNumber;
    });
  }

  createFranchisee(franchiseeData: Omit<Franchisee, 'id' | 'createdAt'>, password?: string): Franchisee {
    const newFranchisee: Franchisee & { passwordHash?: string } = {
      ...franchiseeData,
      id: `fran-${Date.now()}`,
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(password || '123456'),
    };
    this.data.franchisees.push(newFranchisee);
    this.saveData();
    const { passwordHash, ...rest } = newFranchisee;
    return rest;
  }

  updateFranchisee(id: string, updates: Partial<Franchisee>, newPassword?: string): Franchisee | null {
    const idx = this.data.franchisees.findIndex((f) => f.id === id);
    if (idx === -1) return null;

    const current = this.data.franchisees[idx];
    const updated: Franchisee & { passwordHash?: string } = {
      ...current,
      ...updates,
    };
    if (newPassword) {
      updated.passwordHash = hashPassword(newPassword);
    }
    this.data.franchisees[idx] = updated;
    this.saveData();
    const { passwordHash, ...rest } = updated;
    return rest;
  }

  deleteFranchisee(id: string): boolean {
    const fran = this.data.franchisees.find((f) => f.id === id);
    if (!fran) return false;
    fran.isDeleted = true;
    this.saveData();
    return true;
  }

  // Orders
  getOrders(): Order[] {
    return [...this.data.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getOrderById(id: string): Order | undefined {
    return this.data.orders.find((o) => o.id === id);
  }

  getOrdersByFranchisee(franchiseeId: string): Order[] {
    return this.data.orders
      .filter((o) => o.franchiseeId === franchiseeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getReadyOrdersForTv(): Order[] {
    const readyMinutesLimit = this.data.settings.tvPanel.autoDismissMinutes || 60;
    const limitMs = readyMinutesLimit * 60 * 1000;
    const nowMs = Date.now();

    return this.data.orders.filter((o) => {
      if (o.orderStatus !== 'PRONTO PARA RETIRADA') return false;
      if (o.readyAt) {
        const elapsed = nowMs - new Date(o.readyAt).getTime();
        if (elapsed > limitMs) return false;
      }
      return true;
    });
  }

  getNextOrderNumber(): number {
    if (this.data.orders.length === 0) return 1025;
    const maxNumber = Math.max(...this.data.orders.map((o) => o.orderNumber || 0));
    return maxNumber + 1;
  }

  createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'statusHistory' | 'blueFocusSynced'>): Order {
    const orderNumber = this.getNextOrderNumber();
    const createdAt = new Date().toISOString();
    const id = `ord-${orderNumber}`;

    const initialHistory: OrderStatusHistoryItem = {
      id: `hist-${Date.now()}`,
      orderId: id,
      previousStatus: null,
      newStatus: orderData.orderStatus || 'RECEBIDO',
      timestamp: createdAt,
      responsibleUser: orderData.franchiseeName || 'Franqueado',
      notes: orderData.paymentMethod === 'cash_on_pickup' ? 'Pagamento na retirada' : 'Pedido gerado online',
    };

    const newOrder: Order = {
      ...orderData,
      id,
      orderNumber,
      createdAt,
      statusHistory: [initialHistory],
      blueFocusSynced: false,
    };

    this.data.orders.push(newOrder);
    this.saveData();
    return newOrder;
  }

  updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    responsibleUser: string,
    notes?: string
  ): Order | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;

    const previousStatus = order.orderStatus;
    order.orderStatus = newStatus;

    const now = new Date().toISOString();
    if (newStatus === 'PRONTO PARA RETIRADA' && !order.readyAt) {
      order.readyAt = now;
    } else if (newStatus === 'RETIRADO') {
      order.pickedUpAt = now;
    } else if (newStatus === 'CANCELADO') {
      order.cancelledAt = now;
    }

    const historyItem: OrderStatusHistoryItem = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderId,
      previousStatus,
      newStatus,
      timestamp: now,
      responsibleUser,
      notes,
    };

    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push(historyItem);
    this.saveData();
    return order;
  }

  updateOrder(orderId: string, updates: Partial<Order>): Order | null {
    const idx = this.data.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;
    this.data.orders[idx] = { ...this.data.orders[idx], ...updates };
    this.saveData();
    return this.data.orders[idx];
  }

  // Payments
  createPayment(paymentData: Omit<PaymentRecord, 'id' | 'createdAt'>): PaymentRecord {
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.payments.push(newPayment);
    this.saveData();
    return newPayment;
  }

  updatePayment(id: string, updates: Partial<PaymentRecord>): PaymentRecord | null {
    const idx = this.data.payments.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.data.payments[idx] = { ...this.data.payments[idx], ...updates };
    this.saveData();
    return this.data.payments[idx];
  }

  // Settings
  getSettings(): CompanySettings {
    return this.data.settings;
  }

  updateSettings(updates: Partial<CompanySettings>): CompanySettings {
    this.data.settings = {
      ...this.data.settings,
      ...updates,
      address: {
        ...this.data.settings.address,
        ...(updates.address || {}),
      },
      visual: {
        ...this.data.settings.visual,
        ...(updates.visual || {}),
      },
      ntfy: {
        ...this.data.settings.ntfy,
        ...(updates.ntfy || {}),
      },
      blueFocus: {
        ...this.data.settings.blueFocus,
        ...(updates.blueFocus || {}),
      },
      tvPanel: {
        ...this.data.settings.tvPanel,
        ...(updates.tvPanel || {}),
      },
    };
    this.saveData();
    return this.data.settings;
  }
}

export const db = new DatabaseService();
