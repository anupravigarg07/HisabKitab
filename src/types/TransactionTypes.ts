// Purchase Transaction Interface
export interface PurchaseTransaction {
  id: string;
  date: string;
  name: string; // Product Name
  amount: string; // Purchasing Price
  quantity: string;
  unit: string;
  totalAmount: number;
  notes?: string;

  status: string;
}

// Sales Transaction Interface
export interface SalesTransaction {
  id: string;
  date: string;
  productName: string;
  sellingPrice: string;
  quantity: string;
  unit: string;
  totalAmount: number;
  notes?: string;
  status: string;
}

// Inventory Transaction Interface
export interface InventoryTransaction {
  date: string;
  name: string;
  sellingPrice: string;
  quantity: string;
}

//Purchase Form Data Interfaces
export interface TransactionFormData {
  name: string;
  amount: string; // Purchasing Price
  quantity: string;
  unit: string;
  notes?: string;
}

export interface SalesTransactionFormData {
  productName: string;
  sellingPrice: string;
  quantity: string;
  unit: string;
  notes?: string;
}

export interface InventoryFormData {
  name: string;
  sellingPrice: string;
  quantity: string;
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
