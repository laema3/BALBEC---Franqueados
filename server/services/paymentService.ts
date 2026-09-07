import { PaymentGateway, PaymentMethod, PaymentRecord, PaymentStatus } from '../../src/types.js';
import { db } from '../db.js';

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: number;
  amount: number;
  method: PaymentMethod;
  gateway?: PaymentGateway;
  customerName: string;
  customerDocument: string;
}

export interface PaymentGatewayResponse {
  success: boolean;
  paymentRecord: PaymentRecord;
  requiresRedirect?: boolean;
  redirectUrl?: string;
  qrCodeUrl?: string;
  qrCodeText?: string;
  message: string;
}

class PaymentService {
  /**
   * Process payment through decoupled architecture
   */
  async processPayment(input: CreatePaymentInput): Promise<PaymentGatewayResponse> {
    const { orderId, amount, method, customerName, customerDocument } = input;
    const gateway: PaymentGateway = input.gateway || (method === 'cash_on_pickup' ? 'cash' : 'mercadopago');

    // 1. Cash on Pickup ("Dinheiro na retirada")
    if (method === 'cash_on_pickup') {
      const transactionId = `CASH-${Date.now()}-${orderId}`;
      const record = db.createPayment({
        orderId,
        gateway: 'cash',
        method: 'cash_on_pickup',
        amount,
        status: 'pending', // Será pago no balcão ao retirar
        transactionId,
        paymentDetails: 'Pagamento em dinheiro na retirada no balcão BALBEC',
      });

      return {
        success: true,
        paymentRecord: record,
        message: 'Pedido confirmado com pagamento em dinheiro na retirada.',
      };
    }

    // 2. PIX Online (Mercado Pago / PagSeguro adapter)
    if (method === 'pix') {
      const transactionId = `PIX-${gateway.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      // Generate a valid-looking simulated EMV PIX payload
      const qrCodeText = `00020126580014br.gov.bcb.pix0136balbec-pagamentos-${orderId}@balbec.com.br520400005303986540${amount.toFixed(2)}5802BR5916BALBEC SALGADOS6009SAO PAULO62070503***6304`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeText)}`;

      const record = db.createPayment({
        orderId,
        gateway,
        method: 'pix',
        amount,
        status: 'pending',
        transactionId,
        qrCodeUrl,
        qrCodeText,
        paymentDetails: `Chave PIX e QR Code gerados via gateway ${gateway === 'mercadopago' ? 'Mercado Pago' : 'PagSeguro'}`,
      });

      return {
        success: true,
        paymentRecord: record,
        qrCodeUrl,
        qrCodeText,
        message: 'Código PIX gerado com sucesso. Efetue o pagamento para aprovação automática.',
      };
    }

    // 3. Cartão de Débito Online
    if (method === 'debit_card') {
      const transactionId = `DEBIT-${gateway.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      const record = db.createPayment({
        orderId,
        gateway,
        method: 'debit_card',
        amount,
        status: 'pending',
        transactionId,
        paymentDetails: `Transação de Débito Online iniciada via gateway ${gateway === 'mercadopago' ? 'Mercado Pago' : 'PagSeguro'}`,
      });

      return {
        success: true,
        paymentRecord: record,
        message: 'Transação de cartão de débito criada. Aguardando processamento.',
      };
    }

    throw new Error(`Método de pagamento desconhecido: ${method}`);
  }

  /**
   * Handle Webhook confirmation from gateways (Mercado Pago / PagSeguro)
   */
  async handleWebhook(payload: {
    transactionId: string;
    status: PaymentStatus;
    gateway: PaymentGateway;
  }): Promise<{ success: boolean; message: string; orderId?: string }> {
    const { transactionId, status, gateway } = payload;
    console.log(`[PaymentService Webhook] Received status update '${status}' for tx ${transactionId} via ${gateway}`);

    const payments = (db as any).data.payments as PaymentRecord[];
    const payment = payments.find((p) => p.transactionId === transactionId || p.id === transactionId);

    if (!payment) {
      return { success: false, message: `Pagamento com ID/Transação ${transactionId} não encontrado.` };
    }

    payment.status = status;
    db.saveData();

    // If approved, update order paymentStatus to approved
    const order = db.getOrderById(payment.orderId);
    if (order) {
      order.paymentStatus = status;
      if (status === 'approved' && order.orderStatus === 'RECEBIDO') {
        db.updateOrderStatus(order.id, 'PREPARANDO', 'Gateway de Pagamento (Automático)', 'Pagamento online confirmado com sucesso.');
      }
      db.saveData();
      return { success: true, message: `Pagamento ${status} atualizado com sucesso.`, orderId: order.id };
    }

    return { success: true, message: `Pagamento atualizado com sucesso.` };
  }
}

export const paymentService = new PaymentService();
