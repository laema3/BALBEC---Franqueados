export type UserRole = 'admin' | 'franchisee';

export type AccountStatus = 'active' | 'inactive' | 'blocked';
export type FranchiseeStatus = AccountStatus;

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Franchisee {
  id: string;
  companyName: string; // Razão Social
  tradeName: string;   // Nome Fantasia
  document: string;    // CPF ou CNPJ
  documentType: 'CPF' | 'CNPJ';
  phone: string;
  whatsapp: string;
  email: string;
  address: Address;
  minimumOrderValue: number; // Meta de compra individual
  status: AccountStatus;
  createdAt: string;
  lastLoginAt?: string;
  isDeleted?: boolean; // Exclusão lógica
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  document?: string;
  email: string;
  franchiseeId?: string;
  franchisee?: Franchisee;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  status: 'active' | 'inactive';
  createdAt: string;
  isDeleted?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  imageUrl: string;
  internalCode: string;
  status: 'active' | 'inactive';
  createdAt: string;
  isDeleted?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentGateway = 'mercadopago' | 'pagseguro' | 'cash';
export type PaymentMethod = 'pix' | 'debit_card' | 'cash_on_pickup';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded';

export interface PaymentRecord {
  id: string;
  orderId: string;
  gateway: PaymentGateway;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  transactionId: string;
  qrCodeUrl?: string;
  qrCodeText?: string;
  paymentDetails?: string;
}

export type OrderStatus = 'RECEBIDO' | 'PREPARANDO' | 'PRONTO PARA RETIRADA' | 'RETIRADO' | 'CANCELADO';

export interface OrderStatusHistoryItem {
  id: string;
  orderId: string;
  previousStatus: OrderStatus | null;
  newStatus: OrderStatus;
  timestamp: string;
  responsibleUser: string;
  notes?: string;
}

export interface OrderItemRecord {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  internalCode: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  franchiseeId: string;
  franchiseeName: string;
  franchiseeDocument: string;
  franchiseePhone: string;
  items: OrderItemRecord[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  paymentRecord?: PaymentRecord;
  orderStatus: OrderStatus;
  estimatedPickupTime: string; // Ex: "Aproximadamente 30 minutos após a confirmação"
  createdAt: string;
  readyAt?: string;
  pickedUpAt?: string;
  cancelledAt?: string;
  statusHistory: OrderStatusHistoryItem[];
  ntfyTopic?: string;
  blueFocusSynced: boolean;
  blueFocusSyncError?: string;
  blueFocusSync?: {
    synced: boolean;
    syncedAt?: string;
    error?: string;
  };
}

export interface CompanySettings {
  companyName: string;
  logoUrl: string;
  whatsapp: string;
  phone: string;
  email: string;
  address: Address;
  visual: {
    primaryColor: string; // Amarelo (#EAB308 ou #F59E0B)
    secondaryColor: string;
    buttonColor: string;  // Vermelho (#DC2626 ou #EF4444)
    textColor: string;
    highlightColor: string;
  };
  ntfy: {
    serverUrl: string;
    defaultTopic: string;
    enabled: boolean;
  };
  blueFocus: {
    apiUrl?: string;
    apiKey?: string;
    enabled: boolean;
    syncMode: 'manual' | 'automatic';
    lastSyncAt?: string;
    // BlueFocus WebServices official fields
    autentica: string;
    empresaId: string;
    usuarioId: string;
    pdvCodigo: number;
    serverEnvironment: 'cloud' | 'local';
    localServerUrl: string;
    importProductsUrl: string;
    queryStockUrl: string;
    exportSalesUrl: string;
    defaultUpdateType: 'C' | 'A';
    autoExportOrders: boolean;
  };
  tvPanel: {
    alertSoundEnabled: boolean;
    autoDismissMinutes: number;
    fontSize: 'normal' | 'large' | 'extra_large';
  };
}

export interface DashboardStats {
  todayOrdersCount: number;
  waitingPaymentCount: number;
  receivedCount: number;
  preparingCount: number;
  readyCount: number;
  cancelledCount: number;
  todaySalesTotal: number;
  monthSalesTotal: number;
  activeFranchiseesCount: number;
  recentOrders: Order[];
}
