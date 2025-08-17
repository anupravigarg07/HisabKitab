export interface GoogleSpreadsheet {
  spreadsheetId: string;
  properties: {
    title: string;
    locale: string;
    autoRecalc: string;
    timeZone: string;
  };
  sheets: GoogleSheet[];
}

export interface GoogleSheet {
  properties: {
    sheetId: number;
    title: string;
    index: number;
    sheetType: string;
  };
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
}

export interface GoogleDriveSearchResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

export interface GoogleSheetsResponse {
  spreadsheetId: string;
  tableRange: string;
  updates: {
    spreadsheetId: string;
    updatedCells: number;
    updatedColumns: number;
    updatedRows: number;
    updatedRange: string;
  };
}
