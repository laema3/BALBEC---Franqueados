import React from 'react';
import { Shield, X, Lock, Cookie, FileText } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b-4 border-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-black">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">Política de Privacidade e Cookies</h2>
              <p className="text-xs text-slate-400">BALBEC Salgados & Cia — Portal de Franquias</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
            <Lock className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-bold block text-sm mb-1">Compromisso com a Segurança da Informação</span>
              A BALBEC preza pela total transparência e proteção dos dados corporativos e pessoais de seus franqueados, parceiros e clientes.
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              1. Coleta e Uso de Dados
            </h3>
            <p>
              Coletamos dados cadastrais essenciais para a operação da rede franqueada (como CNPJ/CPF, razão social, endereço de entrega, telefone e e-mail de contato), além do histórico de pedidos realizados. Estas informações são utilizadas estritamente para o processamento de pedidos, faturamento, controle de metas da franquia e logística de distribuição dos produtos BALBEC.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Cookie className="w-4 h-4 text-amber-600" />
              2. Política de Cookies
            </h3>
            <p>
              Utilizamos cookies estritamente necessários e de sessão para garantir a correta autenticação no Portal do Franqueado, lembrar preferências de navegação e assegurar a estabilidade do carrinho de compras e painéis operacionais. Não utilizamos cookies para rastreamento publicitário de terceiros.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-black text-sm text-slate-900 font-bold text-slate-900">3. LGPD e Compartilhamento</h3>
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018), seus dados não são comercializados ou cedidos a terceiros, exceto quando exigido por obrigação legal ou fiscal para emissão de notas fiscais e processamento de pagamentos oficiais.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-black text-sm text-slate-900 font-bold text-slate-900">4. Contato do Encarregado (DPO)</h3>
            <p>
              Caso tenha dúvidas sobre esta política ou deseje solicitar a atualização de dados cadastrais da sua franquia, entre em contato através do e-mail <strong>privacidade@balbec.com.br</strong> ou pelo suporte oficial de atendimento da rede.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Entendido e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
