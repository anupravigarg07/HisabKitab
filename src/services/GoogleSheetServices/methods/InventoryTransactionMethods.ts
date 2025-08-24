// InventoryTransactionMethods.ts
import { GoogleSheetsServiceBaseMethods } from './GoogleSheetsServiceBaseMethods';
import {
  InventoryFormData,
  InventoryTransaction,
} from '../../../types/TransactionTypes';
import { GoogleSheetsResponse } from '../../../types/GoogleSheetTypes';

export class InventoryTransactionMethods extends GoogleSheetsServiceBaseMethods {
  async save(
    userEmail: string,
    sheetName: string,
    inventoryData: InventoryFormData,
  ): Promise<GoogleSheetsResponse> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
      const transactionId = this.generateTransactionId('INV');

      const values = [
        [
          transactionId,
          new Date().toISOString(),
          inventoryData.productName,
          inventoryData.purchasePrice?.toString() || '',
          inventoryData.sellingPrice?.toString() || '',
          inventoryData.quantity.toString(),
          inventoryData.unit || '',
          inventoryData.notes || '',
          'Active',
        ],
      ];

      await this.appendRowToSheet(spreadsheetId, sheetName, values);

      const nextRow = await this.getNextRowNumber(spreadsheetId, sheetName);

      return {
        spreadsheetId,
        tableRange: `${sheetName}!A:I`,
        updates: {
          spreadsheetId,
          updatedCells: values[0].length,
          updatedColumns: values[0].length,
          updatedRows: 1,
          updatedRange: `${sheetName}!A${nextRow - 1}:I${nextRow - 1}`,
        },
      };
    } catch (error) {
      console.error('❌ Error saving inventory transaction:', error);
      throw error;
    }
  }

  async getAll(
    userEmail: string,
    sheetName: string,
    includeHistory: boolean = false,
  ): Promise<InventoryTransaction[]> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
      const values = await this.getSheetData(spreadsheetId, sheetName);

      let transactions: InventoryTransaction[] = values
        .slice(1)
        .map((row: string[]): InventoryTransaction => {
          const purchasePrice = row[3] ? Number(row[3]) : 0;
          const sellingPrice = row[4] ? Number(row[4]) : 0;
          const quantity = row[5] ? Number(row[5]) : 0;

          return {
            id: row[0] || '',
            date: row[1] || '',
            productName: row[2] || '',
            purchasePrice,
            sellingPrice,
            quantity,
            unit: row[6] || '',
            notes: row[7] || '',
            status: row[8] || 'Active',
            totalValue: purchasePrice * quantity,
          };
        });

      if (!includeHistory) {
        transactions = transactions.filter(t => t.status === 'Active');
      }

      return transactions;
    } catch (error) {
      console.error('❌ Error getting inventory transactions:', error);
      throw error;
    }
  }

  async updateById(
    userEmail: string,
    sheetName: string,
    transactionId: string,
    updatedData: InventoryFormData,
  ): Promise<void> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      // Archive existing entry
      await this.archiveExistingActiveEntries(
        spreadsheetId,
        sheetName,
        transactionId,
      );

      // Create updated entry
      const newValues: string[][] = [
        [
          transactionId, // keep same ID
          new Date().toISOString(), // new timestamp
          updatedData.productName,
          updatedData.purchasePrice?.toString() || '',
          updatedData.sellingPrice?.toString() || '',
          updatedData.quantity.toString(),
          updatedData.unit || '',
          updatedData.notes || '',
          'Active',
        ],
      ];

      await this.appendRowToSheet(spreadsheetId, sheetName, newValues);
    } catch (error) {
      console.error('❌ Error updating inventory transaction:', error);
      throw error;
    }
  }

  async deleteById(
    userEmail: string,
    sheetName: string,
    transactionId: string,
  ): Promise<void> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
      const allData = await this.getSheetData(spreadsheetId, sheetName);

      let deleted = false;
      for (let i = 1; i < allData.length; i++) {
        const row = allData[i];
        if (row[0] === transactionId && row[8] === 'Active') {
          await this.updateRowStatus(
            spreadsheetId,
            sheetName,
            i + 1, // actual sheet row
            'Deleted',
            'I',
          );
          deleted = true;
        }
      }

      if (!deleted) {
        throw new Error('Active inventory transaction not found');
      }
    } catch (error) {
      console.error('❌ Error deleting inventory transaction by ID:', error);
      throw error;
    }
  }

  async clearAll(userEmail: string, sheetName: string): Promise<void> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
      await this.clearSheet(spreadsheetId, sheetName);
    } catch (error) {
      console.error('❌ Error clearing inventory sheet:', error);
      throw error;
    }
  }

  // ✅ Legacy method
  async saveInventoryTransaction(
    userEmail: string,
    sheetName: string,
    inventoryData: InventoryFormData,
  ): Promise<GoogleSheetsResponse> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
      const transactionId = `PUR-${Date.now()}`;
      const values = [
        [
          transactionId,
          new Date().toISOString(),
          inventoryData.productName,
          inventoryData.purchasePrice?.toString() || '',
          inventoryData.sellingPrice?.toString() || '',
          inventoryData.quantity.toString(),
          inventoryData.unit || '',
          inventoryData.notes || '',
          'Active',
        ],
      ];

      await this.appendRowToSheet(spreadsheetId, sheetName, values);

      const nextRow = await this.getNextRowNumber(spreadsheetId, sheetName);

      return {
        spreadsheetId,
        tableRange: `${sheetName}!A:D`,
        updates: {
          spreadsheetId,
          updatedCells: 4,
          updatedColumns: 4,
          updatedRows: 1,
          updatedRange: `${sheetName}!A${nextRow - 1}:D${nextRow - 1}`,
        },
      };
    } catch (error) {
      console.error('❌ Error saving inventory transaction (legacy):', error);
      throw error;
    }
  }

  // ✅ Legacy method
  async getInventoryTransactions(
    userEmail: string,
    sheetName: string,
  ): Promise<InventoryTransaction[]> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
      const values = await this.getSheetData(spreadsheetId, sheetName);

      return values.slice(1).map((row: string[]): InventoryTransaction => {
        const purchasePrice = row[3] ? parseFloat(row[3]) : 0;
        const sellingPrice = row[4] ? parseFloat(row[4]) : 0;
        const quantity = row[5] ? parseFloat(row[5]) : 0;

        return {
          id: row[0] || '',
          date: row[1] || '',
          productName: row[2] || '',
          purchasePrice,
          sellingPrice,
          quantity,
          unit: row[6] || '',
          notes: row[7] || '',
          status: row[8] || 'Active',
          totalValue: purchasePrice * quantity,
        };
      });
    } catch (error) {
      console.error(' Error getting inventory transactions (legacy):', error);
      throw error;
    }
  }

  private async archiveExistingActiveEntries(
    spreadsheetId: string,
    sheetName: string,
    transactionId: string,
  ): Promise<void> {
    const allData = await this.getSheetData(spreadsheetId, sheetName);

    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (row[0] === transactionId && row[8] === 'Active') {
        await this.updateRowStatus(
          spreadsheetId,
          sheetName,
          i + 1,
          'Archived',
          'I',
        );
      }
    }
  }

  private async getNextRowNumber(
    spreadsheetId: string,
    sheetName: string,
  ): Promise<number> {
    const values = await this.getSheetData(spreadsheetId, sheetName);
    return values.length + 1;
  }
}
