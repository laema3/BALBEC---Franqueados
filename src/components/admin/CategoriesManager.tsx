import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Tag, X, Power, CheckCircle2 } from 'lucide-react';
import { Category } from '../../types.js';

export const CategoriesManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories?includeInactive=true');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleToggleStatus = async (cat: Category) => {
    const nextStatus = cat.status === 'active' ? 'inactive' : 'active';
    try {
      // Optimistic update
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, status: nextStatus } : c))
      );
      const res = await fetch(`/api/categories/${cat.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error('Error toggling category status:', err);
      fetchCategories();
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory({
      name: '',
      description: '',
      displayOrder: categories.length + 1,
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const isNew = !editingCategory.id;
      const url = isNew ? '/api/categories' : `/api/categories/${editingCategory.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingCategory(null);
        fetchCategories();
      }
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente remover esta categoria?')) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    if (statusFilter === 'active') return cat.status === 'active';
    if (statusFilter === 'inactive') return cat.status === 'inactive';
    return true;
  });

  const activeCount = categories.filter((c) => c.status === 'active').length;
  const inactiveCount = categories.filter((c) => c.status === 'inactive').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Categorias de Produtos</h2>
          <p className="text-xs text-slate-500">
            Organize os salgados em seções. Categorias inativas são ocultadas automaticamente do cardápio dos franqueados.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todas ({categories.length})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-emerald-600 text-white'
              : 'text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Ativas ({activeCount})</span>
        </button>
        <button
          onClick={() => setStatusFilter('inactive')}
          className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'inactive'
              ? 'bg-slate-700 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>Inativas ({inactiveCount})</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Carregando categorias...</div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
          <p className="text-sm font-bold text-slate-600">Nenhuma categoria encontrada neste filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-white rounded-2xl border transition shadow-xs flex flex-col justify-between p-4 ${
                cat.status === 'inactive' ? 'border-slate-200 opacity-80 bg-slate-50/50' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    Ordem {cat.displayOrder}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(cat)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 cursor-pointer transition ${
                      cat.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                    }`}
                    title="Clique para alternar status"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cat.status === 'active' ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                    <span>{cat.status === 'active' ? 'Ativa' : 'Inativa'}</span>
                  </button>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description || 'Sem descrição cadastrada.'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {/* Botão de Ativar / Inativar */}
                <button
                  onClick={() => handleToggleStatus(cat)}
                  className={`p-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    cat.status === 'active'
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                  title={cat.status === 'active' ? 'Inativar categoria' : 'Ativar categoria'}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{cat.status === 'active' ? 'Inativar' : 'Ativar'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-amber-500 p-4 text-slate-950 flex items-center justify-between">
              <h3 className="font-black text-base">
                {editingCategory.id ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-950 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  placeholder="Ex: Salgados Fritos Tradicionais"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição</label>
                <textarea
                  rows={3}
                  value={editingCategory.description || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  placeholder="Breve descrição da categoria..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ordem de Exibição</label>
                  <input
                    type="number"
                    min="1"
                    value={editingCategory.displayOrder || 1}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        displayOrder: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editingCategory.status || 'active'}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        status: e.target.value as 'active' | 'inactive',
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="active">Ativa</option>
                    <option value="inactive">Inativa</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-2 rounded-xl uppercase shadow"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
