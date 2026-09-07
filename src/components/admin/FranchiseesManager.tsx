import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building,
  DollarSign,
  X,
  Power,
  KeyRound,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { Franchisee, FranchiseeStatus } from '../../types.js';
import { formatCurrency, maskCpfCnpj } from '../../utils/formatters.js';

export const FranchiseesManager: React.FC = () => {
  const [franchisees, setFranchisees] = useState<Franchisee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFranchisee, setEditingFranchisee] = useState<Partial<Franchisee> | null>(null);
  const [franchiseePassword, setFranchiseePassword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Franchisee | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchFranchisees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/franchisees');
      if (res.ok) {
        const data = await res.json();
        setFranchisees(data);
      }
    } catch (err) {
      console.error('Error fetching franchisees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFranchisees();
  }, []);

  const handleOpenCreate = () => {
    setEditingFranchisee({
      companyName: '',
      tradeName: '',
      document: '',
      phone: '',
      whatsapp: '',
      email: '',
      minimumOrderValue: 500,
      status: 'active',
      address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '',
      },
    });
    setFranchiseePassword('123456'); // Default easy password
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: Franchisee) => {
    setEditingFranchisee({ ...f });
    setFranchiseePassword(''); // Empty means keep existing password
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFranchisee) return;

    if (!editingFranchisee.tradeName || !editingFranchisee.document) {
      showToast('Preencha ao menos o Nome Fantasia e o CPF/CNPJ.');
      return;
    }

    setActionLoading(true);
    try {
      const isNew = !editingFranchisee.id;
      const url = isNew ? '/api/franchisees' : `/api/franchisees/${editingFranchisee.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        ...editingFranchisee,
        ...(franchiseePassword ? { password: franchiseePassword } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingFranchisee(null);
        await fetchFranchisees();
        showToast(isNew ? 'Franqueado cadastrado com sucesso!' : 'Cadastro do franqueado atualizado com sucesso!');
      } else {
        const errorData = await res.json();
        showToast(`Erro: ${errorData.error || 'Não foi possível salvar.'}`);
      }
    } catch (err) {
      console.error('Error saving franchisee:', err);
      showToast('Erro de conexão ao salvar franqueado.');
    } finally {
      setActionLoading(false);
    }
  };

  // Immediate toggle between Active and Inactive
  const handleToggleStatus = async (id: string, newStatus: FranchiseeStatus, name: string) => {
    try {
      const res = await fetch(`/api/franchisees/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setFranchisees((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
        );
        const statusLabel = newStatus === 'active' ? 'ATIVADO' : newStatus === 'inactive' ? 'DESATIVADO' : 'BLOQUEADO';
        showToast(`Franqueado "${name}" foi ${statusLabel} com sucesso!`);
      } else {
        showToast('Falha ao alterar o status do franqueado.');
      }
    } catch (err) {
      console.error('Error changing status:', err);
      showToast('Erro ao atualizar status.');
    }
  };

  // Delete with confirmation
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/franchisees/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast(`Franqueado "${deleteTarget.tradeName}" foi excluído com sucesso!`);
        setDeleteTarget(null);
        await fetchFranchisees();
      } else {
        showToast('Não foi possível excluir o franqueado.');
      }
    } catch (err) {
      console.error('Error deleting franchisee:', err);
      showToast('Erro de conexão ao excluir franqueado.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = franchisees.filter((f) => {
    const matchesSearch =
      f.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.document.replace(/\D/g, '').includes(searchQuery.replace(/\D/g, ''));
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="p-3 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-md animate-in slide-in-from-top duration-200">
          ✓ {toastMessage}
        </div>
      )}

      {/* Header with Title and "Cadastrar Franqueado" button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900">Franqueados e Clientes</h2>
          <p className="text-xs text-slate-500">
            Cadastre parceiros, altere status (Ativo/Inativo), defina metas de compra e gerencie permissões.
          </p>
        </div>

        <button
          id="btn-add-franchisee"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Franqueado</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome fantasia, razão social ou CPF/CNPJ..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({franchisees.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'active' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Ativos ({franchisees.filter((f) => f.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg transition ${
              statusFilter === 'inactive' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600 hover:text-orange-700'
            }`}
          >
            Inativos ({franchisees.filter((f) => f.status === 'inactive').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-black border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Franqueado / Loja</th>
                <th className="px-4 py-3">CPF / CNPJ</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Localização</th>
                <th className="px-4 py-3">Meta Compra</th>
                <th className="px-4 py-3 text-center">Status (Clique p/ Alternar)</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold">Nenhum franqueado encontrado.</p>
                    <button
                      onClick={handleOpenCreate}
                      className="mt-3 text-red-600 hover:text-red-700 font-black text-xs uppercase underline"
                    >
                      Cadastrar primeiro franqueado agora
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((f) => {
                  const isActive = f.status === 'active';
                  const isBlocked = f.status === 'blocked';

                  return (
                    <tr key={f.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-sm">{f.tradeName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{f.companyName}</div>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">
                        {maskCpfCnpj(f.document)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{f.whatsapp || f.phone}</div>
                        <div className="text-[11px] text-slate-400">{f.email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>
                          {f.address?.city}/{f.address?.state}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {f.address?.neighborhood}, {f.address?.number}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-black text-amber-700">
                        {formatCurrency(f.minimumOrderValue)}
                      </td>

                      {/* Interactive Status Toggle Button (Ativo / Inativo) */}
                      <td className="px-4 py-3 text-center">
                        {isBlocked ? (
                          <button
                            onClick={() => handleToggleStatus(f.id, 'active', f.tradeName)}
                            title="Bloqueado por administração. Clique para desbloquear e reativar."
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 hover:bg-red-200 transition"
                          >
                            <Lock className="w-3.5 h-3.5 text-red-600" />
                            <span>Bloqueado (Clique p/ Ativar)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              handleToggleStatus(f.id, isActive ? 'inactive' : 'active', f.tradeName)
                            }
                            title={
                              isActive
                                ? 'Franqueado Ativo. Clique para desativar.'
                                : 'Franqueado Inativo. Clique para ativar.'
                            }
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer shadow-xs border ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100'
                            }`}
                          >
                            <Power className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-orange-500'}`} />
                            <span>{isActive ? 'Ativo' : 'Inativo'}</span>
                          </button>
                        )}
                      </td>

                      {/* Explicit Action Buttons: Editar, Ativar/Desativar, Excluir */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            id={`btn-edit-franchisee-${f.id}`}
                            onClick={() => handleOpenEdit(f)}
                            className="flex items-center gap-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 font-bold px-2.5 py-1.5 rounded-xl transition text-xs border border-slate-200"
                            title="Editar dados e meta do franqueado"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                            <span>Editar</span>
                          </button>

                          {/* Quick Toggle Status Button */}
                          <button
                            onClick={() =>
                              handleToggleStatus(f.id, isActive ? 'inactive' : 'active', f.tradeName)
                            }
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                              isActive
                                ? 'bg-slate-50 hover:bg-orange-50 text-orange-700 border-orange-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                            title={isActive ? 'Desativar este franqueado' : 'Ativar este franqueado'}
                          >
                            {isActive ? 'Desativar' : 'Ativar'}
                          </button>

                          {/* Delete Button with Confirmation */}
                          <button
                            id={`btn-delete-franchisee-${f.id}`}
                            onClick={() => setDeleteTarget(f)}
                            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 font-bold px-2.5 py-1.5 rounded-xl transition text-xs border border-red-200"
                            title="Excluir cadastro do franqueado com confirmação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cadastrar / Editar Modal Form */}
      {isModalOpen && editingFranchisee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="bg-amber-500 p-4 text-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">
                  {editingFranchisee.id ? 'Editar Cadastro de Franqueado' : 'Cadastrar Novo Franqueado'}
                </h3>
                <span className="text-xs text-slate-800">
                  {editingFranchisee.id ? editingFranchisee.tradeName : 'Preencha os dados da unidade ou parceiro'}
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-950 hover:bg-amber-600/50 p-1.5 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nome Fantasia */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nome Fantasia da Loja *</label>
                  <input
                    type="text"
                    required
                    value={editingFranchisee.tradeName || ''}
                    onChange={(e) =>
                      setEditingFranchisee({ ...editingFranchisee, tradeName: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-bold"
                    placeholder="Ex: BALBEC - Shopping Norte"
                  />
                </div>

                {/* Razão Social */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={editingFranchisee.companyName || ''}
                    onChange={(e) =>
                      setEditingFranchisee({ ...editingFranchisee, companyName: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    placeholder="Ex: Alimentos & Salgados Ltda"
                  />
                </div>

                {/* CPF ou CNPJ */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CPF ou CNPJ *</label>
                  <input
                    type="text"
                    required
                    value={editingFranchisee.document || ''}
                    onChange={(e) =>
                      setEditingFranchisee({
                        ...editingFranchisee,
                        document: maskCpfCnpj(e.target.value),
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-mono font-medium"
                    placeholder="00.000.000/0000-00 ou 000.000.000-00"
                  />
                </div>

                {/* Senha de Acesso */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    {editingFranchisee.id ? 'Nova Senha (Opcional)' : 'Senha de Acesso *'}
                  </label>
                  <input
                    type="text"
                    value={franchiseePassword}
                    onChange={(e) => setFranchiseePassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-mono"
                    placeholder={editingFranchisee.id ? 'Deixe em branco para manter a atual' : 'Padrão: 123456'}
                  />
                  <span className="text-[10px] text-slate-500">
                    Utilizada pelo franqueado para fazer login no sistema.
                  </span>
                </div>

                {/* Meta de Compra Mínima */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Meta de Compra Mínima (R$) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={editingFranchisee.minimumOrderValue ?? 500}
                    onChange={(e) =>
                      setEditingFranchisee({
                        ...editingFranchisee,
                        minimumOrderValue: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-amber-400 bg-amber-50/50 font-black text-amber-900 focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-500">
                    O carrinho deste franqueado exigirá no mínimo este valor por pedido.
                  </span>
                </div>

                {/* Status: Ativo ou Inativo */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status do Franqueado *</label>
                  <select
                    value={editingFranchisee.status || 'active'}
                    onChange={(e) =>
                      setEditingFranchisee({
                        ...editingFranchisee,
                        status: e.target.value as FranchiseeStatus,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    <option value="active">● Ativo (Permite Login e Pedidos)</option>
                    <option value="inactive">○ Inativo (Acesso Desativado)</option>
                    <option value="blocked">🔒 Bloqueado (Bloqueio Administrativo)</option>
                  </select>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp para Pedidos *</label>
                  <input
                    type="text"
                    required
                    value={editingFranchisee.whatsapp || ''}
                    onChange={(e) =>
                      setEditingFranchisee({ ...editingFranchisee, whatsapp: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail</label>
                  <input
                    type="email"
                    value={editingFranchisee.email || ''}
                    onChange={(e) =>
                      setEditingFranchisee({ ...editingFranchisee, email: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    placeholder="contato@franqueado.com"
                  />
                </div>

                {/* Endereço */}
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Endereço da Loja</label>
                  <input
                    type="text"
                    value={editingFranchisee.address?.street || ''}
                    onChange={(e) =>
                      setEditingFranchisee({
                        ...editingFranchisee,
                        address: { ...(editingFranchisee.address as any), street: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 mb-2"
                    placeholder="Rua / Avenida"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editingFranchisee.address?.number || ''}
                      onChange={(e) =>
                        setEditingFranchisee({
                          ...editingFranchisee,
                          address: { ...(editingFranchisee.address as any), number: e.target.value },
                        })
                      }
                      className="p-2.5 rounded-xl border border-slate-300"
                      placeholder="Número"
                    />
                    <input
                      type="text"
                      value={editingFranchisee.address?.neighborhood || ''}
                      onChange={(e) =>
                        setEditingFranchisee({
                          ...editingFranchisee,
                          address: { ...(editingFranchisee.address as any), neighborhood: e.target.value },
                        })
                      }
                      className="p-2.5 rounded-xl border border-slate-300"
                      placeholder="Bairro"
                    />
                    <input
                      type="text"
                      value={editingFranchisee.address?.city || ''}
                      onChange={(e) =>
                        setEditingFranchisee({
                          ...editingFranchisee,
                          address: { ...(editingFranchisee.address as any), city: e.target.value },
                        })
                      }
                      className="p-2.5 rounded-xl border border-slate-300"
                      placeholder="Cidade"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs uppercase shadow transition"
                >
                  {actionLoading ? 'Salvando...' : 'Salvar Franqueado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-black text-slate-900 text-lg">Confirmar Exclusão de Franqueado</h4>
              <p className="text-xs text-slate-600 mt-2">
                Deseja realmente excluir o cadastro do parceiro abaixo?
              </p>
              <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200 text-left">
                <div className="font-bold text-slate-900 text-sm">{deleteTarget.tradeName}</div>
                <div className="text-[11px] text-slate-600">{deleteTarget.companyName}</div>
                <div className="text-[11px] font-mono font-semibold text-slate-700 mt-1">
                  Documento: {maskCpfCnpj(deleteTarget.document)}
                </div>
              </div>
              <p className="text-[11px] text-red-600 font-bold mt-2">
                Atenção: O acesso do franqueado ao sistema será cancelado.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white shadow-md transition"
              >
                {actionLoading ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
