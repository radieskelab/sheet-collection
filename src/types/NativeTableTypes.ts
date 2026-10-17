export type NativeTableGridRange = {
  sheetId: number;
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
};

export type NativeTableApiTable = {
  tableId: string;
  name: string;
  range: NativeTableGridRange;
};

export type NativeTableApiSheet = {
  properties?: {
    sheetId?: number;
    title?: string;
  };
  tables?: NativeTableApiTable[];
};

export type NativeTableSpreadsheetMetadata = {
  sheets?: NativeTableApiSheet[];
};

export type NativeTableAddResponse = {
  replies?: Array<{
    addTable?: {
      table?: NativeTableApiTable;
    };
  }>;
};

export type NativeTableApiRequest = {
  addTable?: { table: Record<string, unknown> };
  updateTable?: {
    table: Record<string, unknown>;
    fields: string;
  };
  deleteTable?: { tableId: string };
};
