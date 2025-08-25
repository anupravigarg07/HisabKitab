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
        String(transactionData.sellingPrice ?? ''),
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
  ): Promise<SalesTransaction[]> {
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    const values = await this.getSheetData(spreadsheetId, this.SHEET_NAME);
    if (!values || values.length <= 1) return [];

    let transactions: SalesTransaction[] = values
      .slice(1)
      .map((row: string[]) => ({
        id: row[0] || '',
        date: row[1] || '',
        productName: row[2] || '',
        sellingPrice: Number(row[3]) || 0,
        quantity: Number(row[4]) || 0,
        unit: row[5] || '',
        totalAmount: Number(row[6]) || 0,
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
    updatedData: Partial<SalesTransaction>,
  ): Promise<void> {
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    const rows = await this.getSheetData(spreadsheetId, this.SHEET_NAME);
    const index = rows.findIndex((row: string[]) => row[0] === transactionId);
    if (index === -1) throw new Error('Sales transaction not found');

    const oldRow = rows[index];
    await this.updateRow(spreadsheetId, this.SHEET_NAME, index + 1, [
      ...oldRow.slice(0, 8),
      'Archived',
    ]);

    const newSellingPrice = updatedData.sellingPrice ?? Number(oldRow[3] || 0);
    const newQuantity = updatedData.quantity ?? Number(oldRow[4] || 0);
    const newTotalAmount = newSellingPrice * newQuantity;

    const newRow: string[] = [
      transactionId,
      updatedData.date || oldRow[1],
      updatedData.productName || oldRow[2],
      String(newSellingPrice),
      String(newQuantity),
      updatedData.unit || oldRow[5],
      String(newTotalAmount),
      updatedData.notes || oldRow[7],
      'Active',
    ];

    await this.appendRowToSheet(spreadsheetId, this.SHEET_NAME, [newRow]);
  }

  async deleteById(userEmail: string, transactionId: string): Promise<void> {
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    const transactions = await this.getAll(userEmail, true);
    const index = transactions.findIndex(
      t => t.id === transactionId && t.status === 'Active',
    );
    if (index === -1) throw new Error('Active sales transaction not found');
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
