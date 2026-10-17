import { afterEach, describe, expect, it, vi } from 'vitest';
import { GASSheetSource } from '../../src/sources/GASSheetSource';
import { TableOptions } from '../../src/interfaces/CollectionOptions';

function createSheetMock() {
  const range = {
    setValues: vi.fn(),
    clearContent: vi.fn(),
    getValues: vi.fn((): unknown[][] => [['id', 'name'], ['1', 'Eduardo']])
  };

  const sheet = {
    getName: vi.fn(() => 'users'),
    getSheetId: vi.fn(() => 42),
    getDataRange: vi.fn(() => ({
      getValues: vi.fn(() => [['id', 'name'], ['1', 'Eduardo']])
    })),
    appendRow: vi.fn(),
    clear: vi.fn(),
    getLastRow: vi.fn(() => 3),
    getLastColumn: vi.fn(() => 4),
    getRange: vi.fn(() => range)
  };

  return { sheet, range };
}

describe('GASSheetSource', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should delegate reads, appends, and clearing to the Apps Script sheet', () => {
    const { sheet, range } = createSheetMock();
    const source = new GASSheetSource(
      sheet as unknown as GoogleAppsScript.Spreadsheet.Sheet
    );

    expect(source.getName()).toBe('users');
    expect(source.getValues()).toEqual([
      ['id', 'name'],
      ['1', 'Eduardo']
    ]);
    source.appendRow(['2', 'Maria']);
    source.clear();

    expect(sheet.getRange).toHaveBeenCalledWith(4, 1, 1, 2);
    expect(range.setValues).toHaveBeenCalledWith([['2', 'Maria']]);
    expect(sheet.clear).toHaveBeenCalledOnce();
    expect(source.getLastRow()).toBe(3);
    expect(source.getLastColumn()).toBe(4);
  });

  it('should write values and clear stale rows after a smaller replacement', () => {
    const { sheet, range } = createSheetMock();
    const source = new GASSheetSource(
      sheet as unknown as GoogleAppsScript.Spreadsheet.Sheet
    );
    const values = [['id', 'name'], ['1', 'Eduardo']];

    source.setValues(values);

    expect(sheet.getRange).toHaveBeenNthCalledWith(1, 1, 1, 2, 2);
    expect(range.setValues).toHaveBeenCalledWith(values);
    expect(sheet.getRange).toHaveBeenNthCalledWith(2, 3, 1, 1, 4);
    expect(range.clearContent).toHaveBeenCalledOnce();
  });

  it('should create a native table with the preset on first write', () => {
    const range = {
      setValues: vi.fn(),
      clearContent: vi.fn(),
      getValues: vi.fn(() => [])
    };
    const sheet = {
      getName: vi.fn(() => 'clients'),
      getSheetId: vi.fn(() => 7),
      getDataRange: vi.fn(() => ({ getValues: vi.fn(() => []) })),
      getLastRow: vi.fn(() => 0),
      getLastColumn: vi.fn(() => 0),
      getRange: vi.fn(() => range),
      appendRow: vi.fn(),
      clear: vi.fn()
    };
    const batchUpdate = vi.fn(() => ({
      replies: [{
        addTable: {
          table: {
            tableId: 'created-table',
            name: 'SheetCollection_clients',
            range: {
              sheetId: 7,
              startRowIndex: 0,
              endRowIndex: 2,
              startColumnIndex: 0,
              endColumnIndex: 2
            }
          }
        }
      }]
    }));
    vi.stubGlobal('Sheets', {
      Spreadsheets: {
        get: vi.fn(() => ({ sheets: [{ properties: { sheetId: 7 }, tables: [] }] })),
        batchUpdate
      }
    });
    const tableOptions: TableOptions = {};
    const source = new GASSheetSource(
      sheet as unknown as GoogleAppsScript.Spreadsheet.Sheet,
      { spreadsheetId: 'spreadsheet-id', collectionName: 'clients', options: tableOptions }
    );

    source.setValues([['id', 'name'], [1, 'Ada']]);

    expect(sheet.getRange).toHaveBeenCalledWith(1, 1, 2, 2);
    expect(range.setValues).toHaveBeenCalledWith([['id', 'name'], [1, 'Ada']]);
    expect(batchUpdate).toHaveBeenCalledWith({
      requests: [{
        addTable: {
          table: expect.objectContaining({
            name: 'SheetCollection_clients',
            range: {
              sheetId: 7,
              startRowIndex: 0,
              endRowIndex: 2,
              startColumnIndex: 0,
              endColumnIndex: 2
            }
          })
        }
      }]
    }, 'spreadsheet-id');
  });

  it('should adopt existing data as a native table when table mode is enabled', () => {
    const table = {
      tableId: 'adopted-table',
      name: 'SheetCollection_clients',
      range: {
        sheetId: 7,
        startRowIndex: 0,
        endRowIndex: 2,
        startColumnIndex: 0,
        endColumnIndex: 2
      }
    };
    const batchUpdate = vi.fn(() => ({
      replies: [{ addTable: { table } }]
    }));
    const range = {
      setValues: vi.fn(),
      clearContent: vi.fn(),
      getValues: vi.fn(() => [['id', 'name'], [1, 'Ada']])
    };
    const sheet = {
      getName: vi.fn(() => 'clients'),
      getSheetId: vi.fn(() => 7),
      getDataRange: vi.fn(() => ({ getValues: vi.fn(() => [['id', 'name'], [1, 'Ada']]) })),
      getLastRow: vi.fn(() => 2),
      getLastColumn: vi.fn(() => 2),
      getRange: vi.fn(() => range),
      appendRow: vi.fn(),
      clear: vi.fn()
    };
    vi.stubGlobal('Sheets', {
      Spreadsheets: {
        get: vi.fn(() => ({ sheets: [{ properties: { sheetId: 7 }, tables: [] }] })),
        batchUpdate
      }
    });
    const source = new GASSheetSource(
      sheet as unknown as GoogleAppsScript.Spreadsheet.Sheet,
      { spreadsheetId: 'spreadsheet-id', collectionName: 'clients', options: {} }
    );

    expect(source.getValues()).toEqual([['id', 'name'], [1, 'Ada']]);
    expect(batchUpdate).toHaveBeenCalledOnce();
  });

  it('should not write data when a table header is invalid', () => {
    const range = {
      setValues: vi.fn(),
      clearContent: vi.fn(),
      getValues: vi.fn(() => [])
    };
    const sheet = {
      getName: vi.fn(() => 'clients'),
      getSheetId: vi.fn(() => 7),
      getDataRange: vi.fn(() => ({ getValues: vi.fn(() => []) })),
      getLastRow: vi.fn(() => 0),
      getLastColumn: vi.fn(() => 0),
      getRange: vi.fn(() => range),
      appendRow: vi.fn(),
      clear: vi.fn()
    };
    const batchUpdate = vi.fn();
    vi.stubGlobal('Sheets', {
      Spreadsheets: {
        get: vi.fn(() => ({ sheets: [{ properties: { sheetId: 7 }, tables: [] }] })),
        batchUpdate
      }
    });
    const source = new GASSheetSource(
      sheet as unknown as GoogleAppsScript.Spreadsheet.Sheet,
      { spreadsheetId: 'spreadsheet-id', collectionName: 'clients', options: {} }
    );

    expect(() => source.setValues([['id', ''], [1, 'Ada']])).toThrow(
      'Os cabeçalhos da tabela não podem ser vazios.'
    );
    expect(sheet.getRange).not.toHaveBeenCalled();
    expect(batchUpdate).not.toHaveBeenCalled();
  });

  it('should append through the native table API when a table is enabled', () => {
    const table = {
      tableId: 'existing-table',
      name: 'ClientsTable',
      range: {
        sheetId: 42,
        startRowIndex: 0,
        endRowIndex: 2,
        startColumnIndex: 0,
        endColumnIndex: 2
      }
    };
    const batchUpdate = vi.fn(() => ({ replies: [] }));
    vi.stubGlobal('Sheets', {
      Spreadsheets: {
        get: vi.fn(() => ({
          sheets: [{ properties: { sheetId: 42 }, tables: [table] }]
        })),
        batchUpdate
      }
    });
    const { sheet, range } = createSheetMock();
    const source = new GASSheetSource(
      sheet as unknown as GoogleAppsScript.Spreadsheet.Sheet,
      {
        spreadsheetId: 'spreadsheet-id',
        collectionName: 'clients',
        options: { name: 'ClientsTable' }
      }
    );

    source.appendRows([[2, 'Grace']]);

    expect(batchUpdate).toHaveBeenCalledWith({
      requests: [{
        updateTable: {
          table: {
            tableId: 'existing-table',
            range: {
              sheetId: 42,
              startRowIndex: 0,
              endRowIndex: 3,
              startColumnIndex: 0,
              endColumnIndex: 2
            }
          },
          fields: 'range'
        }
      }]
    }, 'spreadsheet-id');
    expect(sheet.getRange).toHaveBeenCalledWith(3, 1, 1, 2);
    expect(range.setValues).toHaveBeenCalledWith([[2, 'Grace']]);
    expect(source.getValues()).toHaveLength(2);
  });

  it('should omit trailing empty rows when reading a native table', () => {
    const table = {
      tableId: 'existing-table',
      name: 'ClientsTable',
      range: {
        sheetId: 42,
        startRowIndex: 0,
        endRowIndex: 4,
        startColumnIndex: 0,
        endColumnIndex: 2
      }
    };
    vi.stubGlobal('Sheets', {
      Spreadsheets: {
        get: vi.fn(() => ({
          sheets: [{ properties: { sheetId: 42 }, tables: [table] }]
        })),
        batchUpdate: vi.fn()
      }
    });

    const { sheet, range } = createSheetMock();
    range.getValues.mockReturnValue([
      ['id', 'name'],
      [1, 'Ada'],
      ['', ''],
      ['', '']
    ]);
    const source = new GASSheetSource(
      sheet as unknown as GoogleAppsScript.Spreadsheet.Sheet,
      {
        spreadsheetId: 'spreadsheet-id',
        collectionName: 'clients',
        options: { name: 'ClientsTable' }
      }
    );

    expect(source.getValues()).toEqual([
      ['id', 'name'],
      [1, 'Ada']
    ]);
  });

  it('should fill a trailing empty row already inside a native table', () => {
    const table = {
      tableId: 'existing-table',
      name: 'ClientsTable',
      range: {
        sheetId: 42,
        startRowIndex: 0,
        endRowIndex: 3,
        startColumnIndex: 0,
        endColumnIndex: 2
      }
    };
    const batchUpdate = vi.fn();
    vi.stubGlobal('Sheets', {
      Spreadsheets: {
        get: vi.fn(() => ({
          sheets: [{ properties: { sheetId: 42 }, tables: [table] }]
        })),
        batchUpdate
      }
    });
    const { sheet, range } = createSheetMock();
    range.getValues.mockReturnValue([
      ['id', 'name'],
      [1, 'Ada'],
      ['', '']
    ]);
    const source = new GASSheetSource(
      sheet as unknown as GoogleAppsScript.Spreadsheet.Sheet,
      {
        spreadsheetId: 'spreadsheet-id',
        collectionName: 'clients',
        options: { name: 'ClientsTable' }
      }
    );

    source.appendRows([[2, 'Grace']]);

    expect(batchUpdate).not.toHaveBeenCalled();
    expect(sheet.getRange).toHaveBeenCalledWith(3, 1, 1, 2);
    expect(range.setValues).toHaveBeenCalledWith([[2, 'Grace']]);
  });

  it('should resize a table when rows are replaced and clear deleted table cells', () => {
    const table = {
      tableId: 'existing-table',
      name: 'ClientsTable',
      range: {
        sheetId: 42,
        startRowIndex: 0,
        endRowIndex: 3,
        startColumnIndex: 0,
        endColumnIndex: 2
      }
    };
    const batchUpdate = vi.fn(() => ({ replies: [] }));
    vi.stubGlobal('Sheets', {
      Spreadsheets: {
        get: vi.fn(() => ({
          sheets: [{ properties: { sheetId: 42 }, tables: [table] }]
        })),
        batchUpdate
      }
    });
    const { sheet, range } = createSheetMock();
    const source = new GASSheetSource(
      sheet as unknown as GoogleAppsScript.Spreadsheet.Sheet,
      {
        spreadsheetId: 'spreadsheet-id',
        collectionName: 'clients',
        options: { name: 'ClientsTable' }
      }
    );
    const values = [['id', 'name'], [1, 'Ada']];

    source.setValues(values);

    expect(batchUpdate).toHaveBeenCalledWith({
      requests: [{
        updateTable: {
          table: {
            tableId: 'existing-table',
            range: {
              sheetId: 42,
              startRowIndex: 0,
              endRowIndex: 2,
              startColumnIndex: 0,
              endColumnIndex: 2
            },
            columnProperties: [
              { columnName: 'id', columnIndex: 0 },
              { columnName: 'name', columnIndex: 1 }
            ]
          },
          fields: 'range,columnProperties'
        }
      }]
    }, 'spreadsheet-id');
    expect(sheet.getRange).toHaveBeenCalledWith(1, 1, 2, 2);
    expect(range.setValues).toHaveBeenCalledWith(values);
    expect(sheet.getRange).toHaveBeenCalledWith(3, 1, 1, 2);
    expect(range.clearContent).toHaveBeenCalledOnce();
  });
});
