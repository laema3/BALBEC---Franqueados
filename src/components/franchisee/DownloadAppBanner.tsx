import React from 'react';
import { Smartphone, Download, Sparkles, CheckCircle2 } from 'lucide-react';

export const DownloadAppBanner: React.FC = () => {
  const [installed, setInstalled] = React.useState(false);

  const handleInstallClick = () => {
    // Simulate PWA install prompt or app download guidance
    alert('Para instalar o Aplicativo BALBEC no seu dispositivo:\n\n• No Android/Chrome: Toque no menu do navegador (3 pontinhos) e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".\n• No iPhone/Safari: Toque no botão Compartilhar e selecione "Adicionar à Tela de Início".');
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 p-4 sm:p-5 rounded-2xl shadow-md border border-amber-600/30 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4 text-center sm:text-left">
        <div className="w-12 h-12 bg-slate-950 text-amber-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg mx-auto sm:mx-0">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="bg-slate-950 text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
              Aplicativo Oficial
            </span>
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Acesso Rápido para Franqueados
            </span>
          </div>
          <p className="text-xs font-medium text-slate-900 mt-1">
            Baixe o aplicativo BALBEC ou instale em seu celular/tablet para realizar pedidos com maior agilidade e notificações push instantâneas.
          </p>
        </div>
      </div>

      <button
        onClick={handleInstallClick}
        className="px-5 py-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs uppercase tracking-wider shadow-md hover:shadow-xl transition flex items-center gap-2 shrink-0 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        <span>Baixar / Instalar App</span>
      </button>
    </div>
  );
};
