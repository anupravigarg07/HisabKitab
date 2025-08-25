import { GoogleSheetsServiceBaseMethods } from './GoogleSheetsServiceBaseMethods';
import {
  InventoryFormData,
  InventoryTransaction,
} from '../../../types/TransactionTypes';
import { GoogleSheetsResponse } from '../../../types/GoogleSheetTypes';
import { SHEET_CONFIGS } from '../../../utils/constants';

export interface CalculatedInventoryItem extends InventoryTransaction {
  availableQuantity: number;
  totalPurchaseValue: number;
  totalSalesValue: number;
  averagePurchasePrice: number;
  lastPurchaseDate?: string;
  lastSaleDate?: string;
}

export class InventoryTransactionMethods extends GoogleSheetsServiceBaseMethods {
  async save(
    userEmail: string,
    sheetName: string,
    inventoryData: InventoryFormData,
  ): Promise<GoogleSheetsResponse> {
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    const transactionId = `INV-${Date.now()}`;
    const values: string[][] = [
      [
        transactionId,
        new Date().toISOString(),
        inventoryData.productName,
        String(inventoryData.purchasePrice ?? 0),
        String(inventoryData.sellingPrice ?? 0),
        String(inventoryData.quantity),
        inventoryData.unit || '',
        inventoryData.notes || '',
        'Active',
      ],
    ];

    return await this.appendRowToSheet(spreadsheetId, sheetName, values);
  }

  async getAll(
    userEmail: string,
    sheetName: string,
    includeHistory: boolean = false,
  ): Promise<InventoryTransaction[]> {
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    const values = await this.getSheetData(spreadsheetId, sheetName);
    if (!values || values.length <= 1) return [];

    let transactions: InventoryTransaction[] = values
      .slice(1)
      .map((row: string[]) => ({
        id: row[0] || '',
        date: row[1] || '',
        productName: row[2] || '',
        purchasePrice: Number(row[3]) || 0,
        sellingPrice: Number(row[4]) || 0,
        quantity: Number(row[5]) || 0,
        unit: row[6] || '',
        notes: row[7] || '',
        status: row[8] || 'Active',
        totalValue: Number(row[3]) * Number(row[5]),
      }));

    if (!includeHistory)
      transactions = transactions.filter(t => t.status === 'Active');
    return transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  async updateById(
    userEmail: string,
    sheetName: string,
    transactionId: string,
    updatedData: InventoryFormData,
  ): Promise<void> {
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    await this.archiveExistingActiveEntries(
      spreadsheetId,
      sheetName,
      transactionId,
    );

    const newValues: string[][] = [
      [
        transactionId,
        new Date().toISOString(),
        updatedData.productName,
        String(updatedData.purchasePrice ?? 0),
        String(updatedData.sellingPrice ?? 0),
        String(updatedData.quantity),
        updatedData.unit || '',
        updatedData.notes || '',
        'Active',
      ],
    ];

    await this.appendRowToSheet(spreadsheetId, sheetName, newValues);
  }

  async deleteById(
    userEmail: string,
    sheetName: string,
    transactionId: string,
  ): Promise<void> {
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    const allData = await this.getSheetData(spreadsheetId, sheetName);
    if (!allData || allData.length <= 1) throw new Error('No data found');

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === transactionId && allData[i][8] === 'Active') {
        await this.updateRowStatus(
          spreadsheetId,
          sheetName,
          i + 1,
          'Deleted',
          'I',
        );
        return;
      }
    }

