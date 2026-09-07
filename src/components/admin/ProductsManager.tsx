import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle, XCircle, Tag, X, Image as ImageIcon } from 'lucide-react';
import { Category, Product } from '../../types.js';
import { formatCurrency } from '../../utils/formatters.js';

export const ProductsManager: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      if (pRes.ok && cRes.ok) {
        setProducts(await pRes.json());
        setCategories(await cRes.json());
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct({
      name: '',
      description: '',
      categoryId: categories[0]?.id || 'cat-1',
      price: 6.5,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
      internalCode: `SLG-${Math.floor(100 + Math.random() * 900)}`,
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const isNew = !editingProduct.id;
      const url = isNew ? '/api/products' : `/api/products/${editingProduct.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingProduct(null);
        fetchData();
      }
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const filtered = products.filter((p) => {
    const matchesCat = selectedCatFilter === 'all' || p.categoryId === selectedCatFilter;
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.internalCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Catálogo de Salgados</h2>
          <p className="text-xs text-slate-500">
            Cadastre novos salgados, gerencie preços e códigos de integração para franqueados.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Salgado</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome ou código interno (ex: SLG-101)..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={selectedCatFilter}
          onChange={(e) => setSelectedCatFilter(e.target.value)}
          className="w-full sm:w-56 py-2 px-3 text-xs rounded-xl border border-slate-200 font-bold text-slate-700"
        >
          <option value="all">Todas as Categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((prod) => {
          const cat = categories.find((c) => c.id === prod.categoryId);
          return (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="h-40 relative bg-slate-100">
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-amber-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                    {prod.internalCode}
                  </span>
                  <span
                    className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      prod.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {prod.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="p-4">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                    {cat?.name || 'Salgados'}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-1">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{prod.description}</p>
                  <div className="mt-3 text-base font-black text-slate-900">
                    {formatCurrency(prod.price)}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(prod)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>
                <button
                  onClick={() => handleDelete(prod.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 text-xs flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-amber-500 p-4 text-slate-950 flex items-center justify-between">
              <h3 className="font-black text-base">
                {editingProduct.id ? 'Editar Salgado' : 'Novo Salgado'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-950 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Nome do Salgado *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                    placeholder="Ex: Risole de Presunto e Queijo (100g)"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria *</label>
                  <select
                    value={editingProduct.categoryId || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, categoryId: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código Interno *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.internalCode || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, internalCode: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    placeholder="Ex: SLG-102"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preço Unitário (R$) *</label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={editingProduct.status || 'active'}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        status: e.target.value as 'active' | 'inactive',
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="active">Ativo (Visível no Cardápio)</option>
                    <option value="inactive">Inativo (Oculto)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">URL da Imagem</label>
                  <input
                    type="url"
                    value={editingProduct.imageUrl || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, imageUrl: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                    placeholder="https://..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Descrição Detalhada</label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, description: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                    placeholder="Ingredientes, peso e informações do produto..."
                  />
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
