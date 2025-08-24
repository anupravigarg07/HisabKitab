// SalesTransactionMethods.ts
import { GoogleSheetsServiceBaseMethods } from './GoogleSheetsServiceBaseMethods';
import {
  SalesTransactionFormData,
  SalesTransaction,
} from '../../../types/TransactionTypes';
import { GoogleSheetsResponse } from '../../../types/GoogleSheetTypes';

export class SalesTransactionMethods extends GoogleSheetsServiceBaseMethods {
  private readonly SHEET_NAME = 'sales';

  async save(
    userEmail: string,
    transactionData: SalesTransactionFormData,
  ): Promise<GoogleSheetsResponse> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      const transactionId = `SALE-${Date.now()}`;

      const totalAmount =
        transactionData.sellingPrice && transactionData.quantity
          ? Number(transactionData.sellingPrice) *
            Number(transactionData.quantity)
          : 0;

      const values: string[][] = [
        [
          transactionId,
          new Date().toISOString(),
          transactionData.productName,
          String(transactionData.sellingPrice || ''),
          String(transactionData.quantity || ''),
          transactionData.unit,
          String(totalAmount),
          transactionData.notes || '',
          'Active',
        ],
      ];

      return await this.appendRowToSheet(
        spreadsheetId,
        this.SHEET_NAME,
        values,
      );
    } catch (error) {
      console.error('Error saving sales transaction:', error);
      throw error;
    }
  }

  async getAll(
    userEmail: string,
    includeHistory: boolean = false,
  ): Promise<SalesTransaction[]> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
      const values = await this.getSheetData(spreadsheetId, this.SHEET_NAME);

      // Format: [id, date, productName, sellingPrice, quantity, unit, totalAmount, notes, status]
      let transactions: SalesTransaction[] = values.slice(1).map(
        (row: string[]): SalesTransaction => ({
          id: row[0] || '',
          date: row[1] || '',
          productName: row[2] || '',
          sellingPrice: Number(row[3]) || 0,
          quantity: Number(row[4]) || 0,
          unit: row[5] || '',
          totalAmount: Number(row[6]) || 0,
          notes: row[7] || '',
          status: row[8] || 'Active',
        }),
      );

      if (!includeHistory) {
        transactions = transactions.filter(t => t.status === 'Active');
      }

      return transactions;
    } catch (error) {
      console.error('Error getting sales transactions:', error);
      throw error;
    }
  }

  async updateById(
    userEmail: string,
    id: string,
    transactionData: Partial<SalesTransaction>,
  ): Promise<void> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      const values = await this.getSheetData(
        spreadsheetId,
        this.SHEET_NAME,
        'A:I',
      );

      const rowIndex = values.findIndex((row: string[]) => row[0] === id);

      if (rowIndex === -1) {
        throw new Error(`Sales transaction with ID ${id} not found`);
      }

      const oldRow = values[rowIndex];

      // Archive old row
      const archivedRow = [...oldRow];
      archivedRow[8] = 'Archived';

      await this.updateRow(
        spreadsheetId,
        this.SHEET_NAME,
        rowIndex + 1,
        archivedRow,
      );

      // New row
      const newSellingPrice =
        transactionData.sellingPrice ?? (Number(oldRow[3]) || 0);
      const newQuantity = transactionData.quantity ?? (Number(oldRow[4]) || 0);
      const newTotalAmount =
        transactionData.sellingPrice && transactionData.quantity
          ? Number(transactionData.sellingPrice) *
            Number(transactionData.quantity)
          : Number(oldRow[6]) || 0;

      const newRow: string[] = [
        id,
        transactionData.date || oldRow[1],
        transactionData.productName || oldRow[2],
        String(newSellingPrice),
        String(newQuantity),
        transactionData.unit || oldRow[5],
        String(newTotalAmount),
        transactionData.notes || oldRow[7],
        'Active',
      ];

      await this.appendRowToSheet(spreadsheetId, this.SHEET_NAME, [newRow]);
    } catch (error) {
      console.error('Error updating sales transaction:', error);
      throw error;
    }
  }

  async deleteById(userEmail: string, transactionId: string): Promise<void> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
      const transactions = await this.getAll(userEmail, true);

      const activeTransactionIndex = transactions.findIndex(
        t => t.id === transactionId && t.status === 'Active',
      );

      if (activeTransactionIndex === -1) {
        throw new Error('Active sales transaction not found');
      }

      const rowNumber = activeTransactionIndex + 2; // +2 for headers
      await this.updateRowStatus(
        spreadsheetId,
        this.SHEET_NAME,
        rowNumber,
        'Deleted',
      );
    } catch (error) {
      console.error('Error deleting sales transaction by ID:', error);
      throw error;
    }
  }

  async clearAll(userEmail: string): Promise<void> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
      await this.clearSheet(spreadsheetId, this.SHEET_NAME);
    } catch (error) {
      console.error('Error clearing sales sheet:', error);
      throw error;
    }
  }
}