    throw new Error('Active inventory transaction not found');
  }

  async clearAll(userEmail: string, sheetName: string): Promise<void> {
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);
    await this.clearSheet(spreadsheetId, sheetName);
  }

  private async archiveExistingActiveEntries(
    spreadsheetId: string,
    sheetName: string,
    transactionId: string,
  ) {
    const allData = await this.getSheetData(spreadsheetId, sheetName);
    if (!allData || allData.length <= 1) return;

    for (let i = 1; i < allData.length; i++) {
      if (allData[i][0] === transactionId && allData[i][8] === 'Active') {
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

  // Inside InventoryTransactionMethods class

  // 1️⃣ Calculate current inventory
  // Inside InventoryTransactionMethods class
  async calculateCurrentInventory(
    userEmail: string,
  ): Promise<CalculatedInventoryItem[]> {
    try {
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      // ✅ Use correct sheet names from SHEET_CONFIGS
      const [purchaseValues, salesValues] = await Promise.all([
        this.getSheetData(
          spreadsheetId,
          SHEET_CONFIGS['purchase details'].name,
        ).catch(() => []),
        this.getSheetData(spreadsheetId, SHEET_CONFIGS.sales.name).catch(
          () => [],
        ),
      ]);

      const inventoryMap = new Map<string, CalculatedInventoryItem>();

      // -------------------
      // Process Purchases
      // -------------------
      purchaseValues?.slice(1).forEach((row: string[]) => {
        if (row[0] && row[8] === 'Active') {
          const productName = row[2] || '';
          const purchasePrice = Number(row[3]) || 0;
          const quantity = Number(row[4]) || 0; // ✅ fixed index
          const unit = row[5] || '';
          const totalAmount = Number(row[6]) || purchasePrice * quantity;
          const date = row[1] || '';

          const key = `${productName}_${unit}`;
          const existing = inventoryMap.get(key);

          if (existing) {
            existing.availableQuantity += quantity;
            existing.totalPurchaseValue += totalAmount;
            existing.averagePurchasePrice =
              existing.totalPurchaseValue / existing.availableQuantity;
            if (
              !existing.lastPurchaseDate ||
              date > existing.lastPurchaseDate
            ) {
              existing.lastPurchaseDate = date;
              existing.date = date;
            }
          } else {
            inventoryMap.set(key, {
              id: `INV_${key}`,
              date,
              productName,
              quantity,
              availableQuantity: quantity,
              unit,
              purchasePrice,
              sellingPrice: 0,
              totalValue: totalAmount,
              totalPurchaseValue: totalAmount,
              totalSalesValue: 0,
              averagePurchasePrice: purchasePrice,
              notes: row[7] || '',
              status: 'Active',
              lastPurchaseDate: date,
            });
          }
        }
      });

      // -------------------
      // Process Sales
      // -------------------
      salesValues?.slice(1).forEach((row: string[]) => {
        if (row[0] && row[8] === 'Active') {
          const productName = row[2] || '';
          const sellingPrice = Number(row[3]) || 0; // ✅ fixed index
          const quantity = Number(row[4]) || 0; // ✅ fixed index
          const unit = row[5] || ''; // ✅ fixed index
          const totalAmount = Number(row[6]) || sellingPrice * quantity;
          const date = row[1] || '';

          const key = `${productName}_${unit}`;
          const existing = inventoryMap.get(key);

          if (existing) {
            existing.availableQuantity = Math.max(
              0,
              existing.availableQuantity - quantity,
            );
            existing.totalSalesValue += totalAmount;
            existing.sellingPrice = sellingPrice;
            if (!existing.lastSaleDate || date > existing.lastSaleDate) {
              existing.lastSaleDate = date;
              existing.date = date;
            }
          } else {
            // Sales without purchase: show as negative stock
            inventoryMap.set(key, {
              id: `INV_${key}`,
              date,
              productName,
              quantity: -quantity,
              availableQuantity: -quantity,
              unit,
              purchasePrice: 0,
              sellingPrice,
              totalValue: 0,
              totalPurchaseValue: 0,
              totalSalesValue: totalAmount,
              averagePurchasePrice: 0,
              notes: row[7] || '',
              status: 'Active',
              lastSaleDate: date,
            });
          }
        }
      });

      // Return sorted array (latest first)
      return Array.from(inventoryMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } catch (error) {
      console.error('❌ Error calculating current inventory:', error);
      return [];
    }
  }

  async getInventorySummary(userEmail: string) {
    const inventory = await this.calculateCurrentInventory(userEmail);
    return {
      totalItems: inventory.length,
      totalValue: inventory.reduce(
        (sum, item) => sum + item.totalPurchaseValue,
        0,
      ),
      lowStockItems: inventory.filter(
        i => i.availableQuantity > 0 && i.availableQuantity <= 5,
      ).length,
      outOfStockItems: inventory.filter(i => i.availableQuantity <= 0).length,
    };
  }

  // 3️⃣ Search inventory
  async searchInventory(userEmail: string, searchTerm: string) {
    const inventory = await this.calculateCurrentInventory(userEmail);
    const term = searchTerm.toLowerCase();
    return inventory.filter(
      i =>
        i.productName.toLowerCase().includes(term) ||
        i.unit.toLowerCase().includes(term) ||
        (i.notes && i.notes.toLowerCase().includes(term)),
    );
  }
}
