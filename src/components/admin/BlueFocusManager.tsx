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
  Check,
  Search,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { CompanySettings, Order, Product } from '../../types.js';

interface BlueFocusStatusResponse {
  connected: boolean;
  message: string;
  config?: CompanySettings['blueFocus'];
  pendingOrdersCount?: number;
  logs?: any[];
}

const DEFAULT_BLUEFOCUS_CONFIG: CompanySettings['blueFocus'] = {
  enabled: true,
  syncMode: 'automatic',
  autentica: 'c89f2aab-5aa6-451d-8da8-06709422d3da',
  empresaId: 'EMPRESATESTE',
  usuarioId: 'ADMIN',
  pdvCodigo: 2,
  serverEnvironment: 'cloud',
  localServerUrl: 'http://localhost:8082',
  importProductsUrl: 'https://servidor.bluefocus.net.br/ExportaCadSAT.asmx?wsdl',
  queryStockUrl: 'https://servidor.bluefocus.net.br/ConsultaQtde.asmx?wsdl',
  exportSalesUrl: 'https://servidor.bluefocus.net.br/RegPreVendaSAT.asmx?wsdl',
  defaultUpdateType: 'C',
  autoExportOrders: true,
  autoSyncEvery2Hours: true,
};

export const BlueFocusManager: React.FC = () => {
  const { settings, refreshSettings, showToast } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'config' | 'operations' | 'stock' | 'xml' | 'logs'>('config');

  // Form data with safe default fallback
  const [formData, setFormData] = useState<CompanySettings['blueFocus']>(() => {
    if (settings?.blueFocus) {
      return { ...DEFAULT_BLUEFOCUS_CONFIG, ...settings.blueFocus };
    }
    return DEFAULT_BLUEFOCUS_CONFIG;
  });

  // Local data lists fetched from API
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  // Status & test connection
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; message: string } | null>(null);

  // Operations states
  const [importType, setImportType] = useState<'C' | 'A'>('C');
  const [importResult, setImportResult] = useState<any | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Stock query states
  const [stockResults, setStockResults] = useState<any[]>([]);
  const [isQueryingStock, setIsQueryingStock] = useState(false);
  const [stockFilter, setStockFilter] = useState('');

  // Global Sync state
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // XML Inspector states
  const [xmlType, setXmlType] = useState<'import' | 'stock' | 'order'>('order');
  const [previewXml, setPreviewXml] = useState<string>('');
  const [copiedXml, setCopiedXml] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Sample image tester
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<any>(null);

  // Update form if settings load or update
  useEffect(() => {
    if (settings?.blueFocus) {
      setFormData((prev) => ({
        ...prev,
        ...settings.blueFocus,
      }));
    }
  }, [settings?.blueFocus]);

  // Fetch orders and products
  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Erro ao carregar pedidos para BlueFocus:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        const prods = Array.isArray(data) ? data : [];
        setProducts(prods);
        if (prods.length > 0 && !selectedProductId) {
          setSelectedProductId(prods[0].id);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar produtos para BlueFocus:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadStatus = async () => {
    try {
      const res = await fetch('/api/bluefocus/status');
      if (res.ok) {
        const data: BlueFocusStatusResponse = await res.json();
        setConnectionStatus({ connected: data.connected, message: data.message });
        if (data.config) {
          setFormData((prev) => ({ ...prev, ...data.config }));
        }
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
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadStatus();
    loadLogs();
    fetchOrders();
    fetchProducts();
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus(null);
    try {
      const res = await fetch('/api/bluefocus/test-connection', { method: 'POST' });
      const data = await res.json();
      setConnectionStatus({ connected: data.connected, message: data.message });
      loadLogs();
      if (data.connected) {
        showToast('Conexão SOAP com BlueFocus validada com sucesso!');
      } else {
        showToast(data.message || 'Falha no teste de conexão BlueFocus.');
      }
    } catch (err: any) {
      setConnectionStatus({ connected: false, message: 'Erro de rede ao testar conexão com o servidor.' });
      showToast('Erro de rede ao contatar WebService.');
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
        await refreshSettings();
        showToast('Configurações da BlueFocus salvas com sucesso!');
        handleTestConnection();
      } else {
        showToast('Erro ao salvar configurações da BlueFocus.');
      }
    } catch {
      showToast('Erro ao comunicar com o servidor.');
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
        showToast(`Sucesso! ${data.importedCount || 0} produtos importados do BlueFocus.`);
        fetchProducts();
      } else {
        showToast(data.message || 'Erro na importação.');
      }
    } catch {
      showToast('Falha ao importar produtos do ERP BlueFocus.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleTriggerAutoSyncNow = async () => {
    setIsAutoSyncing(true);
    try {
      showToast('Disparando ciclo de sincronização automática de 2 horas...');
      const res = await fetch('/api/bluefocus/auto-sync/trigger', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Ciclo de sincronização de 2h finalizado com sucesso!');
        await refreshSettings();
        await fetchProducts();
        await fetchOrders();
        await loadLogs();
      } else {
        showToast(data.message || 'Falha na sincronização.');
      }
    } catch {
      showToast('Erro ao acionar sincronização automática.');
    } finally {
      setIsAutoSyncing(false);
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
        setStockResults(Array.isArray(data.results) ? data.results : []);
        showToast('Estoque consultado com sucesso no PDV BlueFocus!');
      }
      loadLogs();
    } catch {
      showToast('Erro ao consultar estoque no WebService.');
    } finally {
      setIsQueryingStock(false);
    }
  };

  const handleExportOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/bluefocus/export-order/${orderId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Pedido exportado como Pré-Venda no PDV!');
        fetchOrders();
      } else {
        showToast(data.message || 'Erro ao exportar pedido para o BlueFocus.');
      }
      loadLogs();
    } catch {
      showToast('Erro de comunicação ao exportar pedido.');
    }
  };

  const handleExportAllPending = async () => {
    try {
      const res = await fetch('/api/bluefocus/export-all-pending', { method: 'POST' });
      const data = await res.json();
      showToast(`${data.exportedCount || 0} pedidos exportados para o BlueFocus!`);
      fetchOrders();
      loadLogs();
    } catch {
      showToast('Erro ao exportar pedidos em lote.');
    }
  };

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      showToast('Iniciando sincronização completa com o BlueFocus...');
      
      // 1. Testa a conexão primeiro
      const testRes = await fetch('/api/bluefocus/test-connection', { method: 'POST' });
      const testData = await testRes.json();
      setConnectionStatus({ connected: testData.connected, message: testData.message });
      
      if (!testData.connected) {
        showToast(testData.message || 'Falha ao conectar com o servidor BlueFocus.');
        return;
      }

      // 2. Importa produtos atualizados
      const prodRes = await fetch('/api/bluefocus/import-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoAtualizacao: formData.defaultUpdateType || 'C' }),
      });
      const prodData = await prodRes.json();

      // 3. Consulta saldos de estoque
      const stockRes = await fetch('/api/bluefocus/query-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const stockData = await stockRes.json();
      if (stockData.success && Array.isArray(stockData.results)) {
        setStockResults(stockData.results);
      }

      // 4. Exporta pedidos pendentes
      const ordRes = await fetch('/api/bluefocus/export-all-pending', { method: 'POST' });
      const ordData = await ordRes.json();

      await fetchProducts();
      await fetchOrders();
      await loadLogs();

      showToast(
        `Sincronização completa finalizada! Produtos: ${prodData.importedCount || 0} | Pedidos enviados: ${ordData.exportedCount || 0}`
      );
    } catch (err) {
      showToast('Erro durante a sincronização completa com o BlueFocus.');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleFetchXmlPreview = async (type: 'import' | 'stock' | 'order') => {
    setXmlType(type);
    try {
      const res = await fetch(`/api/bluefocus/preview-xml/${type}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewXml(data.xml || '');
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
      showToast('Envelope SOAP XML copiado para a área de transferência!');
    }
  };

  const handleFetchImageUrls = async (prodId: string) => {
    if (!prodId) return;
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
      showToast('Logs de auditoria BlueFocus limpos com sucesso.');
    } catch {
      // ignore
    }
  };

  // Safe pending orders
  const pendingOrders = (orders || []).filter((o) => !o.blueFocusSynced && o.orderStatus !== 'CANCELADO');

  // Filtered stock list
  const filteredStock = (stockResults || []).filter(
    (item) =>
      item?.descricao?.toLowerCase().includes(stockFilter.toLowerCase()) ||
      String(item?.produtoId || '').includes(stockFilter) ||
      item?.codigoBarras?.includes(stockFilter)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-blue-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600/30 rounded-2xl border border-blue-400/30 text-blue-400">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Integração BlueFocus ERP / PDV
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-black rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                  Valim Software SOAP
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Conectividade oficial com WebServices WSDL: Cadastro de Produtos (ExportaCadSAT), Consulta de Estoque (ConsultaQtde) e Exportação de Pré-Vendas (RegPreVendaSAT).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              id="btn-bluefocus-test-conn"
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || isSyncingAll}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-blue-700/60 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm rounded-xl transition border border-blue-400/30 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testando...' : 'Testar Conexão'}</span>
            </button>

            <button
              id="btn-bluefocus-sync-all"
              type="button"
              onClick={handleSyncAll}
              disabled={isSyncingAll || isTesting}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Sincronizando Tudo...' : 'Sincronizar Tudo Agora'}</span>
            </button>
          </div>
        </div>

        {/* Live Status indicator */}
        {connectionStatus && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs sm:text-sm flex items-center gap-3 border ${
              connectionStatus.connected
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                : 'bg-amber-950/70 border-amber-500/50 text-amber-200'
            }`}
          >
            {connectionStatus.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <span className="font-semibold">{connectionStatus.message}</span>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('config')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeSubTab === 'config'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Configurações WSDL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('operations')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition relative cursor-pointer ${
            activeSubTab === 'operations'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowUpFromLine className="w-4 h-4" />
          <span>Exportação de Pedidos</span>
          {pendingOrders.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-amber-500 text-slate-950 rounded-full font-black">
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
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeSubTab === 'stock'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Consulta de Estoque</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('xml');
            handleFetchXmlPreview('order');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeSubTab === 'xml'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          <span>Inspetor SOAP XML</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveSubTab('logs');
            loadLogs();
          }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Logs de Auditoria ({(logs || []).length})</span>
        </button>
      </div>

      {/* TAB 1: CONFIGURAÇÕES */}
      {activeSubTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl shadow-xs border border-slate-200 divide-y divide-slate-100">
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Parâmetros de Conexão BlueFocus</h3>
                <p className="text-xs text-slate-500">
                  Preencha os dados fornecidos pela BlueFocus / Valim Software para habilitar a comunicação SOAP.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Integração Ativa:</span>
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                />
              </label>
            </div>

            {/* Credenciais Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Chave de Autenticação (autentica) *
                </label>
                <input
                  type="text"
                  value={formData.autentica}
                  onChange={(e) => setFormData({ ...formData, autentica: e.target.value })}
                  placeholder="ex: c89f2aab-5aa6-451d-8da8-06709422d3da"
                  required
                  className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Token enviado no cabeçalho HTTP <code className="text-blue-700 font-bold">autentica</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Código da Empresa (EmpresaId) *
                </label>
                <input
                  type="text"
                  value={formData.empresaId}
                  onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })}
                  placeholder="ex: EMPRESATESTE ou BALBEC01"
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Identificador da empresa no PDV</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Usuário no PDV (UsuarioId) *
                </label>
                <input
                  type="text"
                  value={formData.usuarioId}
                  onChange={(e) => setFormData({ ...formData, usuarioId: e.target.value })}
                  placeholder="ex: CAIXA ou ADMIN"
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Usuário autorizado para registrar vendas</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Código do PDV (PDVCodigo) *
                </label>
                <input
                  type="number"
                  value={formData.pdvCodigo}
                  onChange={(e) => setFormData({ ...formData, pdvCodigo: parseInt(e.target.value, 10) || 2 })}
                  placeholder="ex: 2 ou 5"
                  required
                  min={1}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Código do PDV cadastrado no ERP</span>
              </div>
            </div>

            {/* Ambiente e URLs */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-6">
                <span className="text-xs font-bold text-slate-700">Ambiente do Servidor:</span>
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="serverEnvironment"
                    value="cloud"
                    checked={formData.serverEnvironment === 'cloud'}
                    onChange={() => setFormData({ ...formData, serverEnvironment: 'cloud' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Cloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>Nuvem (BlueFocus Cloud)</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="serverEnvironment"
                    value="local"
                    checked={formData.serverEnvironment === 'local'}
                    onChange={() => setFormData({ ...formData, serverEnvironment: 'local' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <Server className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Servidor Local (Intranet / DDNS)</span>
                </label>
              </div>

              {formData.serverEnvironment === 'local' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    URL do Servidor Local / DDNS
                  </label>
                  <input
                    type="url"
                    value={formData.localServerUrl}
                    onChange={(e) => setFormData({ ...formData, localServerUrl: e.target.value })}
                    placeholder="http://meupdv.ddns.net:8082"
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Endpoints WSDL */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. WSDL - Exporta Produtos (ExportaCadSAT)
                  </label>
                  <input
                    type="url"
                    value={formData.importProductsUrl}
                    onChange={(e) => setFormData({ ...formData, importProductsUrl: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    2. WSDL - Consulta Quantidade (ConsultaQtde)
                  </label>
                  <input
                    type="url"
                    value={formData.queryStockUrl}
                    onChange={(e) => setFormData({ ...formData, queryStockUrl: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    3. WSDL - Pré-Venda SAT (RegPreVendaSAT)
                  </label>
                  <input
                    type="url"
                    value={formData.exportSalesUrl}
                    onChange={(e) => setFormData({ ...formData, exportSalesUrl: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Regras de Automação */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tipo de Atualização Padrão para Produtos
                </label>
                <select
                  value={formData.defaultUpdateType}
                  onChange={(e) => setFormData({ ...formData, defaultUpdateType: e.target.value as 'C' | 'A' })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="C">C - Carga Completa (Toda a base cadastrada)</option>
                  <option value="A">A - Apenas Últimas Atualizações (Alterações recentes)</option>
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Parâmetro <code className="text-blue-700 font-bold">TipoAtualizacao</code> exigido no manual BlueFocus.
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Exportação Automática de Pedidos</span>
                  <span className="text-[11px] text-slate-500">
                    Ao confirmar ou aprovar um pedido, exporta de imediato para o BlueFocus como Pré-Venda.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoExportOrders}
                  onChange={(e) => setFormData({ ...formData, autoExportOrders: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                />
              </div>

              {/* Sincronização Automática a cada 2 Horas */}
              <div className="md:col-span-2 p-4 bg-blue-50/70 rounded-2xl border border-blue-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">
                          Sincronização Automática a cada 2 Horas
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            formData.autoSyncEvery2Hours
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {formData.autoSyncEvery2Hours ? 'Ativa (2h)' : 'Desativada'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Atualiza automaticamente produtos e saldos do ERP BlueFocus e descarrega pedidos a cada 2 horas em segundo plano.
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 mt-2 font-medium">
                        <span>
                          Última sincronização:{' '}
                          <strong className="text-slate-800">
                            {formData.lastSyncAt
                              ? new Date(formData.lastSyncAt).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Pendente'}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Próxima sincronização automática:{' '}
                          <strong className="text-blue-700 font-bold">
                            {formData.nextSyncAt
                              ? new Date(formData.nextSyncAt).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Em ~2 horas'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={handleTriggerAutoSyncNow}
                      disabled={isAutoSyncing}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                      title="Dispara agora o ciclo de 2 horas e recalcula o próximo agendamento"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAutoSyncing ? 'animate-spin' : ''}`} />
                      <span>{isAutoSyncing ? 'Sincronizando...' : 'Executar Ciclo 2h Agora'}</span>
                    </button>

                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-300">
                      <input
                        type="checkbox"
                        checked={!!formData.autoSyncEvery2Hours}
                        onChange={(e) => setFormData({ ...formData, autoSyncEvery2Hours: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-800">Auto 2h</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 flex items-center justify-between rounded-b-2xl">
            <span className="text-xs text-slate-500">
              Última sincronização:{' '}
              {formData.lastSyncAt ? new Date(formData.lastSyncAt).toLocaleString('pt-BR') : 'Ainda não sincronizado'}
            </span>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Salvando...' : 'Salvar Configurações BlueFocus'}</span>
            </button>
          </div>

          {/* Guia Rápido de Onde Clicar para Sincronizar */}
          <div className="p-6 bg-gradient-to-r from-blue-50/70 to-slate-50 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Onde clicar para sincronizar após salvar?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-blue-200/60 shadow-xs">
                <div className="flex items-center gap-2 text-emerald-700 font-black text-xs mb-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px]">1</span>
                  <span>Sincronizar Tudo (Recomendado)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Clique no botão verde <strong className="text-emerald-700">"Sincronizar Tudo Agora"</strong> no topo do cabeçalho. Ele importa produtos, atualiza saldo de estoque e exporta pedidos pendentes num só clique.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-blue-200/60 shadow-xs">
                <div className="flex items-center gap-2 text-blue-800 font-black text-xs mb-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">2</span>
                  <span>Exportar Pedidos para o PDV</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Acesse a sub-aba <strong className="text-blue-700">"Exportação de Pedidos"</strong> logo acima e clique em <strong>"Exportar Pendentes"</strong>, ou na tela principal de <strong>"Pedidos"</strong> clique em <strong>"Sincronizar ERP"</strong> no pedido desejado.
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-blue-200/60 shadow-xs">
                <div className="flex items-center gap-2 text-blue-800 font-black text-xs mb-1">
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px]">3</span>
                  <span>Atualizar Saldo de Estoque</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Acesse a sub-aba <strong className="text-blue-700">"Consulta de Estoque"</strong> e clique em <strong>"Atualizar Estoque Agora"</strong> para consultar a quantidade e lotes em tempo real do ERP.
                </p>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: EXPORTAÇÃO DE PEDIDOS (PRÉ-VENDAS) */}
      {activeSubTab === 'operations' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Sincronização de Pré-Vendas (RegPreVendaSAT)</h3>
                <p className="text-xs text-slate-500">
                  Exporta pedidos realizados pelos franqueados como pré-vendas no PDV BlueFocus para conferência e emissão fiscal.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportAllPending}
                  disabled={pendingOrders.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <ArrowUpFromLine className="w-4 h-4" />
                  <span>Exportar Pendentes ({pendingOrders.length})</span>
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-y border-slate-200">
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
                <tbody className="divide-y divide-slate-100">
                  {isLoadingOrders ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Carregando pedidos do sistema...
                      </td>
                    </tr>
                  ) : (orders || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Nenhum pedido cadastrado no momento.
                      </td>
                    </tr>
                  ) : (
                    (orders || []).map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">#{order.orderNumber}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block">{order.franchiseeName}</span>
                          <span className="text-[10px] text-slate-500">{order.franchiseeDocument}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(order.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          R$ {Number(order.total || 0).toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {order.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {order.blueFocusSynced ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Sincronizado</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pendente</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleExportOrder(order.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>{order.blueFocusSynced ? 'Reexportar' : 'Exportar SAT'}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Products Action Box */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Importação de Produtos (ExportaCadSAT)</h3>
                <p className="text-xs text-slate-500">
                  Carrega o catálogo oficial cadastrado no ERP da BlueFocus para o cardápio do BALBEC.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={importType}
                  onChange={(e) => setImportType(e.target.value as 'C' | 'A')}
                  className="text-xs font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white"
                >
                  <option value="C">Carga Completa (C)</option>
                  <option value="A">Apenas Atualizações (A)</option>
                </select>

                <button
                  type="button"
                  onClick={handleImportProducts}
                  disabled={isImporting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <ArrowDownToLine className={`w-4 h-4 ${isImporting ? 'animate-bounce' : ''}`} />
                  <span>{isImporting ? 'Importando...' : 'Importar Catálogo BlueFocus'}</span>
                </button>
              </div>
            </div>

            {importResult && (
              <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{importResult.message}</span>
                  <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded font-mono">
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
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Consulta de Quantidade / Estoque no PDV</h3>
              <p className="text-xs text-slate-500">
                WebService <code className="text-blue-700 font-bold">IntegracaoFcxConsultaQtde</code> - Saldos atuais dos produtos no ERP.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  placeholder="Filtrar por nome ou código..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleQueryStock}
                disabled={isQueryingStock}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isQueryingStock ? 'animate-spin' : ''}`} />
                <span>{isQueryingStock ? 'Consultando...' : 'Atualizar Estoque Agora'}</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Produto ID</th>
                  <th className="py-3 px-4">Código de Barras</th>
                  <th className="py-3 px-4">Descrição do Produto</th>
                  <th className="py-3 px-4">Lote PDV</th>
                  <th className="py-3 px-4 text-right">Quantidade em Estoque</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nenhum item retornado. Clique em "Atualizar Estoque Agora".
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.produtoId}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{item.codigoBarras}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{item.descricao || 'Produto BALBEC'}</td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          {item.lote}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {Number(item.quantidade || 0).toLocaleString('pt-BR')} un
                      </td>
                      <td className="py-3 px-4 text-center">
                        {Number(item.quantidade || 0) > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Disponível
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
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
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Envelopes SOAP Gerados (Valim Schema)</h3>
                <p className="text-xs text-slate-500">
                  Pré-visualize e teste os XMLs gerados em conformidade estrita com o manual da BlueFocus.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyXml}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedXml ? 'Copiado!' : 'Copiar XML'}</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleFetchXmlPreview('order')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                  xmlType === 'order' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                RegPreVendaSAT (Vendas)
              </button>
              <button
                type="button"
                onClick={() => handleFetchXmlPreview('import')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                  xmlType === 'import' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                ExportaCadSAT (Produtos)
              </button>
              <button
                type="button"
                onClick={() => handleFetchXmlPreview('stock')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${
                  xmlType === 'stock' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
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
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">URLs de Fotos da Mercadoria (Pág. 10)</h3>
            <p className="text-xs text-slate-500">
              O BlueFocus hospeda fotos com as extensões <code className="text-blue-600">.jpg</code>, <code className="text-blue-600">-A.jpg</code> até <code className="text-blue-600">-D.jpg</code>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Selecione o Produto:</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleFetchImageUrls(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
              >
                {(products || []).length === 0 ? (
                  <option value="">Carregando produtos...</option>
                ) : (
                  (products || []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.internalCode})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleFetchImageUrls(selectedProductId)}
                className="w-full py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition cursor-pointer"
              >
                Gerar Links Oficiais de Imagem
              </button>

              {imageUrls && (
                <div className="space-y-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 overflow-x-auto">
                  <div className="truncate">
                    <span className="text-slate-500">Principal: </span>
                    <a href={imageUrls.main} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      {imageUrls.main}
                    </a>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500">Variação A: </span>
                    <a href={imageUrls.variantA} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      {imageUrls.variantA}
                    </a>
                  </div>
                  <div className="truncate">
                    <span className="text-slate-500">Variação B: </span>
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
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Histórico de Transações SOAP BlueFocus</h3>
              <p className="text-xs text-slate-500">
                Auditoria de envelopes enviados, requisições de estoque, importações e retornos de pré-vendas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
              <button
                type="button"
                onClick={handleClearLogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Logs</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">Data/Hora</th>
                  <th className="py-3 px-4">Operação</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Endpoint / Ação</th>
                  <th className="py-3 px-4">Resumo da Resposta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(logs || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Nenhum log de integração registrado ainda.
                    </td>
                  </tr>
                ) : (
                  (logs || []).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Sucesso
                          </span>
                        ) : log.status === 'warning' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Aviso
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            Falha
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-xs text-slate-800">{log.payloadSummary}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{log.endpoint}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
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
