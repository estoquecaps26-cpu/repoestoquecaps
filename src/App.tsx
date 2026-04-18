import React, { useState } from 'react';
import { Package, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Plus, LayoutDashboard, FolderTree, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { initialProducts, initialMovements } from './mockData';
import type { Product, Movement } from './mockData';

function App() {
  // Estado das Categorias
  const [categories, setCategories] = useState<string[]>(['Limpeza', 'Higiene Pessoal', 'Oficinas', 'Enfermagem', 'Escritório']);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  
  // Estados para movimentação (Entrada/Saída)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'entrada' | 'saida'>('entrada');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);

  // Estados para Novo/Editar Produto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState('');
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState(categories[0] || '');
  const [productQuantity, setProductQuantity] = useState(0);
  const [productMinQuantity, setProductMinQuantity] = useState(5);

  // Estados para Nova/Editar Categoria
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryOldName, setEditingCategoryOldName] = useState('');
  const [categoryName, setCategoryName] = useState('');

  // Estados para Exclusão
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'product'|'category'; targetId: string; targetName: string }>({
    isOpen: false, type: 'product', targetId: '', targetName: ''
  });

  // Contadores para o Dashboard
  const zeroStockCount = products.filter(p => p.quantity === 0).length;
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minQuantity).length;

  const handleMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;

    const newMovement: Movement = {
      id: Math.random().toString(36).substr(2, 9),
      productId: selectedProduct,
      type: modalType,
      quantity,
      date: new Date().toISOString().split('T')[0],
    };

    setMovements([newMovement, ...movements]);

    setProducts(products.map(p => {
      if (p.id === selectedProduct) {
        const newQty = modalType === 'entrada' ? p.quantity + quantity : Math.max(0, p.quantity - quantity);
        return { ...p, quantity: newQty, lastUpdate: newMovement.date };
      }
      return p;
    }));

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

    if (isEditingProduct) {
      setProducts(products.map(p => p.id === editingProductId ? {
        ...p,
        name: productName,
        category: productCategory as any,
        quantity: productQuantity,
        minQuantity: productMinQuantity
      } : p));
    } else {
      const newProduct: Product = {
        id: Math.random().toString(36).substr(2, 9),
        name: productName,
        category: productCategory as any,
        quantity: productQuantity,
        minQuantity: productMinQuantity,
        lastUpdate: new Date().toISOString().split('T')[0]
      };
      setProducts([...products, newProduct]);
    }
    
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
        // Atualiza a lista de categorias
        setCategories(categories.map(c => c === editingCategoryOldName ? categoryName : c));
        // Atualiza todos os produtos que tinham a categoria antiga
        setProducts(products.map(p => p.category === editingCategoryOldName ? { ...p, category: categoryName as any } : p));
      }
    } else {
      if (!categories.includes(categoryName)) {
        setCategories([...categories, categoryName]);
      }
    }
    setIsCategoryModalOpen(false);
  };

  const confirmDelete = () => {
    if (deleteModal.type === 'product') {
      setProducts(products.filter(p => p.id !== deleteModal.targetId));
    } else {
      // Exclui a categoria e os produtos nela
      setCategories(categories.filter(c => c !== deleteModal.targetName));
      setProducts(products.filter(p => p.category !== deleteModal.targetName));
    }
    setDeleteModal({ ...deleteModal, isOpen: false });
  };

  // Agrupar produtos por categoria e organizar em ordem alfabética
  const groupedProducts: Record<string, Product[]> = {};
  const activeCategories = [...categories].sort((a, b) => a.localeCompare(b));

  activeCategories.forEach(cat => {
    const prodsInCat = products.filter(p => p.category === cat);
    groupedProducts[cat] = prodsInCat.sort((a, b) => a.name.localeCompare(b.name));
  });

  return (
    <div className="app-container">
      <header className="header glass">
        <h1>
          <Package className="w-6 h-6" color="var(--primary-color)" />
          Estoque CAPS
        </h1>
      </header>

      <main className="main-content">
        {/* DASHBOARD */}
        <div className="dashboard-grid">
          <div className="stat-card glass">
            <div className="stat-header">
              <span>Total de Itens Diferentes</span>
              <LayoutDashboard size={20} />
            </div>
            <div className="stat-value">{products.length}</div>
          </div>
          
          <div className="stat-card glass">
            <div className="stat-header">
              <span>Atenção (Estoque Baixo)</span>
              <AlertTriangle size={20} color={lowStockCount > 0 ? "var(--warning)" : "var(--text-muted)"} />
            </div>
            <div className="stat-value" style={{ color: lowStockCount > 0 ? 'var(--warning)' : 'inherit' }}>
              {lowStockCount}
            </div>
          </div>

          <div className="stat-card glass">
            <div className="stat-header">
              <span>Crítico (Zerados)</span>
              <AlertTriangle size={20} color={zeroStockCount > 0 ? "var(--danger)" : "var(--text-muted)"} />
            </div>
            <div className="stat-value" style={{ color: zeroStockCount > 0 ? 'var(--danger)' : 'inherit' }}>
              {zeroStockCount}
            </div>
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button className="btn btn-outline" style={{ background: 'var(--surface-color)' }} onClick={openNewCategory}>
            <FolderPlus size={18} /> Nova Categoria
          </button>
          <button className="btn btn-primary" onClick={openNewProduct}>
            <Plus size={18} /> Novo Produto
          </button>
          <button className="btn btn-success" onClick={() => { setModalType('entrada'); setIsMovementModalOpen(true); }}>
            <ArrowUpCircle size={18} /> Registrar Entrada
          </button>
          <button className="btn btn-danger" onClick={() => { setModalType('saida'); setIsMovementModalOpen(true); }}>
            <ArrowDownCircle size={18} /> Registrar Saída
          </button>
        </div>

        {/* LISTAGEM POR CATEGORIA */}
        {activeCategories.map(category => (
          <div key={category} className="table-container">
            <div className="category-header">
              <div className="category-header-title">
                <FolderTree size={20} color="var(--primary-color)" />
                {category}
              </div>
              <div className="category-header-actions">
                <button className="btn-icon" onClick={() => openEditCategory(category)} title="Editar Categoria">
                  <Pencil size={16} />
                </button>
                <button className="btn-icon danger" onClick={() => setDeleteModal({ isOpen: true, type: 'category', targetId: category, targetName: category })} title="Excluir Categoria">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {groupedProducts[category].length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Nenhum produto cadastrado nesta categoria ainda.
              </div>
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
                        <td style={{ fontWeight: 700, fontSize: '1rem' }}>{product.quantity}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{product.minQuantity}</td>
                        <td>
                          {product.quantity === 0 ? (
                            <span className="badge badge-danger">Zerado</span>
                          ) : product.quantity <= product.minQuantity ? (
                            <span className="badge badge-warning">Atenção</span>
                          ) : (
                            <span className="badge badge-ok">Normal</span>
                          )}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {new Date(product.lastUpdate).toLocaleDateString('pt-BR')}
                        </td>
                        <td>
                          <button className="btn-icon" onClick={() => openEditProduct(product)} title="Editar Produto">
                            <Pencil size={16} />
                          </button>
                          <button className="btn-icon danger" onClick={() => setDeleteModal({ isOpen: true, type: 'product', targetId: product.id, targetName: product.name })} title="Excluir Produto">
                            <Trash2 size={16} />
                          </button>
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
                <input 
                  type="text" required placeholder="Ex: Roupas"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
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
                <input 
                  type="text" required placeholder="Ex: Álcool 70%"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
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
                  <input 
                    type="number" min="0" required
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ color: 'var(--warning)' }}>Limite de Alerta</label>
                  <input 
                    type="number" min="0" required
                    value={productMinQuantity}
                    onChange={(e) => setProductMinQuantity(parseInt(e.target.value) || 0)}
                  />
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
              {modalType === 'entrada' ? <ArrowUpCircle /> : <ArrowDownCircle />}
              Registrar {modalType === 'entrada' ? 'Entrada' : 'Saída'}
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
                <input 
                  type="number" min="1" required
                  value={quantity || ''}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                />
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
