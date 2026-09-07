import { Order, OrderStatus } from '../../src/types.js';
import { db } from '../db.js';

export interface NotificationLog {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  topic: string;
  message: string;
  title: string;
  timestamp: string;
  success: boolean;
  error?: string;
}

class NotificationService {
  private logs: NotificationLog[] = [];

  getLogs(): NotificationLog[] {
    return [...this.logs].reverse();
  }

  /**
   * Generates message formatted strictly according to BALBEC specifications (Section 14)
   */
  private getMessageForStatus(orderNumber: number, status: OrderStatus): { title: string; body: string; tags: string; priority: string } {
    switch (status) {
      case 'RECEBIDO':
        return {
          title: 'BALBEC — Pedido Recebido',
          body: `BALBEC — Pedido #${orderNumber} recebido com sucesso.`,
          tags: 'receipt,white_check_mark',
          priority: 'default',
        };
      case 'PREPARANDO':
        return {
          title: 'BALBEC — Em Preparação',
          body: `BALBEC — Seu pedido #${orderNumber} está sendo preparado.`,
          tags: 'cooking,hourglass_flowing_sand',
          priority: 'default',
        };
      case 'PRONTO PARA RETIRADA':
        return {
          title: 'BALBEC — Pronto para Retirada!',
          body: `BALBEC — Seu pedido #${orderNumber} está pronto para retirada!`,
          tags: 'bell,tada,package',
          priority: 'high',
        };
      case 'CANCELADO':
        return {
          title: 'BALBEC — Pedido Cancelado',
          body: `BALBEC — Seu pedido #${orderNumber} foi cancelado.`,
          tags: 'x,warning',
          priority: 'high',
        };
      case 'RETIRADO':
        return {
          title: 'BALBEC — Pedido Entregue',
          body: `BALBEC — Pedido #${orderNumber} retirado com sucesso. Obrigado pela parceria!`,
          tags: 'handshake,sparkles',
          priority: 'low',
        };
      default:
        return {
          title: `BALBEC — Pedido #${orderNumber}`,
          body: `Status do pedido #${orderNumber} alterado para: ${status}`,
          tags: 'information_source',
          priority: 'default',
        };
    }
  }

  /**
   * Send notification via ntfy
   */
  async notifyOrderStatusChange(order: Order, newStatus: OrderStatus): Promise<boolean> {
    const settings = db.getSettings();
    if (!settings.ntfy || !settings.ntfy.enabled) {
      console.log(`[ntfy] Notification skipped: service is disabled in settings.`);
      return false;
    }

    const serverUrl = (settings.ntfy.serverUrl || 'https://ntfy.sh').replace(/\/$/, '');
    // Allow per-client topic or global default
    const topic = order.ntfyTopic || settings.ntfy.defaultTopic || 'balbec_pedidos_notificacoes';
    const { title, body, tags, priority } = this.getMessageForStatus(order.orderNumber, newStatus);

    const logEntry: NotificationLog = {
      id: `ntfy-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderNumber: order.orderNumber,
      status: newStatus,
      topic,
      message: body,
      title,
      timestamp: new Date().toISOString(),
      success: true,
    };

    try {
      const endpoint = `${serverUrl}/${topic}`;
      console.log(`[ntfy] Sending notification to ${endpoint}: "${body}"`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Title': title,
          'Priority': priority,
          'Tags': tags,
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      logEntry.success = true;
      this.logs.push(logEntry);
      return true;
    } catch (err: any) {
      console.warn(`[ntfy] Error sending notification to ${serverUrl}/${topic}:`, err.message);
      logEntry.success = false;
      logEntry.error = err.message;
      this.logs.push(logEntry);
      // Return true for local environment resilience without breaking the order flow
      return false;
    }
  }

  async sendTestNotification(topic?: string, customMessage?: string): Promise<{ success: boolean; topic: string; message: string; error?: string }> {
    const settings = db.getSettings();
    const serverUrl = (settings.ntfy.serverUrl || 'https://ntfy.sh').replace(/\/$/, '');
    const targetTopic = topic || settings.ntfy.defaultTopic || 'balbec_pedidos_notificacoes';
    const message = customMessage || 'BALBEC — Teste de notificação de pedido via ntfy configurado com sucesso!';

    try {
      const res = await fetch(`${serverUrl}/${targetTopic}`, {
        method: 'POST',
        headers: {
          'Title': 'BALBEC — Notificação de Teste',
          'Priority': 'high',
          'Tags': 'bell,tada',
        },
        body: message,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return { success: true, topic: targetTopic, message };
    } catch (err: any) {
      return { success: false, topic: targetTopic, message, error: err.message };
    }
  }
}

export const notificationService = new NotificationService();
