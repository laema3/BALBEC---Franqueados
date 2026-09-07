import React, { useState, useEffect } from 'react';
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  Cloud,
  ArrowDownToLine,
  ArrowUpFromLine,
  Boxes,
  FileCode2,
  ShieldCheck,
  Save,
  Trash2,
  Copy,
  ExternalLink,
  Check,
  Search,
  Package,
  Clock,
  Radio,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CompanySettings, Order, Product } from '../../types';

interface BlueFocusStatusResponse {
  connected: boolean;
  message: string;
  config: CompanySettings['blueFocus'];
  pendingOrdersCount: number;
  logs: any[];
}

export const BlueFocusManager: React.FC = () => {
  const { settings, updateSettings, orders, products, triggerNotification } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'config' | 'operations' | 'stock' | 'xml' | 'logs'>('config');
  const [formData, setFormData] = useState<CompanySettings['blueFocus']>({
    ...settings.blueFocus,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; message: string } | null>(null);

  // Operations states
  const [importType, setImportType] = useState<'C' | 'A'>('C');
  const [importResult, setImportResult] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Stock query states
  const [stockResults, setStockResults] = useState<any[]>([]);
  const [isQueryingStock, setIsQueryingStock] = useState(false);
  const [stockFilter, setStockFilter] = useState('');

  // XML Inspector states
  const [xmlType, setXmlType] = useState<'import' | 'stock' | 'order'>('order');
  const [previewXml, setPreviewXml] = useState<string>('');
  const [copiedXml, setCopiedXml] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Sample image tester
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '1');
  const [imageUrls, setImageUrls] = useState<any>(null);

  // Update local form state when context settings change
  useEffect(() => {
    if (settings.blueFocus) {
      setFormData({
        ...settings.blueFocus,
      });
    }
  }, [settings.blueFocus]);

  // Load initial status & logs
  useEffect(() => {
    loadStatus();
    loadLogs();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/bluefocus/status');
      if (res.ok) {
        const data: BlueFocusStatusResponse = await res.json();
        setConnectionStatus({ connected: data.connected, message: data.message });
      }
    } catch {
      // ignore
    }
  };

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/bluefocus/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus(null);
    try {
      const res = await fetch('/api/bluefocus/test-connection', { method: 'POST' });
      const data = await res.json();
      setConnectionStatus({ connected: data.connected, message: data.message });
      loadLogs();
      if (data.connected) {
        triggerNotification('Conexão BlueFocus validada com sucesso!', 'success');
      } else {
        triggerNotification(data.message || 'Falha no teste de conexão BlueFocus.', 'warning');
      }
    } catch (err: any) {
      setConnectionStatus({ connected: false, message: 'Erro de rede ao testar conexão com o servidor.' });
      triggerNotification('Erro de rede ao contatar WebService.', 'warning');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/bluefocus/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await updateSettings({
          blueFocus: formData,
        });
        triggerNotification('Configurações da BlueFocus salvas com sucesso!', 'success');
        handleTestConnection();
      } else {
        triggerNotification('Erro ao salvar configurações.', 'warning');
      }
    } catch {
      triggerNotification('Erro ao comunicar com o servidor.', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportProducts = async () => {
    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/bluefocus/import-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoAtualizacao: importType }),
      });
      const data = await res.json();
      setImportResult(data);
      loadLogs();
      if (data.success) {
        triggerNotification(`Sucesso! ${data.importedCount} produtos importados do BlueFocus.`, 'success');
      } else {
        triggerNotification(data.message, 'warning');
      }
    } catch {
      triggerNotification('Falha ao importar produtos.', 'warning');
    } finally {
      setIsImporting(false);
    }
  };

  const handleQueryStock = async () => {
    setIsQueryingStock(true);
    try {
      const res = await fetch('/api/bluefocus/query-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setStockResults(data.results || []);
        triggerNotification(`Estoque consultado com sucesso no PDV BlueFocus!`, 'success');
      }
      loadLogs();
    } catch {
      triggerNotification('Erro ao consultar estoque no WebService.', 'warning');
    } finally {
      setIsQueryingStock(false);
    }
  };

  const handleExportOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/bluefocus/export-order/${orderId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        triggerNotification(data.message, 'success');
      } else {
        triggerNotification(data.message || 'Erro ao exportar pedido.', 'warning');
      }
      loadLogs();
    } catch {
      triggerNotification('Erro de comunicação.', 'warning');
    }
  };

  const handleExportAllPending = async () => {
    try {
      const res = await fetch('/api/bluefocus/export-all-pending', { method: 'POST' });
      const data = await res.json();
      triggerNotification(`${data.exportedCount} pedidos exportados para o BlueFocus!`, 'success');
      loadLogs();
    } catch {
      triggerNotification('Erro ao exportar pedidos em lote.', 'warning');
    }
  };

  const handleFetchXmlPreview = async (type: 'import' | 'stock' | 'order') => {
    setXmlType(type);
    try {
      const res = await fetch(`/api/bluefocus/preview-xml/${type}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewXml(data.xml);
      }
    } catch {
      // ignore
    }
  };

  const handleCopyXml = () => {
    if (previewXml) {
      navigator.clipboard.writeText(previewXml);
      setCopiedXml(true);
      setTimeout(() => setCopiedXml(false), 2000);
      triggerNotification('Envelope SOAP XML copiado para a área de transferência!', 'success');
    }
  };

  const handleFetchImageUrls = async (prodId: string) => {
    setSelectedProductId(prodId);
    try {
      const res = await fetch(`/api/bluefocus/image-urls/${prodId}`);
      if (res.ok) {
        const data = await res.json();
        setImageUrls(data);
      }
    } catch {
      // ignore
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/bluefocus/logs', { method: 'DELETE' });
      setLogs([]);
      triggerNotification('Logs de integração limpos.', 'success');
    } catch {
      // ignore
    }
  };

  // Filtered stock list
  const filteredStock = stockResults.filter(
    (item) =>
      item.descricao?.toLowerCase().includes(stockFilter.toLowerCase()) ||
      String(item.produtoId).includes(stockFilter) ||
      item.codigoBarras?.includes(stockFilter)
  );

  const pendingOrders = orders.filter((o) => !o.blueFocusSynced && o.orderStatus !== 'CANCELADO');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-xl p-6 text-white shadow-lg border border-blue-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600/30 rounded-xl border border-blue-400/30 text-blue-400">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight">Integração BlueFocus ERP / PDV</h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Valim Software SOAP
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                Conectividade oficial com WebServices WSDL: Cadastro de Produtos (ExportaCadSAT), Consulta de Estoque (ConsultaQtde) e Exportação de Pré-Vendas (RegPreVendaSAT).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testando Conexão...' : 'Testar Conexão SOAP'}
            </button>
          </div>
        </div>

        {/* Live Status indicator */}
        {connectionStatus && (
          <div
            className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-3 border ${
              connectionStatus.connected
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
            }`}
          >
            {connectionStatus.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            )}
            <span className="font-medium">{connectionStatus.message}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('config')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeSubTab === 'config'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Configurações WSDL
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('operations')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors relative ${
            activeSubTab === 'operations'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ArrowUpFromLine className="w-4 h-4" />
          Exportação de Pedidos
          {pendingOrders.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full font-bold">
              {pendingOrders.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('stock');
            if (stockResults.length === 0) handleQueryStock();
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeSubTab === 'stock'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Consulta de Estoque
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('xml');
            handleFetchXmlPreview('order');
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeSubTab === 'xml'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          Inspetor SOAP XML
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('logs');
            loadLogs();
          }}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeSubTab === 'logs'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          Logs de Auditoria ({logs.length})
        </button>
      </div>

      {/* TAB 1: CONFIGURAÇÕES */}
      {activeSubTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Parâmetros de Conexão BlueFocus</h3>
                <p className="text-sm text-gray-500">
                  Preencha os dados fornecidos pela BlueFocus / Valim Software para habilitar a comunicação SOAP.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                <span className="text-sm font-medium text-gray-700">Integração Ativa:</span>
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
              </label>
            </div>

            {/* Credenciais Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Chave de Autenticação (autentica) *
                </label>
                <input
                  type="text"
                  value={formData.autentica}
                  onChange={(e) => setFormData({ ...formData, autentica: e.target.value })}
                  placeholder="ex: c89f2aab-5aa6-451d-8da8-06709422d3da"
                  required
                  className="w-full text-sm font-mono px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Token enviado no cabeçalho HTTP <code className="text-blue-700">autentica</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Código da Empresa (EmpresaId) *
                </label>
                <input
                  type="text"
                  value={formData.empresaId}
                  onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })}
                  placeholder="ex: EMPRESATESTE ou BALBEC01"
                  required
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">Identificador da empresa no PDV</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Usuário no PDV (UsuarioId) *
                </label>
                <input
                  type="text"
                  value={formData.usuarioId}
                  onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
                  placeholder="ex: CAIXA ou ADMIN"
                  required
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">Usuário autorizado para registrar vendas</span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Código do PDV (PDVCodigo) *
                </label>
                <input
                  type="number"
                  value={formData.pdvCodigo}
                  onChange={(e) => setFormData({ ...formData, pdvCodigo: parseInt(e.target.value, 10) || 2 })}
                  placeholder="ex: 2 ou 5"
                  required
                  min={1}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">Código do PDV cadastrado no ERP</span>
              </div>
            </div>

            {/* Ambiente e URLs */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <div className="flex items-center gap-6">
                <span className="text-sm font-semibold text-gray-700">Ambiente do Servidor:</span>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="serverEnvironment"
                    value="cloud"
                    checked={formData.serverEnvironment === 'cloud'}
                    onChange={() => setFormData({ ...formData, serverEnvironment: 'cloud' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Cloud className="w-4 h-4 text-blue-600" />
                  Nuvem (BlueFocus Cloud)
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="serverEnvironment"
                    value="local"
                    checked={formData.serverEnvironment === 'local'}
                    onChange={() => setFormData({ ...formData, serverEnvironment: 'local' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Server className="w-4 h-4 text-emerald-600" />
                  Servidor Local (Intranet / DDNS)
                </label>
              </div>

              {formData.serverEnvironment === 'local' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                    URL do Servidor Local / DDNS
                  </label>
                  <input
                    type="url"
                    value={formData.localServerUrl}
                    onChange={(e) => setFormData({ ...formData, localServerUrl: e.target.value })}
                    placeholder="http://meupdv.ddns.net:8082"
                    className="w-full text-sm font-mono px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Endpoints WSDL */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    1. WSDL - Exporta Produtos (ExportaCadSAT)
                  </label>
                  <input
                    type="url"
                    value={formData.importProductsUrl}
                    onChange={(e) => setFormData({ ...formData, importProductsUrl: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    2. WSDL - Consulta Quantidade (ConsultaQtde)
                  </label>
                  <input
                    type="url"
                    value={formData.queryStockUrl}
                    onChange={(e) => setFormData({ ...formData, queryStockUrl: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    3. WSDL - Pré-Venda SAT (RegPreVendaSAT)
                  </label>
                  <input
                    type="url"
                    value={formData.exportSalesUrl}
                    onChange={(e) => setFormData({ ...formData, exportSalesUrl: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Regras de Automação */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
                  Tipo de Atualização Padrão para Produtos
                </label>
                <select
                  value={formData.defaultUpdateType}
                  onChange={(e) => setFormData({ ...formData, defaultUpdateType: e.target.value as 'C' | 'A' })}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="C">C - Carga Completa (Toda a base cadastrada)</option>
                  <option value="A">A - Apenas Últimas Atualizações (Alterações recentes)</option>
                </select>
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Parâmetro <code className="text-blue-700">TipoAtualizacao</code> exigido na página 1 do manual.
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <span className="text-sm font-semibold text-gray-800 block">Exportação Automática de Pedidos</span>
                  <span className="text-xs text-gray-500">
                    Ao confirmar ou aprovar um pedido de franqueado, exporta de imediato para o BlueFocus.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoExportOrders}
                  onChange={(e) => setFormData({ ...formData, autoExportOrders: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between rounded-b-xl">
            <span className="text-xs text-gray-500">
              Última sincronização:{' '}
              {formData.lastSyncAt ? new Date(formData.lastSyncAt).toLocaleString('pt-BR') : 'Nunca sincronizado'}
            </span>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: EXPORTAÇÃO DE PEDIDOS (PRÉ-VENDAS) */}
      {activeSubTab === 'operations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sincronização de Pré-Vendas (RegPreVendaSAT)</h3>
                <p className="text-sm text-gray-500">
                  Exporta pedidos realizados pelos franqueados como pré-vendas no PDV BlueFocus para conferência e emissão fiscal.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportAllPending}
                  disabled={pendingOrders.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  <ArrowUpFromLine className="w-4 h-4" />
                  Exportar Pendentes ({pendingOrders.length})
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-semibold border-y border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Pedido #</th>
                    <th className="py-3 px-4">Franqueado</th>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status BALBEC</th>
                    <th className="py-3 px-4">Status BlueFocus</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">#{order.orderNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-800 block">{order.franchiseeName}</span>
                        <span className="text-xs text-gray-500">{order.franchiseeDocument}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(order.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        R$ {order.total.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {order.blueFocusSynced ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Sincronizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Pendente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleExportOrder(order.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-md transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          {order.blueFocusSynced ? 'Reexportar' : 'Exportar SAT'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Products Action Box */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Importação de Produtos (ExportaCadSAT)</h3>
                <p className="text-sm text-gray-500">
                  Carrega o catálogo oficial cadastrado no ERP da BlueFocus para o cardápio do BALBEC.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as 'C' | 'A')}
                  className="text-xs font-medium border border-gray-300 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="C">Carga Completa (C)</option>
                  <option value="A">Apenas Atualizações (A)</option>
                </select>

                <button
                  type="button"
                  onClick={handleImportProducts}
                  disabled={isImporting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  <ArrowDownToLine className={`w-4 h-4 ${isImporting ? 'animate-bounce' : ''}`} />
                  {isImporting ? 'Importando...' : 'Importar Catálogo BlueFocus'}
                </button>
              </div>
            </div>

            {importResult && (
              <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{importResult.message}</span>
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-mono">
                    SNFim: {importResult.snFim} | {importResult.importedCount} produtos
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CONSULTA DE ESTOQUE */}
      {activeSubTab === 'stock' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Consulta de Quantidade / Estoque no PDV</h3>
              <p className="text-sm text-gray-500">
                WebService <code className="text-blue-700">IntegracaoFcxConsultaQtde</code> - Saldos atuais dos produtos no ERP.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  placeholder="Filtrar por nome ou código..."
                  className="pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleQueryStock}
                disabled={isQueryingStock}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isQueryingStock ? 'animate-spin' : ''}`} />
                {isQueryingStock ? 'Consultando...' : 'Atualizar Estoque Agora'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-semibold border-y border-gray-200">
                <tr>
                  <th className="py-3 px-4">Produto ID</th>
                  <th className="py-3 px-4">Código de Barras</th>
                  <th className="py-3 px-4">Descrição do Produto</th>
                  <th className="py-3 px-4">Lote PDV</th>
                  <th className="py-3 px-4 text-right">Quantidade em Estoque</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Nenhum item retornado. Clique em "Atualizar Estoque Agora".
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">{item.produtoId}</td>
                      <td className="py-3 px-4 font-mono text-xs text-gray-600">{item.codigoBarras}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{item.descricao || 'Produto BALBEC'}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                          {item.lote}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {item.quantidade.toLocaleString('pt-BR')} un
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.quantidade > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Disponível
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                            Zerado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: INSPETOR SOAP XML E IMAGENS */}
      {activeSubTab === 'xml' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Envelopes SOAP Gerados (Valim Schema)</h3>
                <p className="text-xs text-gray-500">
                  Pré-visualize e teste os XMLs gerados em conformidade estrita com o manual da BlueFocus.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyXml}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-md transition-colors"
                >
                  {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedXml ? 'Copiado!' : 'Copiar XML'}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleFetchXmlPreview('order')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  xmlType === 'order' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                RegPreVendaSAT (Vendas)
              </button>
              <button
                type="button"
                onClick={() => handleFetchXmlPreview('import')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  xmlType === 'import' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                ExportaCadSAT (Produtos)
              </button>
              <button
                type="button"
                onClick={() => handleFetchXmlPreview('stock')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                  xmlType === 'stock' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                ConsultaQtde (Estoque)
              </button>
            </div>

            <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 border border-slate-800 leading-relaxed">
              {previewXml || 'Carregando estrutura SOAP...'}
            </pre>
          </div>

          {/* Gerador de URLs de Imagem (Página 10) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-base font-semibold text-gray-900">URLs de Fotos da Mercadoria (Pág. 10)</h3>
            <p className="text-xs text-gray-500">
              O BlueFocus hospeda fotos com as extensões <code className="text-blue-600">.jpg</code>, <code className="text-blue-600">-A.jpg</code> até <code className="text-blue-600">-D.jpg</code>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Selecione o Produto:</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleFetchImageUrls(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.internalCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleFetchImageUrls(selectedProductId)}
                className="w-full py-2 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
              >
                Gerar Links Oficiais de Imagem
              </button>

              {imageUrls && (
                <div className="space-y-2 text-xs font-mono bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-x-auto">
                  <div className="truncate">
                    <span className="text-gray-500">Principal: </span>
                    <a href={imageUrls.main} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      {imageUrls.main}
                    </a>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500">Variação A: </span>
                    <a href={imageUrls.variantA} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      {imageUrls.variantA}
                    </a>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-500">Variação B: </span>
                    <a href={imageUrls.variantB} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      {imageUrls.variantB}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: LOGS DE AUDITORIA */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Histórico de Transações SOAP BlueFocus</h3>
              <p className="text-sm text-gray-500">
                Auditoria de envelopes enviados, requisições de estoque, importações e retornos de pré-vendas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Logs
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-[11px] font-semibold border-y border-gray-200">
                <tr>
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Operação</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Endpoint / Ação</th>
                  <th className="py-3 px-4">Resumo da Resposta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      Nenhum log de integração registrado ainda.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/70">
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                            Sucesso
                          </span>
                        ) : log.status === 'warning' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                            Aviso
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">
                            Falha
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-xs text-gray-800">{log.payloadSummary}</div>
                        <div className="text-[11px] text-gray-400 font-mono truncate max-w-xs">{log.endpoint}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {log.responseSummary || log.error || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
