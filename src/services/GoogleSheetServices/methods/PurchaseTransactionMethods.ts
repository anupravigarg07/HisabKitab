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
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    const transactionId = `PUR-${Date.now()}`;
    const totalAmount =
      transactionData.amount && transactionData.quantity
        ? Number(transactionData.amount) * Number(transactionData.quantity)
        : 0;

    const values: string[][] = [
      [
        transactionId,
        new Date().toISOString(),
        transactionData.name,
        String(transactionData.amount ?? ''),
        String(transactionData.quantity ?? ''),
        transactionData.unit,
        String(totalAmount),
        transactionData.notes || '',
        'Active',
      ],
    ];

    return await this.appendRowToSheet(spreadsheetId, this.SHEET_NAME, values);
  }

  async getAll(
    userEmail: string,
    includeHistory: boolean = false,
  ): Promise<PurchaseTransaction[]> {
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    const values = await this.getSheetData(spreadsheetId, this.SHEET_NAME);

    if (!values || values.length <= 1) return [];

    let transactions: PurchaseTransaction[] = values
      .slice(1)
      .map((row: string[]) => ({
        id: row[0] || '',
        date: row[1] || '',
        name: row[2] || '',
        amount: Number(row[3]) || 0,
        quantity: Number(row[4]) || 0,
        unit: row[5] || '',
        totalAmount: row[6] ? Number(row[6]) : 0,
        notes: row[7] || '',
        status: row[8] || 'Active',
      }));

    if (!includeHistory)
      transactions = transactions.filter(t => t.status === 'Active');
    return transactions;
  }

  async updateById(
    userEmail: string,
    transactionId: string,
    updatedData: TransactionFormData,
  ): Promise<void> {
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    const transactions = await this.getAll(userEmail, true);

    for (let i = 0; i < transactions.length; i++) {
      if (
        transactions[i].id === transactionId &&
        transactions[i].status === 'Active'
      ) {
        await this.updateRowStatus(
          spreadsheetId,
          this.SHEET_NAME,
          i + 2,
          'Archived',
        );
      }
    }

    const totalAmount =
      updatedData.amount && updatedData.quantity
        ? Number(updatedData.amount) * Number(updatedData.quantity)
        : 0;

    const newValues: string[][] = [
      [
        transactionId,
        new Date().toISOString(),
        updatedData.name,
        String(updatedData.amount ?? ''),
        String(updatedData.quantity ?? ''),
        updatedData.unit,
        String(totalAmount),
        updatedData.notes || '',
        'Active',
      ],
    ];

    await this.appendRowToSheet(spreadsheetId, this.SHEET_NAME, newValues);
  }

  async deleteById(userEmail: string, transactionId: string): Promise<void> {
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    const transactions = await this.getAll(userEmail, true);
    const index = transactions.findIndex(
      t => t.id === transactionId && t.status === 'Active',
    );
    if (index === -1) throw new Error('Active transaction not found');
    await this.updateRowStatus(
      spreadsheetId,
      this.SHEET_NAME,
      index + 2,
      'Deleted',
    );
  }

  async clearAll(userEmail: string): Promise<void> {
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    await this.clearSheet(spreadsheetId, this.SHEET_NAME);
  }
}
