import React, { useState, useEffect } from 'react';
import {
  Building2,
  Palette,
  Bell,
  Cpu,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { CompanySettings } from '../../types.js';

export const SettingsManager: React.FC = () => {
  const { settings, refreshSettings, showToast } = useApp();
  const [formData, setFormData] = useState<CompanySettings>(() => {
    return settings || ({} as CompanySettings);
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);
  const [saving, setSaving] = useState(false);
  const [testNotificationStatus, setTestNotificationStatus] = useState<string | null>(null);
  const [testBlueFocusStatus, setTestBlueFocusStatus] = useState<string | null>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setFormData({ ...formData, logoUrl: result });
        showToast('Logomarca carregada com sucesso! Lembre-se de salvar.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await refreshSettings();
        showToast('Configurações salvas com sucesso!');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestNtfy = async () => {
    setTestNotificationStatus('Enviando...');
    try {
      const res = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: formData.ntfy?.defaultTopic,
          title: 'BALBEC — Teste de Notificação',
          message: 'Sistema BALBEC conectado com sucesso ao ntfy!',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestNotificationStatus('✓ Notificação enviada com sucesso ao ntfy!');
      } else {
        setTestNotificationStatus(`Erro: ${data.error || 'Falha ao enviar'}`);
      }
    } catch (err) {
      setTestNotificationStatus('Erro de conexão com o servidor ntfy.');
    }
  };

  const handleTestBlueFocus = async () => {
    setTestBlueFocusStatus('Testando conexão...');
    try {
      const res = await fetch('/api/bluefocus/status');
      const data = await res.json();
      if (res.ok) {
        setTestBlueFocusStatus(`✓ Conexão validada: ${data.message || 'Pronto para sincronização'}`);
      } else {
        setTestBlueFocusStatus('Serviço local indisponível no momento.');
      }
    } catch {
      setTestBlueFocusStatus('Não foi possível conectar ao endpoint BlueFocus.');
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Configurações do Sistema</h2>
          <p className="text-xs text-slate-500">
            Identidade da empresa, parâmetros visuais, canais ntfy e preparação para ERP BlueFocus.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Salvando...' : 'Salvar Todas as Configurações'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Company Profile */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">Dados da Empresa BALBEC</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nome da Empresa</label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Telefone Fixo</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">E-mail para Pedidos</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Endereço da Central</label>
              <input
                type="text"
                value={formData.address?.street || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value } as any,
                  })
                }
                placeholder="Rua / Avenida"
                className="w-full p-2.5 rounded-xl border border-slate-300 mb-2"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={formData.address?.number || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, number: e.target.value } as any,
                    })
                  }
                  placeholder="Número"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
                <input
                  type="text"
                  value={formData.address?.neighborhood || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, neighborhood: e.target.value } as any,
                    })
                  }
                  placeholder="Bairro"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
                <input
                  type="text"
                  value={formData.address?.city || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value } as any,
                    })
                  }
                  placeholder="Cidade"
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Visual & Theme Colors */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Palette className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm">Identidade Visual (Amarelo & Vermelho)</h3>
          </div>

          <p className="text-xs text-slate-500">
            Em conformidade com a identidade visual BALBEC, a paleta prioriza o amarelo no banner e vermelho vibrante em botões de ação e compra.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cor Principal (Amarelo)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.visual?.primaryColor || '#F59E0B'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visual: { ...formData.visual, primaryColor: e.target.value } as any,
                    })
                  }
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                />
                <span className="font-mono font-bold text-slate-700">
                  {formData.visual?.primaryColor || '#F59E0B'}
                </span>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Cor dos Botões (Vermelho)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.visual?.buttonColor || '#DC2626'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      visual: { ...formData.visual, buttonColor: e.target.value } as any,
                    })
                  }
                  className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                />
                <span className="font-mono font-bold text-slate-700">
                  {formData.visual?.buttonColor || '#DC2626'}
                </span>
              </div>
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <label className="font-bold text-slate-700 block">Logomarca da Empresa</label>
            <div className="flex items-center gap-4">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Logo"
                  className="w-14 h-14 rounded-xl object-contain bg-slate-100 border border-slate-200 p-1 shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2 rounded-xl transition shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Enviar Nova Logomarca</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[10px] text-slate-400">PNG, JPG ou SVG recomendados.</p>
              </div>
            </div>
          </div>

          {/* Color preview block */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Amostra dos Componentes</span>
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs">
                Banner BALBEC
              </div>
              <div className="bg-red-600 text-white font-black px-3 py-1.5 rounded-lg text-xs uppercase shadow">
                Botão Adicionar / Comprar
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: ntfy Integration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-slate-900 text-sm">Notificações Push (ntfy)</h3>
            </div>
            <a
              href={`${formData.ntfy?.serverUrl || 'https://ntfy.sh'}/${formData.ntfy?.defaultTopic || 'balbec_pedidos_notificacoes'}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1"
            >
              <span>Abrir Canal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Servidor ntfy</label>
              <input
                type="text"
                value={formData.ntfy?.serverUrl || 'https://ntfy.sh'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ntfy: { ...formData.ntfy, serverUrl: e.target.value } as any,
                  })
                }
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Tópico Padrão de Notificação</label>
              <input
                type="text"
                value={formData.ntfy?.defaultTopic || 'balbec_pedidos_notificacoes'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ntfy: { ...formData.ntfy, defaultTopic: e.target.value } as any,
                  })
                }
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Franqueados e a cozinha podem assinar este canal pelo app do ntfy no Android, iOS ou navegador.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestNtfy}
                className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>Testar Envio de Notificação</span>
              </button>

              {testNotificationStatus && (
                <span className="text-xs font-bold text-emerald-700">
                  {testNotificationStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: BlueFocus ERP Preparation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Integração BlueFocus (Valim Software)</h3>
            </div>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              WebServices SOAP
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Conexão com o sistema de retaguarda BlueFocus para sincronização de produtos (ExportaCadSAT), consulta de estoque (ConsultaQtde) e registro de pré-vendas (RegPreVendaSAT).
          </p>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chave de Autenticação (autentica)</label>
                <input
                  type="text"
                  value={formData.blueFocus?.autentica || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      blueFocus: { ...formData.blueFocus, autentica: e.target.value } as any,
                    })
                  }
                  placeholder="ex: c89f2aab-5aa6-451d-8da8-06709422d3da"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Código da Empresa (EmpresaId)</label>
                <input
                  type="text"
                  value={formData.blueFocus?.empresaId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      blueFocus: { ...formData.blueFocus, empresaId: e.target.value } as any,
                    })
                  }
                  placeholder="ex: EMPRESATESTE ou BALBEC01"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Usuário no PDV (UsuarioId)</label>
                <input
                  type="text"
                  value={formData.blueFocus?.usuarioId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      blueFocus: { ...formData.blueFocus, usuarioId: e.target.value } as any,
                    })
                  }
                  placeholder="ex: CAIXA ou ADMIN"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Código do PDV (PDVCodigo)</label>
                <input
                  type="number"
                  value={formData.blueFocus?.pdvCodigo ?? 2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      blueFocus: { ...formData.blueFocus, pdvCodigo: parseInt(e.target.value, 10) || 2 } as any,
                    })
                  }
                  placeholder="2 ou 5"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestBlueFocus}
                className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Testar Conexão SOAP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const blueFocusTabBtn = document.getElementById('admin-tab-bluefocus');
                  if (blueFocusTabBtn) blueFocusTabBtn.click();
                }}
                className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-800"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Acessar Central Completa BlueFocus</span>
              </button>
            </div>

            {testBlueFocusStatus && (
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900">
                {testBlueFocusStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};
