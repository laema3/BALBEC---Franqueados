import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Trash2, Edit2, Key, Check, X, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operator' | 'manager';
  active: boolean;
  createdAt: string;
}

export const UsersManager: React.FC = () => {
  const { showToast } = useApp();
  const [users, setUsers] = useState<SystemUser[]>([
    { id: 'usr-1', name: 'Administrador Geral Master', email: 'admin@balbec.com.br', role: 'admin', active: true, createdAt: '2026-01-10' },
    { id: 'usr-2', name: 'Gerente Operacional', email: 'gerencia@balbec.com.br', role: 'manager', active: true, createdAt: '2026-02-15' },
    { id: 'usr-3', name: 'Operador de Caixa / Totem', email: 'caixa@balbec.com.br', role: 'operator', active: true, createdAt: '2026-03-01' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'operator' | 'manager'>('operator');
  const [password, setPassword] = useState('');

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('operator');
    setPassword('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: SystemUser) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setPassword('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Por favor, preencha o nome e o e-mail do usuário.');
      return;
    }

    if (editingUser) {
      // Update
      setUsers(
        users.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: name.trim(), email: email.trim(), role }
            : u
        )
      );
      showToast('Usuário atualizado com sucesso!');
    } else {
      // Create new (no email validation required per instructions)
      const newUser: SystemUser = {
        id: `usr-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        role,
        active: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUsers([newUser, ...users]);
      showToast('Novo usuário cadastrado com sucesso!');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (id === 'usr-1') {
      showToast('O administrador principal master não pode ser excluído.');
      return;
    }
    if (confirm('Tem certeza que deseja remover este usuário do sistema?')) {
      setUsers(users.filter((u) => u.id !== id));
      showToast('Usuário removido com sucesso.');
    }
  };

  const toggleActive = (id: string) => {
    setUsers(
      users.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    );
    showToast('Status do usuário alterado.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Gestão de Usuários Master / Operadores</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre e gerencie os acessos administrativos da franqueadora BALBEC sem necessidade de validação externa de e-mail.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase text-[11px]">
                <th className="p-4">Nome do Usuário</th>
                <th className="p-4">E-mail de Acesso</th>
                <th className="p-4">Nível de Permissão</th>
                <th className="p-4">Status</th>
                <th className="p-4">Data Cadastro</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-black flex items-center justify-center text-xs shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <span>{u.name}</span>
                  </td>
                  <td className="p-4 font-mono text-slate-600">{u.email}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'manager'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      <Shield className="w-3 h-3" />
                      {u.role === 'admin' ? 'Master Admin' : u.role === 'manager' ? 'Gerente' : 'Operador'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleActive(u.id)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                        u.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {u.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="p-4 text-slate-500 font-mono text-[11px]">{u.createdAt}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== 'usr-1' && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b-4 border-amber-500">
              <h3 className="font-black text-sm">
                {editingUser ? 'Editar Usuário do Sistema' : 'Novo Usuário do Sistema'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João Gestor"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail de Acesso (Sem Validação Externa) *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@balbec.com.br"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nível de Permissão</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                >
                  <option value="admin">Master Admin (Acesso Completo)</option>
                  <option value="manager">Gerente (Gestão de Pedidos e Catálogo)</option>
                  <option value="operator">Operador / Caixa / Totem</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Senha de Acesso</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? 'Deixe em branco para manter' : 'Senha inicial'}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black uppercase tracking-wider shadow"
                >
                  {editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
