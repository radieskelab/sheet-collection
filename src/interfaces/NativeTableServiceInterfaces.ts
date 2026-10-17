import {
  NativeTableAddResponse,
  NativeTableApiRequest,
  NativeTableGridRange,
  NativeTableSpreadsheetMetadata
} from "../types/NativeTableTypes";

export interface NativeSheetsService {
  Spreadsheets: {
    get(
      spreadsheetId: string,
      options: { fields: string }
    ): NativeTableSpreadsheetMetadata;
    batchUpdate(
      request: { requests: NativeTableApiRequest[] },
      spreadsheetId: string
    ): NativeTableAddResponse;
  };
}

export interface NativeTableState {
  tableId: string;
  name: string;
  range: NativeTableGridRange;
}
