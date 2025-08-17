import { GOOGLE_APIS, SHEET_CONFIGS } from '../utils/constants';
import GoogleSignInService from './GoogleSignInService';
import {
  GoogleSpreadsheet,
  GoogleDriveFile,
  GoogleDriveSearchResponse,
  GoogleSheetsResponse,
} from '../types/googletypes';
import {
  TransactionFormData,
  SalesTransactionFormData,
  InventoryFormData,
  PurchaseTransaction,
  SalesTransaction,
  InventoryTransaction,
  SavedTransaction, // Keep for backward compatibility
} from '../types/transactionstypes';

class GoogleSheetsService {
  // Generate unique ID for transactions
  private generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `PUR_${timestamp}_${randomStr}`.toUpperCase();
  }

  async createOrGetUserSpreadsheet(userEmail: string): Promise<string> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetName = `TransactionData_${userEmail}`;

      const existingSpreadsheet = await this.findSpreadsheet(
        accessToken,
        spreadsheetName,
      );

      if (existingSpreadsheet) {
        return existingSpreadsheet.id;
      }

      const newSpreadsheet = await this.createSpreadsheet(
        accessToken,
        spreadsheetName,
      );

      await this.setupInitialSheets(accessToken, newSpreadsheet.spreadsheetId);

      return newSpreadsheet.spreadsheetId;
    } catch (error) {
      console.error('Error creating/getting spreadsheet:', error);
      throw error;
    }
  }

  private async findSpreadsheet(
    accessToken: string,
    name: string,
  ): Promise<GoogleDriveFile | null> {
    try {
      const encodedQuery = encodeURIComponent(
        `name='${name}' and mimeType='application/vnd.google-apps.spreadsheet'`,
      );

      const response = await fetch(
        `${GOOGLE_APIS.DRIVE_BASE_URL}/files?q=${encodedQuery}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GoogleDriveSearchResponse = await response.json();
      return result.files && result.files.length > 0 ? result.files[0] : null;
    } catch (error) {
      console.error('Error finding spreadsheet:', error);
      throw error;
    }
  }

  private async createSpreadsheet(
    accessToken: string,
    title: string,
  ): Promise<GoogleSpreadsheet> {
    try {
      const response = await fetch(`${GOOGLE_APIS.SHEETS_BASE_URL}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: { title },
          sheets: Object.values(SHEET_CONFIGS).map(config => ({
            properties: { title: config.name },
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  private async setupInitialSheets(
    accessToken: string,
    spreadsheetId: string,
  ): Promise<void> {
    for (const config of Object.values(SHEET_CONFIGS)) {
      await this.addHeaders(
        accessToken,
        spreadsheetId,
        config.name,
        config.headers,
      );
    }
  }

  private async addHeaders(
    accessToken: string,
    spreadsheetId: string,
    sheetName: string,
    headers: string[],
  ): Promise<void> {
    try {
      const range = `${sheetName}!A1:${String.fromCharCode(
        64 + headers.length,
      )}1`;

      const response = await fetch(
        `${
          GOOGLE_APIS.SHEETS_BASE_URL
        }/${spreadsheetId}/values/${encodeURIComponent(
          range,
        )}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [headers],
          }),
        },
      );

      if (!response.ok) {
        console.error(
          `Failed to add headers for ${sheetName}:`,
          response.status,
        );
      }
    } catch (error) {
      console.error('Error adding headers:', error);
    }
  }

  // Purchase Methods
  async savePurchaseTransaction(
    userEmail: string,
    transactionData: TransactionFormData,
  ): Promise<GoogleSheetsResponse> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      // Generate unique ID for this transaction
      const transactionId = this.generateTransactionId();

      const values = [
        [
          transactionId, // Auto-generated ID
          new Date().toISOString(), // Date
          transactionData.name, // Product Name
          transactionData.amount, // Purchasing Price
          transactionData.quantity, // Quantity
          transactionData.unit, // Unit
          transactionData.notes || '', // Notes (optional)
          'Active', // Status
        ],
      ];

      const encodedSheetName = encodeURIComponent('purchase details');
      const response = await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${encodedSheetName}:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving purchase transaction:', error);
      throw error;
    }
  }

  async getPurchaseTransactions(
    userEmail: string,
    includeHistory: boolean = false, // default = only Active
  ): Promise<PurchaseTransaction[]> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      const encodedSheetName = encodeURIComponent('purchase details');
      const response = await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${encodedSheetName}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const result = await response.json();
      const values = result.values || [];

      // Format: [id, date, name, amount, quantity, unit, notes, status]
      let transactions: PurchaseTransaction[] = values.slice(1).map(
        (row: string[]): PurchaseTransaction => ({
          id: row[0] || '',
          date: row[1] || '',
          name: row[2] || '',
          amount: row[3] || '',
          quantity: row[4] || '',
          unit: row[5] || '',
          notes: row[6] || '',
          status: row[7] || 'Active', // default to Active if not present
        }),
      );

      // ✅ Filter out archived unless explicitly requested
      if (!includeHistory) {
        transactions = transactions.filter(t => t.status === 'Active');
      }

      return transactions;
    } catch (error) {
      console.error('Error getting purchase transactions:', error);
      throw error;
    }
  }

  // Sales Methods (unchanged)
  async saveSalesTransaction(
    userEmail: string,
    transactionData: SalesTransactionFormData,
  ): Promise<GoogleSheetsResponse> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      // Generate a unique ID (timestamp-based for simplicity)
      const transactionId = `SALE-${Date.now()}`;

      const values = [
        [
          transactionId, // ID
          new Date().toISOString(), // Date
          transactionData.productName, // Product Name
          transactionData.sellingPrice, // Selling Price
          transactionData.quantity, // Quantity
          transactionData.unit, // Unit
          transactionData.notes || '', // Notes
          'Active', // Status (default active)
        ],
      ];

      const encodedSheetName = encodeURIComponent('sales');
      const response = await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${encodedSheetName}:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving sales transaction:', error);
      throw error;
    }
  }

  async getSalesTransactions(
    userEmail: string,
    includeHistory: boolean = false, // default = only Active
  ): Promise<SalesTransaction[]> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      const encodedSheetName = encodeURIComponent('sales');
      const response = await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${encodedSheetName}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const result = await response.json();
      const values = result.values || [];

      // Format: [id, date, productName, sellingPrice, quantity, unit, notes, status]
      let transactions: SalesTransaction[] = values.slice(1).map(
        (row: string[]): SalesTransaction => ({
          id: row[0] || '',
          date: row[1] || '',
          productName: row[2] || '',
          sellingPrice: row[3] || '',
          quantity: row[4] || '',
          unit: row[5] || '',
          notes: row[6] || '',
          status: row[7] || 'Active', // default to Active if not present
        }),
      );

      // ✅ Filter out archived/deleted unless explicitly requested
      if (!includeHistory) {
        transactions = transactions.filter(t => t.status === 'Active');
      }

      return transactions;
    } catch (error) {
      console.error('Error getting sales transactions:', error);
      throw error;
    }
  }

  // --- Update a Sales Transaction by ID ---
  async updateSalesTransactionById(
    userEmail: string,
    id: string,
    transactionData: Partial<SalesTransaction>,
  ): Promise<void> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      const encodedSheetName = encodeURIComponent('sales');
      const response = await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${encodedSheetName}!A:H`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch sales for update`);
      }

      const result = await response.json();
      const rows = result.values || [];
      const rowIndex = rows.findIndex((row: string[]) => row[0] === id);

      if (rowIndex === -1) {
        throw new Error(`Sales transaction with ID ${id} not found`);
      }

      // --- Step 1: Mark old row as Archived ---
      const oldRow = rows[rowIndex];
      const archivedRow = [...oldRow];
      archivedRow[7] = 'Archived'; // set status = Archived

      await fetch(
        `${
          GOOGLE_APIS.SHEETS_BASE_URL
        }/${spreadsheetId}/values/${encodedSheetName}!A${rowIndex + 1}:H${
          rowIndex + 1
        }?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [archivedRow] }),
        },
      );

      // --- Step 2: Append new Active row with updated values ---
      const newRow = [
        id, // keep same ID for traceability
        transactionData.date || oldRow[1],
        transactionData.productName || oldRow[2],
        transactionData.sellingPrice || oldRow[3],
        transactionData.quantity || oldRow[4],
        transactionData.unit || oldRow[5],
        transactionData.notes || oldRow[6],
        'Active', // new entry should always be Active
      ];

      await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${encodedSheetName}!A:H:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [newRow] }),
        },
      );
    } catch (error) {
      console.error('Error updating sales transaction:', error);
      throw error;
    }
  }

  // --- Delete (archive) a Sales Transaction ---
  async deleteSalesTransactionById(
    userEmail: string,
    transactionId: string,
  ): Promise<void> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      // Get all transactions including history
      const transactions = await this.getSalesTransactions(userEmail, true);

      // Find the ACTIVE row with this transactionId
      const activeTransactionIndex = transactions.findIndex(
        t => t.id === transactionId && t.status === 'Active',
      );

      if (activeTransactionIndex === -1) {
        throw new Error('Active sales transaction not found');
      }

      const encodedSheetName = encodeURIComponent('sales');
      const rowNumber = activeTransactionIndex + 2; // +2 because sheet has headers

      // Update Status column H to "Deleted"
      const statusRange = `${encodedSheetName}!H${rowNumber}`;
      const response = await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${statusRange}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [['Deleted']] }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }
    } catch (error) {
      console.error('Error deleting sales transaction by ID:', error);
      throw error;
    }
  }

  // Inventory Methods (unchanged)
  async saveInventoryTransaction(
    userEmail: string,
    sheetName: string,
    inventoryData: InventoryFormData,
  ): Promise<GoogleSheetsResponse> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      const values = [
        [
          new Date().toISOString(),
          inventoryData.name, // Product Name
          inventoryData.sellingPrice, // Selling Price
          inventoryData.quantity, // Quantity
        ],
      ];

      const encodedSheetName = encodeURIComponent(sheetName);
      const response = await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${encodedSheetName}:append?valueInputOption=RAW`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving inventory transaction:', error);
      throw error;
    }
  }

  async getInventoryTransactions(
    userEmail: string,
    sheetName: string,
  ): Promise<InventoryTransaction[]> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      const encodedSheetName = encodeURIComponent(sheetName);
      const response = await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${encodedSheetName}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const result = await response.json();
      const values = result.values || [];

      // Format: [date, name, sellingPrice, quantity]
      return values.slice(1).map(
        (row: string[]): InventoryTransaction => ({
          date: row[0] || '',
          name: row[1] || '', // Product Name
          sellingPrice: row[2] || '', // Selling Price
          quantity: row[3] || '', // Quantity
        }),
      );
    } catch (error) {
      console.error('Error getting inventory transactions:', error);
      throw error;
    }
  }

  // Legacy Methods (updated for backward compatibility)
  async saveTransaction(
    userEmail: string,
    transactionData: TransactionFormData,
  ): Promise<GoogleSheetsResponse> {
    // Redirect to new purchase method
    return this.savePurchaseTransaction(userEmail, transactionData);
  }

  async getTransactions(
    userEmail: string,
    sheetName: string = 'purchase details',
  ): Promise<SavedTransaction[]> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      const encodedSheetName = encodeURIComponent(sheetName);
      const response = await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${encodedSheetName}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const result = await response.json();
      const values = result.values || [];

      // Handle both old format (without ID) and new format (with ID)
      return values.slice(1).map((row: string[]): SavedTransaction => {
        if (row.length >= 6) {
          // New format: [id, date, name, number, amount, message]
          return {
            id: row[0] || '',
            date: row[1] || '',
            name: row[2] || '',
            number: row[3] || '',
            amount: row[4] || '',
            message: row[5] || '',
          };
        } else {
          // Old format: [date, name, number, amount, message]
          return {
            id: `LEGACY_${Date.now()}_${Math.random()
              .toString(36)
              .substring(2, 8)}`, // Generate ID for legacy data
            date: row[0] || '',
            name: row[1] || '',
            number: row[2] || '',
            amount: row[3] || '',
            message: row[4] || '',
          };
        }
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }
  // Method to update purchase transaction by ID
  async updatePurchaseTransactionById(
    userEmail: string,
    transactionId: string,
    updatedData: TransactionFormData,
  ): Promise<void> {
    const accessToken = await GoogleSignInService.getAccessToken();
    const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

    // 1. Get all transactions
    const transactions = await this.getPurchaseTransactions(userEmail, true); // include history

    // 2. Archive all rows with this transactionId
    const encodedSheetName = encodeURIComponent('purchase details');

    for (let i = 0; i < transactions.length; i++) {
      if (
        transactions[i].id === transactionId &&
        transactions[i].status === 'Active'
      ) {
        const archiveRange = `${encodedSheetName}!H${i + 2}`; // Status column H
        await fetch(
          `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${archiveRange}?valueInputOption=RAW`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [['Archived']] }),
          },
        );
      }
    }

    // 3. Append new updated row (Active)
    const newValues = [
      [
        transactionId,
        new Date().toISOString(),
        updatedData.name,
        updatedData.amount,
        updatedData.quantity,
        updatedData.unit,
        updatedData.notes || '',
        'Active',
      ],
    ];

    await fetch(
      `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${encodedSheetName}:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: newValues }),
      },
    );
  }

  // Method to delete purchase transaction by ID
  // Method to "delete" a purchase transaction by marking its status as Deleted
  async deletePurchaseTransactionById(
    userEmail: string,
    transactionId: string,
  ): Promise<void> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      // Get all transactions including history
      const transactions = await this.getPurchaseTransactions(userEmail, true);

      // Find the ACTIVE row with this transactionId
      const activeTransactionIndex = transactions.findIndex(
        t => t.id === transactionId && t.status === 'Active',
      );

      if (activeTransactionIndex === -1) {
        throw new Error('Active transaction not found');
      }

      const encodedSheetName = encodeURIComponent('purchase details');
      const rowNumber = activeTransactionIndex + 2; // +2 because sheet has headers

      // Update Status column H to "Deleted"
      const statusRange = `${encodedSheetName}!H${rowNumber}`;
      const response = await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${statusRange}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [['Deleted']] }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }
    } catch (error) {
      console.error('Error deleting purchase transaction by ID:', error);
      throw error;
    }
  }

  async deleteTransaction(
    userEmail: string,
    rowIndex: number,
    sheetName: string = 'purchase details',
  ): Promise<void> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      const response = await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: 0,
                    dimension: 'ROWS',
                    startIndex: rowIndex,
                    endIndex: rowIndex + 1,
                  },
                },
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  async clearSheet(
    userEmail: string,
    sheetName: string = 'purchase details',
  ): Promise<void> {
    try {
      const accessToken = await GoogleSignInService.getAccessToken();
      const spreadsheetId = await this.createOrGetUserSpreadsheet(userEmail);

      const encodedSheetName = encodeURIComponent(sheetName);
      const response = await fetch(
        `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${encodedSheetName}!A2:Z:clear`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }
    } catch (error) {
      console.error('Error clearing sheet:', error);
      throw error;
    }
  }
}

export default new GoogleSheetsService();
