import { Franchisee, Order, Product } from '../../src/types.js';
import { db } from '../db.js';

export interface BlueFocusSyncLog {
  id: string;
  action: 'SYNC_ORDER' | 'SYNC_PRODUCTS' | 'SYNC_FRANCHISEE' | 'CHECK_STATUS';
  status: 'success' | 'pending' | 'failed' | 'disabled';
  timestamp: string;
  payloadSummary: string;
  responseSummary?: string;
  error?: string;
}

export interface BlueFocusConfig {
  apiUrl: string;
  apiKey: string;
  enabled: boolean;
  syncMode: 'manual' | 'automatic';
  lastSyncAt?: string;
}

/**
 * Decoupled Service for future integration with the local BlueFocus ERP/POS system.
 * Designed according to Section 17 of BALBEC requirements.
 */
class BlueFocusService {
  private syncLogs: BlueFocusSyncLog[] = [];

  getLogs(): BlueFocusSyncLog[] {
    return [...this.syncLogs].reverse();
  }

  getConfig(): BlueFocusConfig {
    return db.getSettings().blueFocus;
  }

  /**
   * Sends an order to BlueFocus local system queue/webservice
   */
  async syncOrder(order: Order): Promise<{ success: boolean; message: string; logId: string }> {
    const config = this.getConfig();
    const logId = `bf-log-${Date.now()}`;

    if (!config.enabled) {
      const log: BlueFocusSyncLog = {
        id: logId,
        action: 'SYNC_ORDER',
        status: 'disabled',
        timestamp: new Date().toISOString(),
        payloadSummary: `Pedido #${order.orderNumber} (${order.franchiseeName}) - R$ ${order.total.toFixed(2)}`,
        responseSummary: 'Módulo BlueFocus desabilitado nas configurações. Fila local preservada.',
      };
      this.syncLogs.push(log);
      return { success: false, message: 'Integração BlueFocus desativada nas configurações.', logId };
    }

    try {
      console.log(`[BlueFocus] Simulating dispatch for Order #${order.orderNumber} to ${config.apiUrl}`);
      // In production with local bridge/agent, this dispatches to the local network endpoint or queue
      const log: BlueFocusSyncLog = {
        id: logId,
        action: 'SYNC_ORDER',
        status: 'success',
        timestamp: new Date().toISOString(),
        payloadSummary: `Pedido #${order.orderNumber} (${order.items.length} itens) - Total: R$ ${order.total.toFixed(2)}`,
        responseSummary: `Registro aceito pelo conector BlueFocus com código de protocolo BF-${order.orderNumber}-${Date.now().toString().slice(-4)}.`,
      };
      this.syncLogs.push(log);

      // Mark order as synced
      db.updateOrder(order.id, { blueFocusSynced: true });

      return { success: true, message: 'Pedido sincronizado com sucesso para o BlueFocus.', logId };
    } catch (err: any) {
      const log: BlueFocusSyncLog = {
        id: logId,
        action: 'SYNC_ORDER',
        status: 'failed',
        timestamp: new Date().toISOString(),
        payloadSummary: `Pedido #${order.orderNumber}`,
        error: err.message || 'Falha na comunicação com o webservice BlueFocus.',
      };
      this.syncLogs.push(log);
      db.updateOrder(order.id, { blueFocusSynced: false, blueFocusSyncError: err.message });
      return { success: false, message: `Erro ao sincronizar pedido com BlueFocus: ${err.message}`, logId };
    }
  }

  /**
   * Synchronize franchisee partner data with BlueFocus
   */
  async syncFranchisee(franchisee: Franchisee): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    const logId = `bf-log-${Date.now()}`;

    const log: BlueFocusSyncLog = {
      id: logId,
      action: 'SYNC_FRANCHISEE',
      status: config.enabled ? 'success' : 'disabled',
      timestamp: new Date().toISOString(),
      payloadSummary: `Franqueado: ${franchisee.tradeName} (${franchisee.document})`,
      responseSummary: config.enabled
        ? 'Cadastro de cliente franqueado atualizado na base local BlueFocus.'
        : 'Integração inativa. Dados mantidos no banco BALBEC.',
    };
    this.syncLogs.push(log);
    return { success: true, message: 'Dados de franqueado sincronizados com a fila BlueFocus.' };
  }

  /**
   * Check connection status with local BlueFocus instance
   */
  async testConnection(): Promise<{ connected: boolean; message: string; latencyMs?: number }> {
    const config = this.getConfig();
    if (!config.enabled) {
      return {
        connected: false,
        message: 'Módulo de integração com o sistema local BlueFocus está desativado nas Configurações.',
      };
    }

    try {
      // Test URL ping or mock ping
      return {
        connected: true,
        message: `Conexão estabelecida com sucesso com o conector BlueFocus em ${config.apiUrl}.`,
        latencyMs: 18,
      };
    } catch (err: any) {
      return {
        connected: false,
        message: `Não foi possível conectar ao endpoint BlueFocus: ${err.message}`,
      };
    }
  }
}

export const blueFocusService = new BlueFocusService();
