import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
  X,
  Image as ImageIcon,
  AlertTriangle,
  RefreshCw,
  Cpu,
  CheckSquare,
  Square,
  Package,
  LayoutList,
  LayoutGrid,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Category, Product } from '../../types.js';
import { formatCurrency } from '../../utils/formatters.js';
import { useApp } from '../../context/AppContext.js';

export const ProductsManager: React.FC = () => {
  const { showToast } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');

  // View mode: 'list' (linhas um atrás do outro) or 'grid' (cards)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Edit / Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Dedicated Category Picker Modal state
  const [categoryModalProduct, setCategoryModalProduct] = useState<Product | null>(null);
  const [modalSelectedCategoryId, setModalSelectedCategoryId] = useState<string>('');
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  // Bulk category assignment state
  const [bulkCategoryId, setBulkCategoryId] = useState<string>('');
  const [isBulkCategoryUpdating, setIsBulkCategoryUpdating] = useState(false);

  // Single Delete Confirmation Modal state
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // Bulk Delete / Clear All Confirmation Modal state
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Checkbox multi-select state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // BlueFocus Direct Sync state
  const [isImportingBlueFocus, setIsImportingBlueFocus] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error';
    message: string;
    count?: number;
    errorDetail?: string;
  } | null>(null);
  const [isRestoringDemo, setIsRestoringDemo] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        fetch('/api/products?includeInactive=true'),
        fetch('/api/categories?includeInactive=true'),
      ]);
      if (pRes.ok && cRes.ok) {
        const pData = await pRes.json();
        const cData = await cRes.json();
        setProducts(Array.isArray(pData) ? pData : []);
        setCategories(Array.isArray(cData) ? cData : []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      showToast('Erro ao carregar lista de produtos.');
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
      imageUrl: '',
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
      setIsSaving(true);
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
        showToast(isNew ? 'Produto cadastrado com sucesso!' : 'Produto atualizado com sucesso!');
        await fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao salvar produto.');
      }
    } catch (err) {
      console.error('Error saving product:', err);
      showToast('Falha na comunicação ao salvar produto.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete single product
  const handleConfirmDeleteSingle = async () => {
    if (!productToDelete) return;

    try {
      setIsDeletingSingle(true);
      const res = await fetch(`/api/products/${productToDelete.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Produto "${productToDelete.name}" excluído com sucesso!`);
        // Remove immediately from state for instant responsiveness
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        setSelectedProductIds((prev) => prev.filter((id) => id !== productToDelete.id));
        setProductToDelete(null);
        await fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao excluir produto.');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      showToast('Falha ao excluir produto.');
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Clear all products (remove test items to sync real ones)
  const handleConfirmClearAll = async () => {
    try {
      setIsClearingAll(true);
      const res = await fetch('/api/products/clear-all', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setProducts([]);
        setSelectedProductIds([]);
        setIsClearAllModalOpen(false);
        showToast(data.message || 'Todos os produtos de teste foram excluídos! Pronto para sincronizar os reais.');
        await fetchData();
      } else {
        showToast(data.error || 'Erro ao limpar catálogo.');
      }
    } catch (err) {
      console.error('Error clearing products:', err);
      showToast('Falha na comunicação ao limpar produtos.');
    } finally {
      setIsClearingAll(false);
    }
  };

  // Bulk delete selected products
  const handleConfirmDeleteSelected = async () => {
    if (selectedProductIds.length === 0) return;

    try {
      setIsBulkDeleting(true);
      await Promise.all(
        selectedProductIds.map((id) =>
          fetch(`/api/products/${id}`, { method: 'DELETE' })
        )
      );
      showToast(`${selectedProductIds.length} produtos excluídos com sucesso!`);
      setProducts((prev) => prev.filter((p) => !selectedProductIds.includes(p.id)));
      setSelectedProductIds([]);
      await fetchData();
    } catch (err) {
      console.error('Error bulk deleting products:', err);
      showToast('Erro ao excluir produtos selecionados.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Direct sync from BlueFocus ERP
  const handleSyncFromBlueFocus = async () => {
    try {
      setIsImportingBlueFocus(true);
      setSyncStatus(null);
      showToast('Importando catálogo real do ERP BlueFocus (ExportaCadSAT)...');
      const res = await fetch('/api/bluefocus/import-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipoAtualizacao: 'C' }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus({
          type: 'success',
          message: data.message || `${data.importedCount || 0} produtos importados com sucesso!`,
          count: data.importedCount,
        });
        showToast(`Sucesso! ${data.importedCount || 0} produtos importados do BlueFocus!`);
        await fetchData();
      } else {
        setSyncStatus({
          type: 'error',
          message: data.message || 'Falha ao sincronizar produtos com o BlueFocus.',
          errorDetail: data.error,
        });
        showToast(data.message || 'Falha ao importar produtos do BlueFocus.');
      }
    } catch (err: any) {
      console.error('Error importing from BlueFocus:', err);
      setSyncStatus({
        type: 'error',
        message: 'Erro de comunicação ao conectar ao WebService BlueFocus.',
        errorDetail: err.message,
      });
      showToast('Erro de comunicação com o WebService BlueFocus.');
    } finally {
      setIsImportingBlueFocus(false);
    }
  };

  // Restore default demo products
  const handleRestoreDemo = async () => {
    try {
      setIsRestoringDemo(true);
      const res = await fetch('/api/products/restore-demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncStatus(null);
        showToast(data.message || 'Catálogo de demonstração restaurado com sucesso!');
        await fetchData();
      } else {
        showToast(data.error || 'Erro ao restaurar catálogo.');
      }
    } catch (err) {
      console.error('Error restoring demo products:', err);
      showToast('Falha na comunicação.');
    } finally {
      setIsRestoringDemo(false);
    }
  };

  // Quick category change right in the row
  const handleQuickChangeCategory = async (productId: string, newCategoryId: string) => {
    try {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, categoryId: newCategoryId } : p))
      );
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: newCategoryId }),
      });
      if (res.ok) {
        const catName = categories.find((c) => c.id === newCategoryId)?.name || 'Nova Categoria';
        showToast(`Categoria alterada para "${catName}"!`);
      } else {
        showToast('Erro ao atualizar categoria do produto.');
        await fetchData();
      }
    } catch (err) {
      console.error('Error changing category:', err);
      showToast('Falha na comunicação.');
      await fetchData();
    }
  };

  // Open dedicated category picker modal
  const handleOpenCategoryModal = (prod: Product) => {
    setCategoryModalProduct(prod);
    setModalSelectedCategoryId(prod.categoryId || (categories[0]?.id ?? ''));
  };

  // Save dedicated category picker modal
  const handleConfirmSaveCategoryModal = async () => {
    if (!categoryModalProduct || !modalSelectedCategoryId) return;
    try {
      setIsUpdatingCategory(true);
      const res = await fetch(`/api/products/${categoryModalProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: modalSelectedCategoryId }),
      });
      if (res.ok) {
        const catName = categories.find((c) => c.id === modalSelectedCategoryId)?.name || 'Categoria';
        showToast(`"${categoryModalProduct.name}" associado à categoria "${catName}"!`);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === categoryModalProduct.id ? { ...p, categoryId: modalSelectedCategoryId } : p
          )
        );
        setCategoryModalProduct(null);
      } else {
        showToast('Erro ao associar categoria.');
      }
    } catch (err) {
      console.error('Error saving category:', err);
      showToast('Falha na comunicação.');
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  // Bulk category apply
  const handleBulkApplyCategory = async () => {
    if (selectedProductIds.length === 0 || !bulkCategoryId) return;
    try {
      setIsBulkCategoryUpdating(true);
      const res = await fetch('/api/products/bulk-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: selectedProductIds,
          categoryId: bulkCategoryId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const catName = categories.find((c) => c.id === bulkCategoryId)?.name || 'Categoria';
        showToast(`${data.count || selectedProductIds.length} produtos movidos para "${catName}"!`);
        setProducts((prev) =>
          prev.map((p) =>
            selectedProductIds.includes(p.id) ? { ...p, categoryId: bulkCategoryId } : p
          )
        );
        setSelectedProductIds([]);
        setBulkCategoryId('');
      } else {
        showToast(data.error || 'Erro ao atualizar categorias em massa.');
      }
    } catch (err) {
      console.error('Error applying bulk category:', err);
      showToast('Falha na comunicação.');
    } finally {
      setIsBulkCategoryUpdating(false);
    }
  };

  // Toggle active/inactive status
  const handleToggleStatus = async (prod: Product) => {
    const newStatus: 'active' | 'inactive' = prod.status === 'active' ? 'inactive' : 'active';
    setProducts((prev) =>
      prev.map((p) => (p.id === prod.id ? { ...p, status: newStatus } : p))
    );
    try {
      const res = await fetch(`/api/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Produto ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
      } else {
        await fetchData();
      }
    } catch {
      await fetchData();
    }
  };

  // Toggle selection
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === filtered.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filtered.map((p) => p.id));
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
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-slate-900">Catálogo de Salgados</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {products.length} {products.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie itens, preços e códigos internos para franqueados e sincronização ERP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* BlueFocus Direct Sync Button */}
          <button
            id="btn-sync-bluefocus-products"
            type="button"
            onClick={handleSyncFromBlueFocus}
            disabled={isImportingBlueFocus}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            title="Importar catálogo diretamente do WebService BlueFocus"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isImportingBlueFocus ? 'animate-spin' : ''}`} />
            <span>{isImportingBlueFocus ? 'Sincronizando...' : 'Sincronizar BlueFocus'}</span>
          </button>

          {/* Clear All Test Products Button */}
          {products.length > 0 && (
            <button
              id="btn-clear-all-products"
              type="button"
              onClick={() => setIsClearAllModalOpen(true)}
              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Excluir todos os produtos de teste para importar os reais"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Itens de Teste</span>
            </button>
          )}

          {/* Restore Demo button if empty or customized */}
          <button
            id="btn-restore-demo-products"
            type="button"
            onClick={handleRestoreDemo}
            disabled={isRestoringDemo}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
            title="Restaurar lista de salgados padrão de demonstração"
          >
            <Package className={`w-3.5 h-3.5 ${isRestoringDemo ? 'animate-spin' : ''}`} />
            <span>{isRestoringDemo ? 'Restaurando...' : 'Restaurar Demo'}</span>
          </button>

          {/* New Product Button */}
          <button
            id="btn-new-product"
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Salgado</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 animate-in fade-in duration-200 ${
            syncStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {syncStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="text-sm font-bold">{syncStatus.message}</p>
              {syncStatus.errorDetail && (
                <p className="text-xs text-red-700 font-medium">
                  Detalhes técnicos: {syncStatus.errorDetail}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSyncStatus(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/50 transition cursor-pointer"
            title="Fechar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk Action Toolbar if items selected */}
      {selectedProductIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <span className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center font-black text-[11px]">
              {selectedProductIds.length}
            </span>
            <span>{selectedProductIds.length === 1 ? 'produto selecionado' : 'produtos selecionados'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Quick Bulk Category Mover */}
            <div className="flex items-center gap-1.5 bg-white border border-amber-300 rounded-xl px-2.5 py-1 shadow-2xs">
              <Tag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <select
                value={bulkCategoryId}
                onChange={(e) => setBulkCategoryId(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer pr-1"
                title="Escolha a categoria de destino para os itens selecionados"
              >
                <option value="">Associar à categoria...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleBulkApplyCategory}
                disabled={!bulkCategoryId || isBulkCategoryUpdating}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-2.5 py-1 rounded-lg transition cursor-pointer disabled:opacity-40 whitespace-nowrap"
              >
                {isBulkCategoryUpdating ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedProductIds([])}
              className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 font-bold transition cursor-pointer"
            >
              Desmarcar
            </button>
            <button
              type="button"
              onClick={handleConfirmDeleteSelected}
              disabled={isBulkDeleting}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isBulkDeleting ? 'Excluindo...' : `Excluir (${selectedProductIds.length})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome ou código interno (ex: BF-101)..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <select
          value={selectedCatFilter}
          onChange={(e) => setSelectedCatFilter(e.target.value)}
          className="w-full sm:w-60 py-2 px-3 text-xs rounded-xl border border-slate-200 font-bold text-slate-700 cursor-pointer"
        >
          <option value="all">Todas as Categorias ({products.length})</option>
          {categories.map((c) => {
            const count = products.filter((p) => p.categoryId === c.id).length;
            return (
              <option key={c.id} value={c.id}>
                {c.name} ({count})
              </option>
            );
          })}
        </select>

        {/* View Mode Toggle: Lista vs Cards */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Visualização em Linhas (um atrás do outro)"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Visualização em Grade de Cards"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
        </div>

        {filtered.length > 0 && (
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition whitespace-nowrap cursor-pointer"
          >
            {selectedProductIds.length === filtered.length ? (
              <>
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>Desmarcar Todos</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4 text-slate-400" />
                <span>Selecionar Todos</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
          <span>Carregando catálogo de produtos...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1">Catálogo de Produtos Vazio</h3>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Os itens de teste foram removidos com sucesso! Você pode agora sincronizar a lista oficial diretamente do seu ERP BlueFocus ou cadastrar novos itens manualmente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleSyncFromBlueFocus}
              disabled={isImportingBlueFocus}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Cpu className="w-4 h-4" />
              <span>{isImportingBlueFocus ? 'Sincronizando...' : 'Sincronizar do BlueFocus'}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Manualmente</span>
            </button>
          </div>
        </div>
      )}

      {/* Filtered Empty State */}
      {!loading && products.length > 0 && filtered.length === 0 && (
        <div className="p-8 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
          Nenhum produto encontrado para a busca atual.
        </div>
      )}

      {/* PRODUCTS LISTING: VIEW MODE = 'list' (Sequential Row Table) */}
      {!loading && filtered.length > 0 && viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-3.5 w-12 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="cursor-pointer"
                      title={selectedProductIds.length === filtered.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    >
                      {selectedProductIds.length === filtered.length && filtered.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 mx-auto" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 mx-auto" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3 w-28">Código</th>
                  <th className="py-3.5 px-3 min-w-[240px]">Produto / Descrição</th>
                  <th className="py-3.5 px-3 min-w-[220px]">Categoria (Alterar)</th>
                  <th className="py-3.5 px-3 w-28 text-right">Preço</th>
                  <th className="py-3.5 px-3 w-24 text-center">Status</th>
                  <th className="py-3.5 px-4 w-48 text-right">Opções de Edição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filtered.map((prod) => {
                  const isSelected = selectedProductIds.includes(prod.id);
                  const currentCategory = categories.find((c) => c.id === prod.categoryId);
                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-amber-50/30' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectProduct(prod.id)}
                          className="cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 mx-auto" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 mx-auto" />
                          )}
                        </button>
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-black text-slate-900 bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-[11px] whitespace-nowrap">
                          {prod.internalCode}
                        </span>
                      </td>

                      {/* Product Name & Description */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700 shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate max-w-sm" title={prod.name}>
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-sm">
                              {prod.description || 'Item oficial do catálogo'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category Selector with instant inline update */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="relative flex-1 max-w-[210px]">
                            <select
                              value={prod.categoryId || ''}
                              onChange={(e) => handleQuickChangeCategory(prod.id, e.target.value)}
                              className={`w-full text-xs font-bold rounded-xl pl-2.5 pr-6 py-1.5 border transition cursor-pointer truncate ${
                                currentCategory
                                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800 focus:ring-2 focus:ring-amber-500'
                                  : 'bg-amber-100 border-amber-400 text-amber-900 font-black ring-2 ring-amber-400/20'
                              }`}
                              title="Clique para escolher a categoria deste produto"
                            >
                              <option value="" disabled>-- Selecionar Categoria --</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenCategoryModal(prod)}
                            className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition shrink-0 cursor-pointer"
                            title="Ver todas as categorias existentes para associar"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3 text-right font-black text-slate-900 text-xs whitespace-nowrap">
                        {formatCurrency(prod.price)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(prod)}
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase cursor-pointer transition whitespace-nowrap ${
                            prod.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                          title="Clique para alternar entre Ativo e Inativo"
                        >
                          {prod.status === 'active' ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>

                      {/* Action buttons right in front of each item */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Categorias Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenCategoryModal(prod)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Escolher categoria deste produto"
                          >
                            <Tag className="w-3 h-3 text-amber-700" />
                            <span>Categoria</span>
                          </button>

                          {/* Editar Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Editar informações completas"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>

                          {/* Excluir Button */}
                          <button
                            id={`btn-delete-prod-${prod.id}`}
                            type="button"
                            onClick={() => setProductToDelete(prod)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                            title="Excluir este produto"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRODUCTS LISTING: VIEW MODE = 'grid' (Cards) */}
      {!loading && filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((prod) => {
            const isSelected = selectedProductIds.includes(prod.id);
            const currentCategory = categories.find((c) => c.id === prod.categoryId);
            return (
              <div
                key={prod.id}
                className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col justify-between transition ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="h-40 relative bg-slate-100 flex items-center justify-center overflow-hidden">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const parent = (e.target as HTMLElement).parentElement;
                          if (parent) {
                            (e.target as HTMLElement).style.display = 'none';
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400';
                            fallback.innerHTML = '<span class="text-xs font-bold text-slate-400">Sem foto</span>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 p-4 select-none">
                        <div className="w-10 h-10 rounded-xl bg-slate-200/70 flex items-center justify-center mb-1 text-slate-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">Sem foto cadastrada</span>
                      </div>
                    )}

                    {/* Selection Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelectProduct(prod.id)}
                      className="absolute top-2 right-2 p-1 rounded-lg bg-white/90 backdrop-blur-xs text-slate-700 hover:bg-white transition shadow-xs cursor-pointer"
                      title={isSelected ? 'Desmarcar' : 'Selecionar'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-amber-400 font-mono font-bold text-[10px] px-2 py-0.5 rounded">
                      {prod.internalCode}
                    </span>

                    {prod.status === 'inactive' && (
                      <span className="absolute bottom-2 left-2 bg-red-600/90 text-white font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                        Inativo
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{prod.description}</p>
                    
                    {/* Category Selector on Card */}
                    <div className="mt-3 flex items-center gap-1.5">
                      <select
                        value={prod.categoryId || ''}
                        onChange={(e) => handleQuickChangeCategory(prod.id, e.target.value)}
                        className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 flex-1 truncate cursor-pointer"
                        title="Alterar Categoria"
                      >
                        <option value="" disabled>-- Categoria --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleOpenCategoryModal(prod)}
                        className="p-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                        title="Ver todas as categorias"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 text-base font-black text-slate-900">
                      {formatCurrency(prod.price)}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(prod)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase transition ${
                      prod.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {prod.status === 'active' ? 'Ativo' : 'Inativo'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryModal(prod)}
                      className="px-2 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Escolher Categoria"
                    >
                      <Tag className="w-3 h-3 text-amber-700" />
                      <span>Cat.</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(prod)}
                      className="px-2.5 py-1.5 rounded-lg hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Editar produto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      id={`btn-delete-prod-${prod.id}`}
                      type="button"
                      onClick={() => setProductToDelete(prod)}
                      className="px-2.5 py-1.5 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                      title="Excluir este produto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRMATION MODAL: SINGLE PRODUCT DELETE */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1">
                Excluir Produto?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Tem certeza que deseja excluir o produto abaixo?
              </p>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-6">
                {productToDelete.imageUrl ? (
                  <img
                    src={productToDelete.imageUrl}
                    alt={productToDelete.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-200/70 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 truncate">
                    {productToDelete.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {productToDelete.internalCode}
                    </span>
                    <span className="text-[10px] font-black text-amber-600">
                      {formatCurrency(productToDelete.price)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  disabled={isDeletingSingle}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-delete-single"
                  type="button"
                  onClick={handleConfirmDeleteSingle}
                  disabled={isDeletingSingle}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeletingSingle ? 'Excluindo...' : 'Sim, Excluir Produto'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: CLEAR ALL TEST PRODUCTS */}
      {isClearAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-red-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black text-slate-900 mb-1">
                Limpar Todos os Produtos de Teste?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Esta ação excluirá <strong>todos os {products.length} produtos</strong> atualmente cadastrados na base de dados.
              </p>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs leading-relaxed mb-6">
                <strong>Recomendado para Sincronização:</strong> Utilize esta opção para zerar a base de demonstração antes de importar o catálogo oficial de salgados diretamente do ERP BlueFocus (WebService <code>ExportaCadSAT</code>).
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClearAllModalOpen(false)}
                  disabled={isClearingAll}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirm-clear-all"
                  type="button"
                  onClick={handleConfirmClearAll}
                  disabled={isClearingAll}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isClearingAll ? 'Limpando Base...' : 'Sim, Excluir Todos os Produtos'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-amber-400">
                  {editingProduct.id ? 'Editar Salgado' : 'Novo Salgado'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Preencha os detalhes para exibição no cardápio dos franqueados.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
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

                <div className="col-span-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span>Categoria Associada *</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Clique em qualquer categoria para vincular
                    </span>
                  </div>

                  <select
                    value={editingProduct.categoryId || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, categoryId: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-xs cursor-pointer mb-2"
                  >
                    <option value="" disabled>-- Selecione uma categoria --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Quick-Click Category Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((c) => {
                      const isSelected = editingProduct.categoryId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, categoryId: c.id })}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-amber-500 border-amber-600 text-slate-950 font-black shadow-xs ring-2 ring-amber-400/30'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <Tag className="w-3 h-3 shrink-0" />
                          <span>{c.name}</span>
                          {isSelected && <CheckCircle className="w-3 h-3 text-slate-950 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código Interno (ERP) *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.internalCode || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, internalCode: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    placeholder="Ex: SLG-102 ou 1002"
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
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
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
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-black px-6 py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Salgado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEDICATED CATEGORY PICKER MODAL */}
      {categoryModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden my-8">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-amber-400">
                    Associar Categoria
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Escolha a qual categoria este produto pertence
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalProduct(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product info banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-black bg-slate-900 text-amber-400 px-1.5 py-0.5 rounded">
                      {categoryModalProduct.internalCode}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 truncate">
                      {categoryModalProduct.name}
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Preço de fábrica: <span className="font-bold text-slate-800">{formatCurrency(categoryModalProduct.price)}</span>
                  </p>
                </div>
              </div>

              {/* Category selection list */}
              <div>
                <label className="font-bold text-xs text-slate-700 block mb-2">
                  Selecione uma das categorias existentes:
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const isSelected = modalSelectedCategoryId === cat.id;
                    const count = products.filter((p) => p.categoryId === cat.id).length;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setModalSelectedCategoryId(cat.id)}
                        className={`p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? 'border-amber-600 bg-amber-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className={`text-xs ${isSelected ? 'font-black text-amber-950' : 'font-bold text-slate-900'}`}>
                              {cat.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {cat.description || 'Categoria de salgados'}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                          isSelected ? 'bg-amber-200/70 text-amber-900' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {count} {count === 1 ? 'item' : 'itens'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCategoryModalProduct(null)}
                  disabled={isUpdatingCategory}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSaveCategoryModal}
                  disabled={isUpdatingCategory || !modalSelectedCategoryId}
                  className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{isUpdatingCategory ? 'Salvando...' : 'Salvar Associação'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
