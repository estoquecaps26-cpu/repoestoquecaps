import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Plus, LayoutDashboard, FolderTree, FolderPlus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import type { Product } from './mockData';

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyK0JxzkUdkZLXbm7JXSmSlXXYFP_8zDWiVayXL3B9sKOsZRs0mkreeCFHg0yaW202mew/exec';

function App() {
  const [categories, setCategories] = useState<string[]>(['Limpeza', 'Higiene Pessoal', 'Oficinas', 'Enfermagem', 'Escritório']);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Modais e Estados
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'entrada' | 'saida'>('entrada');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productQuantity, setProductQuantity] = useState(0);
  const [productMinQuantity, setProductMinQuantity] = useState(5);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryOldName, setEditingCategoryOldName] = useState('');
  const [categoryName, setCategoryName] = useState('');

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'product'|'category'; targetId: string; targetName: string }>({
    isOpen: false, type: 'product', targetId: '', targetName: ''
  });

  // Carregar dados da planilha ao abrir o app
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(GOOGLE_SHEETS_URL);
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0 && data[0].id) {
        setProducts(data);
        
        // Extrair categorias únicas vindas da planilha e mesclar com as padrões
        const sheetCategories = data.map((p: any) => p.category);
        const uniqueCategories = Array.from(new Set([...categories, ...sheetCategories]));
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do Google Sheets:", error);
    }
    setIsLoading(false);
  };

  // Salvar dados na planilha
  const syncWithSheets = async (updatedProducts: Product[]) => {
    setIsSyncing(true);
    try {
      await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'ATUALIZAR_TUDO',
          products: updatedProducts
        })
      });
    } catch (error) {
      console.error("Erro ao salvar dados no Google Sheets:", error);
    }
    setIsSyncing(false);
  };

  const getCurrentDate = () => {
    const d = new Date();
    // Força formato YYYY-MM-DD no fuso local do navegador
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // Se a string vier apenas com YYYY-MM-DD, a adicionamos um horário no meio do dia
    // para evitar que a conversão de fuso horário mova a data para o dia anterior
    let safeDateStr = String(dateStr);
    if (safeDateStr.length === 10) safeDateStr += 'T12:00:00';
    return new Date(safeDateStr).toLocaleDateString('pt-BR');
  };

  const handleMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;

    const updatedProducts = products.map(p => {
      if (p.id === selectedProduct) {
        const newQty = modalType === 'entrada' ? Number(p.quantity) + Number(quantity) : Math.max(0, Number(p.quantity) - Number(quantity));
        return { ...p, quantity: newQty, lastUpdate: getCurrentDate() };
      }
      return p;
    });

    setProducts(updatedProducts);
    syncWithSheets(updatedProducts);

    setIsMovementModalOpen(false);
    setSelectedProduct('');
    setQuantity(0);
  };

  const openNewProduct = () => {
    setIsEditingProduct(false);
    setProductName('');
    setProductCategory(categories[0] || '');
    setProductQuantity(0);
    setProductMinQuantity(5);
    setIsProductModalOpen(true);
  };

  const openEditProduct = (prod: Product) => {
    setIsEditingProduct(true);
    setEditingProductId(prod.id);
    setProductName(prod.name);
    setProductCategory(prod.category as string);
    setProductQuantity(prod.quantity);
    setProductMinQuantity(prod.minQuantity);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productCategory) return;

    let updatedProducts;
    if (isEditingProduct) {
      updatedProducts = products.map(p => p.id === editingProductId ? {
        ...p,
        name: productName,
        category: productCategory as any,
        quantity: productQuantity,
        minQuantity: productMinQuantity,
        lastUpdate: getCurrentDate()
      } : p);
    } else {
      const newProduct: Product = {
        id: Math.random().toString(36).substr(2, 9),
        name: productName,
        category: productCategory as any,
        quantity: productQuantity,
        minQuantity: productMinQuantity,
        lastUpdate: getCurrentDate()
      };
      updatedProducts = [...products, newProduct];
    }
    
    setProducts(updatedProducts);
    syncWithSheets(updatedProducts);
    setIsProductModalOpen(false);
  };

  const openNewCategory = () => {
    setIsEditingCategory(false);
    setCategoryName('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (catName: string) => {
    setIsEditingCategory(true);
    setEditingCategoryOldName(catName);
    setCategoryName(catName);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;

    if (isEditingCategory) {
      if (categoryName !== editingCategoryOldName && !categories.includes(categoryName)) {
        setCategories(categories.map(c => c === editingCategoryOldName ? categoryName : c));
        
        const updatedProducts = products.map(p => p.category === editingCategoryOldName ? { ...p, category: categoryName as any } : p);
        setProducts(updatedProducts);
        syncWithSheets(updatedProducts); // Sincroniza se afetou produtos!
      }
    } else {
      if (!categories.includes(categoryName)) {
        setCategories([...categories, categoryName]);
      }
    }
    setIsCategoryModalOpen(false);
  };

  const confirmDelete = () => {
    let updatedProducts = products;
    if (deleteModal.type === 'product') {
      updatedProducts = products.filter(p => p.id !== deleteModal.targetId);
    } else {
      setCategories(categories.filter(c => c !== deleteModal.targetName));
      updatedProducts = products.filter(p => p.category !== deleteModal.targetName);
    }
    
    setProducts(updatedProducts);
    syncWithSheets(updatedProducts); // Sincroniza!
    setDeleteModal({ ...deleteModal, isOpen: false });
  };

  const zeroStockCount = products.filter(p => Number(p.quantity) === 0).length;
  const lowStockCount = products.filter(p => Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.minQuantity)).length;

  const groupedProducts: Record<string, Product[]> = {};
  const activeCategories = [...categories].sort((a, b) => a.localeCompare(b));

  activeCategories.forEach(cat => {
    const prodsInCat = products.filter(p => p.category === cat);
    groupedProducts[cat] = prodsInCat.sort((a, b) => a.name.localeCompare(b.name));
  });

  if (isLoading) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <RefreshCw className="w-12 h-12" color="var(--primary-color)" style={{ animation: 'spin 1s linear infinite' }} />
        <h2 style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Conectando à Planilha...</h2>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header glass">
        <h1>
          <Package className="w-6 h-6" color="var(--primary-color)" />
          Estoque CAPS
        </h1>
        {isSyncing && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...
          </span>
        )}
      </header>

      <main className="main-content">
        <div className="dashboard-grid">
          <div className="stat-card glass">
            <div className="stat-header"><span>Total de Itens</span><LayoutDashboard size={20} /></div>
            <div className="stat-value">{products.length}</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-header"><span>Atenção (Estoque Baixo)</span><AlertTriangle size={20} color={lowStockCount > 0 ? "var(--warning)" : "var(--text-muted)"} /></div>
            <div className="stat-value" style={{ color: lowStockCount > 0 ? 'var(--warning)' : 'inherit' }}>{lowStockCount}</div>
          </div>
          <div className="stat-card glass">
            <div className="stat-header"><span>Crítico (Zerados)</span><AlertTriangle size={20} color={zeroStockCount > 0 ? "var(--danger)" : "var(--text-muted)"} /></div>
            <div className="stat-value" style={{ color: zeroStockCount > 0 ? 'var(--danger)' : 'inherit' }}>{zeroStockCount}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" style={{ background: 'var(--surface-color)' }} onClick={openNewCategory}><FolderPlus size={18} /> Nova Categoria</button>
          <button className="btn btn-primary" onClick={openNewProduct}><Plus size={18} /> Novo Produto</button>
          <button className="btn btn-success" onClick={() => { setModalType('entrada'); setIsMovementModalOpen(true); }}><ArrowUpCircle size={18} /> Registrar Entrada</button>
          <button className="btn btn-danger" onClick={() => { setModalType('saida'); setIsMovementModalOpen(true); }}><ArrowDownCircle size={18} /> Registrar Saída</button>
        </div>

        {activeCategories.map(category => (
          <div key={category} className="table-container">
            <div className="category-header">
              <div className="category-header-title"><FolderTree size={20} color="var(--primary-color)" />{category}</div>
              <div className="category-header-actions">
                <button className="btn-icon" onClick={() => openEditCategory(category)}><Pencil size={16} /></button>
                <button className="btn-icon danger" onClick={() => setDeleteModal({ isOpen: true, type: 'category', targetId: category, targetName: category })}><Trash2 size={16} /></button>
              </div>
            </div>
            {groupedProducts[category].length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Nenhum produto cadastrado nesta categoria ainda.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }}>Produto</th>
                      <th style={{ width: '12%' }}>Atual</th>
                      <th style={{ width: '15%' }}>Mínimo Alerta</th>
                      <th style={{ width: '15%' }}>Status</th>
                      <th style={{ width: '13%' }}>Última Atualização</th>
                      <th style={{ width: '10%' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedProducts[category].map(product => (
                      <tr key={product.id}>
                        <td style={{ fontWeight: 600 }}>{product.name}</td>
                        <td style={{ fontWeight: 700, fontSize: '1rem' }}>{String(product.quantity) === '' ? '0' : Number(product.quantity)}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{product.minQuantity}</td>
                        <td>
                          {Number(product.quantity) === 0 ? <span className="badge badge-danger">Zerado</span> : 
                           Number(product.quantity) <= Number(product.minQuantity) ? <span className="badge badge-warning">Atenção</span> : 
                           <span className="badge badge-ok">Normal</span>}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{formatDate(String(product.lastUpdate))}</td>
                        <td>
                          <button className="btn-icon" onClick={() => openEditProduct(product)}><Pencil size={16} /></button>
                          <button className="btn-icon danger" onClick={() => setDeleteModal({ isOpen: true, type: 'product', targetId: product.id, targetName: product.name })}><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </main>

      {/* Modais omitidos para brevidade no script principal, mas são os mesmos de antes com as variáveis mantidas. */}
      {/* MODAL DE CATEGORIA (Novo/Editar) */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderPlus /> {isEditingCategory ? 'Editar Categoria' : 'Cadastrar Categoria'}
            </h2>
            <form onSubmit={handleSaveCategory}>
              <div className="form-group">
                <label>Nome da Categoria</label>
                <input type="text" required placeholder="Ex: Roupas" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsCategoryModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PRODUTO (Novo/Editar) */}
      {isProductModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus /> {isEditingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h2>
            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label>Nome do Produto</label>
                <input type="text" required placeholder="Ex: Álcool 70%" value={productName} onChange={(e) => setProductName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} required>
                  {categories.length === 0 && <option value="">Crie uma categoria primeiro</option>}
                  {[...categories].sort((a, b) => a.localeCompare(b)).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Estoque Atual</label>
                  <input type="number" min="0" required value={productQuantity} onChange={(e) => setProductQuantity(parseInt(e.target.value) || 0)} />
                </div>
                <div className="form-group">
                  <label style={{ color: 'var(--warning)' }}>Limite de Alerta</label>
                  <input type="number" min="0" required value={productMinQuantity} onChange={(e) => setProductMinQuantity(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsProductModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={categories.length === 0}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE MOVIMENTAÇÃO (Entrada/Saída) */}
      {isMovementModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h2 style={{ marginBottom: '1.5rem', color: modalType === 'entrada' ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {modalType === 'entrada' ? <ArrowUpCircle /> : <ArrowDownCircle />} Registrar {modalType === 'entrada' ? 'Entrada' : 'Saída'}
            </h2>
            <form onSubmit={handleMovement}>
              <div className="form-group">
                <label>Selecione o Produto</label>
                <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} required>
                  <option value="">Escolha na lista...</option>
                  {[...products].sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                    <option key={p.id} value={p.id}>{p.name} - {p.category} (Temos {p.quantity})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantidade a {modalType === 'entrada' ? 'adicionar' : 'remover'}</label>
                <input type="number" min="1" required value={quantity || ''} onChange={(e) => setQuantity(parseInt(e.target.value))} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsMovementModalOpen(false)}>Cancelar</button>
                <button type="submit" className={`btn ${modalType === 'entrada' ? 'btn-success' : 'btn-danger'}`} style={{ flex: 1 }}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ maxWidth: '400px' }}>
            <h2 style={{ color: 'var(--danger)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle /> Confirmar Exclusão
            </h2>
            <p style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Você tem certeza que deseja excluir <strong>{deleteModal.targetName}</strong>?
              {deleteModal.type === 'category' && (
                <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
                  Atenção: Excluir uma categoria apagará <strong>todos os produtos</strong> cadastrados dentro dela!
                </span>
              )}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}>Cancelar</button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmDelete}>Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
