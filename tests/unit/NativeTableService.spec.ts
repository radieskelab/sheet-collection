import { afterEach, describe, expect, it, vi } from 'vitest';
import { NativeTableService } from '../../src/sources/NativeTableService';

function createServiceMock(tables: Array<Record<string, unknown>> = []) {
  const batchUpdate = vi.fn((request: { requests: Array<Record<string, unknown>> }) => {
    const addTable = request.requests[0].addTable as {
      table: { name: string; range: Record<string, number> };
    } | undefined;
    if (addTable) {
      return {
        replies: [{
          addTable: {
            table: {
              tableId: 'native-table-id',
              name: addTable.table.name,
              range: addTable.table.range
            }
          }
        }]
      };
    }
    return { replies: [] };
  });
  const Sheets = {
    Spreadsheets: {
      get: vi.fn(() => ({
        sheets: [{
          properties: { sheetId: 42 },
          tables
        }]
      })),
      batchUpdate
    }
  };
  vi.stubGlobal('Sheets', Sheets);
  return { Sheets, batchUpdate };
}

describe('NativeTableService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('should create a native table using the default preset', () => {
    const { batchUpdate } = createServiceMock();
    const service = new NativeTableService('spreadsheet-id', 42, 'clients', {});

    expect(service.findTable()).toBeNull();
    const table = service.createTable([
      ['id', 'name'],
      [1, 'Ada']
    ]);

    expect(table).toEqual({
      tableId: 'native-table-id',
      name: 'SheetCollection_clients',
      range: {
        sheetId: 42,
        startRowIndex: 0,
        endRowIndex: 2,
        startColumnIndex: 0,
        endColumnIndex: 2
      }
    });
    const request = batchUpdate.mock.calls[0][0].requests[0];
    expect(request.addTable).toMatchObject({
      table: {
        name: 'SheetCollection_clients',
        columnProperties: [
          { columnName: 'id', columnIndex: 0 },
          { columnName: 'name', columnIndex: 1 }
        ],
        rowsProperties: {
          headerColorStyle: { rgbColor: { red: 60 / 255, green: 120 / 255, blue: 216 / 255 } },
          firstBandColorStyle: { rgbColor: { red: 1, green: 1, blue: 1 } }
        }
      }
    });
  });

  it('should allow a custom table name and colors', () => {
    const { batchUpdate } = createServiceMock();
    const service = new NativeTableService('spreadsheet-id', 42, 'clients', {
      preset: 'default',
      name: 'ClientsTable',
      headerColor: '#000000',
      firstBandColor: '#112233',
      secondBandColor: '#ABCDEF'
    });

    service.createTable([['id']]);

    expect(batchUpdate.mock.calls[0][0].requests[0].addTable).toMatchObject({
      table: {
        name: 'ClientsTable',
        rowsProperties: {
          headerColorStyle: { rgbColor: { red: 0, green: 0, blue: 0 } },
          firstBandColorStyle: {
            rgbColor: { red: 17 / 255, green: 34 / 255, blue: 51 / 255 }
          },
          secondBandColorStyle: {
            rgbColor: { red: 171 / 255, green: 205 / 255, blue: 239 / 255 }
          }
        }
      }
    });
  });

  it('should append rows by native table ID and preserve value types', () => {
    const { batchUpdate } = createServiceMock();
    const service = new NativeTableService('spreadsheet-id', 42, 'clients', {});
    const table = service.createTable([['id', 'formula', 'active', 'date']]);
    const date = new Date('2025-01-01T00:00:00.000Z');

    service.appendRows(table, [[1, '=1+1', true, date]]);

    expect(batchUpdate.mock.calls[1][0].requests[0].appendCells).toEqual({
      tableId: 'native-table-id',
      rows: [{
        values: [
          { userEnteredValue: { numberValue: 1 } },
          { userEnteredValue: { formulaValue: '=1+1' } },
          { userEnteredValue: { boolValue: true } },
          {
            userEnteredValue: { numberValue: date.getTime() / 86400000 + 25569 },
            userEnteredFormat: { numberFormat: { type: 'DATE_TIME' } }
          }
        ]
      }],
      fields: 'userEnteredValue,userEnteredFormat.numberFormat'
    });
  });

  it('should convert Date values using the spreadsheet time zone', () => {
    const { batchUpdate } = createServiceMock();
    const date = new Date('2025-01-01T00:00:00.000Z');
    const formatDate = vi.fn(() => '2024-12-31T21:00:00.000');
    vi.stubGlobal('Utilities', { formatDate });
    const service = new NativeTableService(
      'spreadsheet-id',
      42,
      'clients',
      {},
      'America/Sao_Paulo'
    );
    const table = service.createTable([['createdAt']]);

    service.appendRows(table, [[date]]);

    expect(formatDate).toHaveBeenCalledWith(
      date,
      'America/Sao_Paulo',
      "yyyy-MM-dd'T'HH:mm:ss.SSS"
    );
    expect(batchUpdate.mock.calls[1][0].requests[0].appendCells).toMatchObject({
      rows: [{
        values: [{
          userEnteredValue: {
            numberValue: Date.parse('2024-12-31T21:00:00.000Z') / 86400000 + 25569
          },
          userEnteredFormat: { numberFormat: { type: 'DATE_TIME' } }
        }]
      }]
    });
  });

  it('should reuse an existing table with the configured name', () => {
    const existing = {
      tableId: 'existing-table',
      name: 'SheetCollection_clients',
      range: {
        sheetId: 42,
        startRowIndex: 0,
        endRowIndex: 3,
        startColumnIndex: 0,
        endColumnIndex: 2
      }
    };
    const { batchUpdate } = createServiceMock([existing]);
    const service = new NativeTableService('spreadsheet-id', 42, 'clients', {});

    expect(service.findTable()).toEqual(existing);
    expect(batchUpdate).not.toHaveBeenCalled();
  });

  it('should reject unrelated existing tables and invalid colors', () => {
    createServiceMock([{
      tableId: 'other-table',
      name: 'OtherTable',
      range: {
        sheetId: 42,
        startRowIndex: 0,
        endRowIndex: 1,
        startColumnIndex: 0,
        endColumnIndex: 1
      }
    }]);
    const service = new NativeTableService('spreadsheet-id', 42, 'clients', {});

    expect(() => service.findTable()).toThrow(
      "A aba já contém a tabela nativa 'OtherTable'"
    );
    expect(() => new NativeTableService('spreadsheet-id', 42, 'clients', {
      headerColor: 'blue'
    })).toThrow("Cor de preset inválida 'blue'");
  });
});
