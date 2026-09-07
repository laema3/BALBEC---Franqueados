import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, ShieldAlert, CheckCircle2, Building, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { maskCpfCnpj } from '../../utils/formatters.js';

export const LoginModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, setQuickDemoUser } = useAuth();
  const [docInput, setDocInput] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw.toLowerCase() === 'admin') {
      setDocInput('admin');
      return;
    }
    const masked = maskCpfCnpj(raw);
    setDocInput(masked);
    setErrorMsg(null);
  };

  const clean = docInput.replace(/\D/g, '');
  const isCnpj = clean.length > 11;
  const isCpf = clean.length > 0 && clean.length <= 11;
  const detectedDocLabel = docInput.toLowerCase() === 'admin'
    ? 'Acesso Administrativo'
    : isCnpj
    ? 'CNPJ identificado'
    : isCpf
    ? 'CPF identificado'
    : 'CPF ou CNPJ';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docInput.trim()) {
      setErrorMsg('Por favor, digite seu CPF ou CNPJ.');
      return;
    }
    if (!password) {
      setErrorMsg('Por favor, informe a senha.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setErrorType(null);

    const result = await login(docInput, password);
    setLoading(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Credenciais inválidas.');
      setErrorType(result.status || 'invalid');
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryInput) return;
    try {
      const res = await fetch('/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentOrEmail: recoveryInput }),
      });
      const data = await res.json();
      setRecoverySuccess(data.message || 'Instruções enviadas com sucesso!');
    } catch {
      setRecoverySuccess('Solicitação recebida. Nossa equipe entrará em contato.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Warm Yellow Brand accent */}
        <div className="bg-amber-500 p-6 text-slate-950 relative">
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full text-slate-900 hover:bg-amber-600/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center border-2 border-amber-300 shadow">
              <span className="text-xl font-black text-amber-400">B</span>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">BALBEC FRANQUIAS</h2>
              <p className="text-xs font-semibold text-slate-800">
                Acesse sua conta para realizar pedidos online
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {!showRecovery ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
                    errorType === 'blocked'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : errorType === 'inactive'
                      ? 'bg-orange-50 text-orange-800 border border-orange-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <div className="font-bold">
                      {errorType === 'blocked'
                        ? 'Acesso Bloqueado'
                        : errorType === 'inactive'
                        ? 'Conta Inativa'
                        : 'Atenção'}
                    </div>
                    <div>{errorMsg}</div>
                  </div>
                </div>
              )}

              {/* Document Field with Auto Detection Badge */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">CPF ou CNPJ</label>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isCnpj
                        ? 'bg-blue-100 text-blue-800'
                        : isCpf
                        ? 'bg-emerald-100 text-emerald-800'
                        : docInput.toLowerCase() === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {detectedDocLabel}
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="input-document"
                    type="text"
                    value={docInput}
                    onChange={handleDocumentChange}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
                    required
                  />
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  O sistema identifica automaticamente o tipo do documento.
                </p>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Senha de Acesso</label>
                  <button
                    type="button"
                    onClick={() => setShowRecovery(true)}
                    className="text-[11px] font-semibold text-amber-700 hover:text-amber-900"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="input-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 px-4 rounded-xl transition shadow-md active:scale-98 text-sm uppercase tracking-wide flex items-center justify-center gap-2"
              >
                {loading ? 'Validando credenciais...' : 'Acessar Sistema'}
              </button>
            </form>
          ) : (
            /* Password Recovery Flow */
            <form onSubmit={handleRecoverySubmit} className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Recuperar Senha</h3>
                <p className="text-xs text-slate-600">
                  Informe o CPF/CNPJ ou e-mail cadastrado na sua franquia.
                </p>
              </div>

              {recoverySuccess ? (
                <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-200">
                  {recoverySuccess}
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Documento ou E-mail</label>
                    <input
                      type="text"
                      value={recoveryInput}
                      onChange={(e) => setRecoveryInput(e.target.value)}
                      placeholder="Ex: 12.345.678/0001-90 ou contato@empresa.com"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl text-xs uppercase"
                  >
                    Enviar Instruções de Recuperação
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowRecovery(false);
                  setRecoverySuccess(null);
                }}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 py-1"
              >
                ← Voltar para o Login
              </button>
            </form>
          )}

          {/* Quick 1-click Test Personas for Reviewer convenience */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Simulação & Credenciais de Acesso</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setDocInput('12.345.678/0001-90');
                  setPassword('123456');
                  setErrorMsg(null);
                }}
                className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200 text-left transition cursor-pointer"
              >
                <div className="font-bold text-slate-900">Simular Compra (CNPJ)</div>
                <div className="text-[10px] text-slate-500 font-mono">12.345.678/0001-90</div>
                <div className="text-[10px] text-emerald-700 font-semibold">Meta: R$ 500,00</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDocInput('admin');
                  setPassword('admin123');
                  setErrorMsg(null);
                }}
                className="p-2.5 rounded-xl bg-slate-900 text-amber-400 hover:bg-slate-800 text-left transition cursor-pointer"
              >
                <div className="font-bold">Admin (Preencher)</div>
                <div className="text-[10px] text-slate-300 font-mono">user: admin • pass: admin123</div>
                <div className="text-[10px] text-amber-300 font-semibold">Gestão Geral</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
