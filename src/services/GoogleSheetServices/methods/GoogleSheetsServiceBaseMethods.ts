import { GOOGLE_APIS, SHEET_CONFIGS } from '../../../utils/constants';
import GoogleSignInService from '../../GoogleSignInService/GoogleSignInService';
import {
  GoogleSpreadsheet,
  GoogleDriveFile,
  GoogleDriveSearchResponse,
} from '../../../types/GoogleSheetTypes';

export abstract class GoogleSheetsServiceBaseMethods {
  protected async getAccessToken(): Promise<string> {
    return await GoogleSignInService.getAccessToken();
  }

  protected generateTransactionId(prefix: string = 'TXN'): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${randomStr}`.toUpperCase();
  }

  protected async createOrGetUserSpreadsheet(
    userEmail: string,
  ): Promise<string> {
    try {
      const accessToken = await this.getAccessToken();
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

  protected async updateRowStatus(
    spreadsheetId: string,
    sheetName: string,
    rowNumber: number,
    status: string,
    statusColumnIndex: string = 'I',
  ): Promise<void> {
    const accessToken = await this.getAccessToken();
    const encodedSheetName = encodeURIComponent(sheetName);
    const statusRange = `${encodedSheetName}!${statusColumnIndex}${rowNumber}`;

    const response = await fetch(
      `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${statusRange}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [[status]] }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }
  }

  protected async appendRowToSheet(
    spreadsheetId: string,
    sheetName: string,
    values: string[][],
  ): Promise<any> {
    const accessToken = await this.getAccessToken();
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
  }

  protected async getSheetData(
    spreadsheetId: string,
    sheetName: string,
    range?: string,
  ): Promise<string[][]> {
    const accessToken = await this.getAccessToken();
    const encodedSheetName = encodeURIComponent(sheetName);
    const fullRange = range ? `${encodedSheetName}!${range}` : encodedSheetName;

    const response = await fetch(
      `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${fullRange}`,
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
    return result.values || [];
  }

  protected async updateRow(
    spreadsheetId: string,
    sheetName: string,
    rowNumber: number,
    values: string[],
    range?: string,
  ): Promise<void> {
    const accessToken = await this.getAccessToken();
    const encodedSheetName = encodeURIComponent(sheetName);
    const cellRange = range || `A${rowNumber}:I${rowNumber}`;
    const fullRange = `${encodedSheetName}!${cellRange}`;

    const response = await fetch(
      `${GOOGLE_APIS.SHEETS_BASE_URL}/${spreadsheetId}/values/${fullRange}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: [values] }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }
  }

  protected async clearSheet(
    spreadsheetId: string,
    sheetName: string,
  ): Promise<void> {
    const accessToken = await this.getAccessToken();
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
  }
}
