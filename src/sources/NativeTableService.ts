import { TableOptions } from '../interfaces/CollectionOptions';

interface GridRange {
  sheetId: number;
  startRowIndex: number;
  endRowIndex: number;
  startColumnIndex: number;
  endColumnIndex: number;
}

interface NativeTable {
  tableId: string;
  name: string;
  range: GridRange;
}

interface NativeSheet {
  properties?: {
    sheetId?: number;
    title?: string;
  };
  tables?: NativeTable[];
}

interface SpreadsheetMetadata {
  sheets?: NativeSheet[];
}

interface AddTableResponse {
  replies?: Array<{
    addTable?: {
      table?: NativeTable;
    };
  }>;
}

interface NativeTableRequest {
  addTable?: { table: Record<string, unknown> };
  appendCells?: {
    tableId: string;
    rows: Array<{ values: Array<{ userEnteredValue?: Record<string, unknown> }> }>;
    fields: string;
  };
  updateTable?: {
    table: Record<string, unknown>;
    fields: string;
  };
  deleteTable?: { tableId: string };
}

interface NativeSheetsService {
  Spreadsheets: {
    get(
      spreadsheetId: string,
      options: { fields: string }
    ): SpreadsheetMetadata;
    batchUpdate(
      request: { requests: NativeTableRequest[] },
      spreadsheetId: string
    ): AddTableResponse;
  };
}

export interface NativeTableState {
  tableId: string;
  name: string;
  range: GridRange;
}

const DEFAULT_PRESET = {
  headerColor: '#3C78D8',
  firstBandColor: '#FFFFFF',
  secondBandColor: '#EAF2F8'
};

export class NativeTableService {
  private readonly service: NativeSheetsService;
  private table: NativeTableState | null | undefined;
  private readonly name: string;
  private readonly rowColors: {
    headerColor: string;
    firstBandColor: string;
    secondBandColor: string;
  };

  constructor(
    private readonly spreadsheetId: string,
    private readonly sheetId: number,
    collectionName: string,
    options: TableOptions,
    private readonly timeZone = 'UTC',
    service?: NativeSheetsService
  ) {
    if (options.preset !== undefined && options.preset !== 'default') {
      throw new Error(`Preset de tabela '${options.preset}' não é suportado.`);
    }

    const globalService = (globalThis as typeof globalThis & {
      Sheets?: NativeSheetsService;
    }).Sheets;
    this.service = service ?? globalService ?? this.missingService();
    this.name = options.name ?? this.createDefaultName(collectionName);
    this.rowColors = {
      headerColor: options.headerColor ?? DEFAULT_PRESET.headerColor,
      firstBandColor: options.firstBandColor ?? DEFAULT_PRESET.firstBandColor,
      secondBandColor: options.secondBandColor ?? DEFAULT_PRESET.secondBandColor
    };

    Object.values(this.rowColors).forEach(color => this.validateColor(color));
  }

  findTable(refresh = false): NativeTableState | null {
    if (!refresh && this.table !== undefined) {
      return this.table;
    }

    const metadata = this.service.Spreadsheets.get(this.spreadsheetId, {
      fields: 'sheets(properties(sheetId,title),tables(tableId,name,range))'
    });
    const sheet = metadata.sheets?.find(
      candidate => candidate.properties?.sheetId === this.sheetId
    );
    const table = sheet?.tables?.find(candidate => candidate.name === this.name);

    if (table) {
      this.table = {
        tableId: table.tableId,
        name: table.name,
        range: table.range
      };
      return this.table;
    }

    const conflictingTable = sheet?.tables?.[0];

    if (conflictingTable) {
      throw new Error(
        `A aba já contém a tabela nativa '${conflictingTable.name}', ` +
        `mas a coleção espera '${this.name}'.`
      );
    }

    this.table = null;
    return null;
  }

  createTable(values: unknown[][]): NativeTableState {
    const headers = this.validateValues(values);

    const range: GridRange = {
      sheetId: this.sheetId,
      startRowIndex: 0,
      endRowIndex: values.length,
      startColumnIndex: 0,
      endColumnIndex: headers.length
    };
    const response = this.service.Spreadsheets.batchUpdate({
      requests: [{
        addTable: {
          table: {
            name: this.name,
            range,
            columnProperties: headers.map((columnName, columnIndex) => ({
              columnName,
              columnIndex
            })),
            rowsProperties: {
              headerColorStyle: this.toColorStyle(this.rowColors.headerColor),
              firstBandColorStyle: this.toColorStyle(this.rowColors.firstBandColor),
              secondBandColorStyle: this.toColorStyle(this.rowColors.secondBandColor)
            }
          }
        }
      }]
    }, this.spreadsheetId);
    const created = response.replies?.[0]?.addTable?.table;

    if (!created?.tableId) {
      throw new Error('A Sheets API não retornou o identificador da tabela criada.');
    }

    this.table = {
      tableId: created.tableId,
      name: created.name || this.name,
      range: created.range || range
    };

    return this.table;
  }

