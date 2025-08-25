import { GoogleSheetsServiceBaseMethods } from './GoogleSheetsServiceBaseMethods';
import {
  TransactionFormData,
  PurchaseTransaction,
} from '../../../types/TransactionTypes';
import { GoogleSheetsResponse } from '../../../types/GoogleSheetTypes';

export class PurchaseTransactionMethods extends GoogleSheetsServiceBaseMethods {
  private readonly SHEET_NAME = 'purchase details';

  async save(
    userEmail: string,
    transactionData: TransactionFormData,
  ): Promise<GoogleSheetsResponse> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      // Generate unique ID
      const transactionId = `PUR-${Date.now()}`;

      const values: string[][] = [
        [
          transactionId,
          new Date().toISOString(),
          transactionData.name,
          String(transactionData.amount ?? ''),
          String(transactionData.quantity ?? ''),
          transactionData.unit,
          transactionData.amount && transactionData.quantity
            ? String(
                Number(transactionData.amount) *
                  Number(transactionData.quantity),
              )
            : '0', 
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
      console.error('Error saving purchase transaction:', error);
      throw error;
    }
  }

  async getAll(
    userEmail: string,
    includeHistory: boolean = false,
  ): Promise<PurchaseTransaction[]> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
      console.log('Spreadsheet ID:', spreadsheetId);

      const values = await this.getSheetData(spreadsheetId, this.SHEET_NAME);
      console.log('Fetched rows from sheet:', values);

      if (!values || values.length <= 1) {
        console.warn('No purchase transactions found!');
        return [];
      }

      let transactions: PurchaseTransaction[] = values.slice(1).map(
        (row: string[]): PurchaseTransaction => ({
          id: row[0] || '',
          date: row[1] || '',
          name: row[2] || '',
          amount: Number(row[3]) || 0,
          quantity: Number(row[4]) || 0,
          unit: row[5] || '',
          totalAmount: row[6] ? Number(row[6]) : 0,
          notes: row[7] || '',
          status: row[8] || 'Active',
        }),
      );

      if (!includeHistory) {
        transactions = transactions.filter(t => t.status === 'Active');
      }

      return transactions;
    } catch (error) {
      console.error('Error getting purchase transactions:', error);
      throw error; 
    }
  }

  async updateById(
    userEmail: string,
    transactionId: string,
    updatedData: TransactionFormData,
  ): Promise<void> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      const transactions = await this.getAll(userEmail, true);

      // Archive old rows
      for (let i = 0; i < transactions.length; i++) {
        if (
          transactions[i].id === transactionId &&
          transactions[i].status === 'Active'
        ) {
          const archiveRowNumber = i + 2;
          await this.updateRowStatus(
            spreadsheetId,
            this.SHEET_NAME,
            archiveRowNumber,
            'Archived',
          );
        }
      }

      // Add updated row
      const newValues: string[][] = [
        [
          transactionId,
          new Date().toISOString(),
          updatedData.name,
          String(updatedData.amount ?? ''),
          String(updatedData.quantity ?? ''),
          updatedData.unit,
          updatedData.amount && updatedData.quantity
            ? String(Number(updatedData.amount) * Number(updatedData.quantity))
            : '0',
          updatedData.notes || '',
          'Active',
        ],
      ];

      await this.appendRowToSheet(spreadsheetId, this.SHEET_NAME, newValues);
    } catch (error) {
      console.error('Error updating purchase transaction:', error);
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
        throw new Error('Active transaction not found');
      }

      const rowNumber = activeTransactionIndex + 2;
      await this.updateRowStatus(
        spreadsheetId,
        this.SHEET_NAME,
        rowNumber,
        'Deleted',
      );
    } catch (error) {
      console.error('Error deleting purchase transaction by ID:', error);
      throw error;
    }
  }

  async clearAll(userEmail: string): Promise<void> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
      await this.clearSheet(spreadsheetId, this.SHEET_NAME);
    } catch (error) {
      console.error('Error clearing purchase sheet:', error);
      throw error;
    }
  }
}
