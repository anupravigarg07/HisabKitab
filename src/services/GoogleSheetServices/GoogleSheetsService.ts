import { PurchaseTransactionMethods } from './methods/PurchaseTransactionMethods';
import { SalesTransactionMethods } from './methods/SalesTransactionMethods';
import { InventoryTransactionMethods } from './methods/InventoryTransactionMethods';
import {
  TransactionFormData,
  SalesTransactionFormData,
  InventoryFormData,
  PurchaseTransaction,
  SalesTransaction,
  InventoryTransaction,
} from '../../types/TransactionTypes';
import { GoogleSheetsResponse } from '../../types/GoogleSheetTypes';
import GoogleSignInService from '../GoogleSignInService/GoogleSignInService';

class GoogleSheetsService {
  private purchaseRepository: PurchaseTransactionMethods;
  private salesRepository: SalesTransactionMethods;
  private inventoryRepository: InventoryTransactionMethods;

  constructor() {
    this.purchaseRepository = new PurchaseTransactionMethods();
    this.salesRepository = new SalesTransactionMethods();
    this.inventoryRepository = new InventoryTransactionMethods();
  }

  // ----------------- Access Token -----------------
  public async getAccessToken(): Promise<string> {
    try {
      return await GoogleSignInService.getAccessToken();
    } catch (error) {
      console.error('Failed to get access token:', error);
      throw error;
    }
  }

  // ----------------- Purchase Methods -----------------
  async savePurchaseTransaction(
    userEmail: string,
    transactionData: TransactionFormData,
  ): Promise<GoogleSheetsResponse> {
    return await this.purchaseRepository.save(userEmail, transactionData);
  }

  async getPurchaseTransactions(
    userEmail: string,
    includeHistory: boolean = false,
  ): Promise<PurchaseTransaction[]> {
    return await this.purchaseRepository.getAll(userEmail, includeHistory);
  }

  async updatePurchaseTransactionById(
    userEmail: string,
    transactionId: string,
    updatedData: TransactionFormData,
  ): Promise<void> {
    return await this.purchaseRepository.updateById(
      userEmail,
      transactionId,
      updatedData,
    );
  }

  async deletePurchaseTransactionById(
    userEmail: string,
    transactionId: string,
  ): Promise<void> {
    return await this.purchaseRepository.deleteById(userEmail, transactionId);
  }

  async clearPurchaseSheet(userEmail: string): Promise<void> {
    return await this.purchaseRepository.clearAll(userEmail);
  }

  // ----------------- Sales Methods -----------------
  async saveSalesTransaction(
    userEmail: string,
    transactionData: SalesTransactionFormData,
  ): Promise<GoogleSheetsResponse> {
    return await this.salesRepository.save(userEmail, transactionData);
  }

  async getSalesTransactions(
    userEmail: string,
    includeHistory: boolean = false,
  ): Promise<SalesTransaction[]> {
    return await this.salesRepository.getAll(userEmail, includeHistory);
  }

  async updateSalesTransactionById(
    userEmail: string,
    transactionId: string,
    updatedData: Partial<SalesTransaction>,
  ): Promise<void> {
    return await this.salesRepository.updateById(
      userEmail,
      transactionId,
      updatedData,
    );
  }

  async deleteSalesTransactionById(
    userEmail: string,
    transactionId: string,
  ): Promise<void> {
    return await this.salesRepository.deleteById(userEmail, transactionId);
  }

  async clearSalesSheet(userEmail: string): Promise<void> {
    return await this.salesRepository.clearAll(userEmail);
  }

  // ----------------- Inventory Methods -----------------
  async saveInventoryTransaction(
    userEmail: string,
    sheetName: string,
    inventoryData: InventoryFormData,
  ): Promise<GoogleSheetsResponse> {
    return await this.inventoryRepository.save(
      userEmail,
      sheetName,
      inventoryData,
    );
  }

  async getInventoryTransactions(
    userEmail: string,
    sheetName: string,
    includeHistory: boolean = false,
  ): Promise<InventoryTransaction[]> {
    return await this.inventoryRepository.getAll(
      userEmail,
      sheetName,
      includeHistory,
    );
  }

  async updateInventoryTransactionById(
    userEmail: string,
    sheetName: string,
    transactionId: string,
    updatedData: InventoryFormData,
  ): Promise<void> {
    return await this.inventoryRepository.updateById(
      userEmail,
      sheetName,
      transactionId,
      updatedData,
    );
  }

  async deleteInventoryTransactionById(
    userEmail: string,
    sheetName: string,
    transactionId: string,
  ): Promise<void> {
    return await this.inventoryRepository.deleteById(
      userEmail,
      sheetName,
      transactionId,
    );
  }

  async clearInventorySheet(
    userEmail: string,
    sheetName: string,
  ): Promise<void> {
    return await this.inventoryRepository.clearAll(userEmail, sheetName);
  }

  async calculateCurrentInventory(userEmail: string) {
    return await this.inventoryRepository.calculateCurrentInventory(userEmail);
  }

  async getInventorySummary(userEmail: string) {
    return await this.inventoryRepository.getInventorySummary(userEmail);
  }

  async searchInventory(userEmail: string, searchTerm: string) {
    return await this.inventoryRepository.searchInventory(
      userEmail,
      searchTerm,
    );
  }

  // ----------------- Utility -----------------
  async createOrGetUserSpreadsheet(userEmail: string): Promise<string> {
    try {
      return await this.purchaseRepository['createOrGetUserSpreadsheet'](
        userEmail,
      );
    } catch (error) {
      console.error('Spreadsheet operation failed:', error);
      throw error;
    }
  }
}

export default new GoogleSheetsService();
