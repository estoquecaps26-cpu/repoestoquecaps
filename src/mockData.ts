export type Category = 'Limpeza' | 'Higiene Pessoal' | 'Oficinas' | 'Enfermagem' | 'Escritório';

export interface Product {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  minQuantity: number;
  lastUpdate: string;
}

export interface Movement {
  id: string;
  productId: string;
  type: 'entrada' | 'saida';
  quantity: number;
  date: string;
  notes?: string;
}

export const initialProducts: Product[] = [
  { id: '1', name: 'Água Sanitária 1L', category: 'Limpeza', quantity: 15, minQuantity: 10, lastUpdate: '2026-04-18' },
  { id: '2', name: 'Sabonete Líquido 500ml', category: 'Higiene Pessoal', quantity: 8, minQuantity: 15, lastUpdate: '2026-04-17' },
  { id: '3', name: 'Papel Sulfite A4', category: 'Escritório', quantity: 20, minQuantity: 5, lastUpdate: '2026-04-10' },
  { id: '4', name: 'Seringa 5ml', category: 'Enfermagem', quantity: 150, minQuantity: 50, lastUpdate: '2026-04-15' },
  { id: '5', name: 'Tinta Guache Sortida', category: 'Oficinas', quantity: 12, minQuantity: 5, lastUpdate: '2026-04-12' },
];

export const initialMovements: Movement[] = [
  { id: 'm1', productId: '1', type: 'entrada', quantity: 20, date: '2026-04-18', notes: 'Compra mensal' },
  { id: 'm2', productId: '2', type: 'saida', quantity: 2, date: '2026-04-17', notes: 'Uso interno' },
];
