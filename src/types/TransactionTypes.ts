// Purchase Transaction Interface
export interface PurchaseTransaction {
  id: string;
  date: string;
  name: string;
  amount: number;
  quantity: number;
  unit: string;
  totalAmount: number;
  notes?: string;
  status: string;
}

export interface TransactionFormData {
  name: string;
  amount: number;
  quantity: number;
  unit: string;
  notes?: string;
}

// Sales Transaction Interface
export interface SalesTransaction {
  id: string;
  date: string;
  productName: string;
  sellingPrice: number;
  quantity: number;
  unit: string;
  totalAmount: number;
  notes?: string;
  status: string;
}

export interface SalesTransactionFormData {
  productName: string;
  sellingPrice: number;
  quantity: number;
  unit: string;
  notes?: string;
}

// Inventory Transaction Interface
export interface InventoryTransaction {
  id: string;
  date: string; // last updated date for this stock
  productName: string;
  quantity: number;
  unit: string;
  purchasePrice?: number;
  sellingPrice?: number;
  totalValue?: number;
  notes?: string;
  status: string;
}

// Inventory Form Data Interface
export interface InventoryFormData {
  productName: string;
  quantity: number;
  unit: string;
  purchasePrice?: number;
  sellingPrice?: number;
  notes?: string;
}

// Generic interface for backward compatibility
export interface SavedTransaction {
  id: string;
  date: string;
  name: string;
  number: string;
  amount: string;
  message: string;
  // Optional fields for specific transaction types
  customer?: string;
  product?: string;
  quantity?: string;
  sellingPrice?: string;
  notes?: string;
}