  validateValues(values: unknown[][]): string[] {
    const headers = values[0]?.map(String) ?? [];
    this.validateHeaders(headers);
    return headers;
  }

  appendRows(table: NativeTableState, rows: unknown[][]): void {
    if (rows.length === 0) {
      return;
    }

    this.service.Spreadsheets.batchUpdate({
      requests: [{
        appendCells: {
          tableId: table.tableId,
          rows: rows.map(row => ({
            values: row.map(value => this.toCellData(value))
          })),
          fields: 'userEnteredValue,userEnteredFormat.numberFormat'
        }
      }]
    }, this.spreadsheetId);
    this.table = {
      ...table,
      range: {
        ...table.range,
        endRowIndex: table.range.endRowIndex + rows.length
      }
    };
  }

  resizeTable(table: NativeTableState, values: unknown[][]): void {
    const headers = values[0]?.map(String) ?? [];
    this.validateHeaders(headers);

    const range: GridRange = {
      ...table.range,
      endRowIndex: table.range.startRowIndex + values.length,
      endColumnIndex: table.range.startColumnIndex + headers.length
    };
    this.service.Spreadsheets.batchUpdate({
      requests: [{
        updateTable: {
          table: {
            tableId: table.tableId,
            range,
            columnProperties: headers.map((columnName, columnIndex) => ({
              columnName,
              columnIndex
            }))
          },
          fields: 'range,columnProperties'
        }
      }]
    }, this.spreadsheetId);

    this.table = { ...table, range };
  }

  deleteTable(table: NativeTableState): void {
    this.service.Spreadsheets.batchUpdate({
      requests: [{ deleteTable: { tableId: table.tableId } }]
    }, this.spreadsheetId);
    this.table = null;
  }

  private validateHeaders(headers: string[]): void {
    if (headers.length === 0 || headers.some(header => header.trim() === '')) {
      throw new Error('Os cabeçalhos da tabela não podem ser vazios.');
    }
    if (new Set(headers).size !== headers.length) {
      throw new Error('Os cabeçalhos da tabela devem ser únicos.');
    }
  }

  private validateColor(color: string): void {
    if (!/^#[0-9a-f]{6}$/i.test(color)) {
      throw new Error(`Cor de preset inválida '${color}'. Use o formato hexadecimal #RRGGBB.`);
    }
  }

  private toColorStyle(color: string): Record<string, unknown> {
    const normalized = color.slice(1);
    return {
      rgbColor: {
        red: parseInt(normalized.slice(0, 2), 16) / 255,
        green: parseInt(normalized.slice(2, 4), 16) / 255,
        blue: parseInt(normalized.slice(4, 6), 16) / 255
      }
    };
  }

  private toExtendedValue(value: unknown): Record<string, unknown> | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (value instanceof Date) {
      const localDate = this.timeZone === 'UTC'
        ? value.toISOString()
        : Utilities.formatDate(value, this.timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSS");
      const utcDate = Date.parse(`${localDate.replace(/Z$/, '')}Z`);
      return { numberValue: utcDate / 86400000 + 25569 };
    }

    if (typeof value === 'string') {
      return value.startsWith('=')
        ? { formulaValue: value }
        : { stringValue: value };
    }
    if (typeof value === 'number') {
      return { numberValue: value };
    }
    if (typeof value === 'boolean') {
      return { boolValue: value };
    }

    throw new Error(
      'Valores de tabela devem ser string, number, boolean, Date, null ou undefined.'
    );
  }

  private toCellData(value: unknown): {
    userEnteredValue?: Record<string, unknown>;
    userEnteredFormat?: Record<string, unknown>;
  } {
    const userEnteredValue = this.toExtendedValue(value);
    if (value instanceof Date) {
      return {
        userEnteredValue,
        userEnteredFormat: {
          numberFormat: { type: 'DATE_TIME' }
        }
      };
    }
    return { userEnteredValue };
  }

  private createDefaultName(collectionName: string): string {
    const safeName = collectionName
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^[^a-zA-Z_]+/, '');
    return `SheetCollection_${safeName || 'Table'}`;
  }

  private missingService(): never {
    throw new Error(
      'O Advanced Sheets service não está disponível. Habilite o serviço avançado "Sheets API" no projeto Apps Script.'
    );
  }
}
