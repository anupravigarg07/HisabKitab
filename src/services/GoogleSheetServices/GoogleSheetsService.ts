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

  /**
   * ✅ Use centralized token management from GoogleSignInService
   * This prevents race conditions and token conflicts
   */
  public async getAccessToken(): Promise<string> {
    console.log(
      'GoogleSheetsService: Getting access token via GoogleSignInService...',
    );
    try {
      const token = await GoogleSignInService.getAccessToken();
      console.log('GoogleSheetsService: Token obtained successfully');
      return token;
    } catch (error) {
      console.error('GoogleSheetsService: Failed to get access token:', error);
      throw error;
    }
  }

  // ----------------- Purchase Transaction Methods -----------------
  async savePurchaseTransaction(
    userEmail: string,
    transactionData: TransactionFormData,
  ): Promise<GoogleSheetsResponse> {
    console.log(
      'GoogleSheetsService: Saving purchase transaction for',
      userEmail,
    );
    return await this.purchaseRepository.save(userEmail, transactionData);
  }

  async getPurchaseTransactions(
    userEmail: string,
    includeHistory: boolean = false,
  ): Promise<PurchaseTransaction[]> {
    console.log(
      'GoogleSheetsService: Fetching purchase transactions for',
      userEmail,
    );
    console.log('GoogleSheetsService: Include history:', includeHistory);

    try {
      const result = await this.purchaseRepository.getAll(
        userEmail,
        includeHistory,
      );
      console.log('GoogleSheetsService: Fetch result:', {
        type: typeof result,
        isArray: Array.isArray(result),
        length: result?.length,
        firstItem: result?.[0],
      });
      return result;
    } catch (error) {
      console.error('GoogleSheetsService: Error fetching transactions:', error);
      throw error;
    }
  }

  async updatePurchaseTransactionById(
    userEmail: string,
    transactionId: string,
    updatedData: TransactionFormData,
  ): Promise<void> {
    console.log(
      'GoogleSheetsService: Updating purchase transaction',
      transactionId,
      'for',
      userEmail,
    );
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
    console.log(
      'GoogleSheetsService: Deleting purchase transaction',
      transactionId,
      'for',
      userEmail,
    );
    return await this.purchaseRepository.deleteById(userEmail, transactionId);
  }

  // ----------------- Sales Transaction Methods -----------------
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
    id: string,
    transactionData: Partial<SalesTransaction>,
  ): Promise<void> {
    return await this.salesRepository.updateById(
      userEmail,
      id,
      transactionData,
    );
  }

  async deleteSalesTransactionById(
    userEmail: string,
    transactionId: string,
  ): Promise<void> {
    return await this.salesRepository.deleteById(userEmail, transactionId);
  }

  // ----------------- Inventory Transaction Methods -----------------
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
  ): Promise<InventoryTransaction[]> {
    return await this.inventoryRepository.getAll(userEmail, sheetName);
  }

  // ----------------- Utility Methods -----------------
  async clearSheet(
    userEmail: string,
    sheetName: string = 'purchase details',
  ): Promise<void> {
    switch (sheetName) {
      case 'purchase details':
        return await this.purchaseRepository.clearAll(userEmail);
      case 'sales':
        return await this.salesRepository.clearAll(userEmail);
      default:
        return await this.inventoryRepository.clearAll(userEmail, sheetName);
    }
  }

  async createOrGetUserSpreadsheet(userEmail: string): Promise<string> {
    console.log(
      'GoogleSheetsService: Creating/getting spreadsheet for',
      userEmail,
    );
    try {
      // Access the private method using bracket notation
      const result = await this.purchaseRepository[
        'createOrGetUserSpreadsheet'
      ](userEmail);
      console.log('GoogleSheetsService: Spreadsheet operation result:', result);
      return result;
    } catch (error) {
      console.error(
        'GoogleSheetsService: Spreadsheet operation failed:',
        error,
      );
      throw error;
    }
  }
}

export default new GoogleSheetsService();
