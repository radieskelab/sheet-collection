import { afterEach, describe, expect, it, vi } from 'vitest';
import { GASSourceDriver } from '../../src/sources/drivers/GASSourceDriver';

function createAppsScriptMocks() {
  const sheet = {
    getName: vi.fn(() => 'users'),
    getSheetId: vi.fn(() => 42),
    getDataRange: vi.fn(() => ({ getValues: vi.fn(() => []) })),
    appendRow: vi.fn(),
    clear: vi.fn(),
    getLastRow: vi.fn(() => 0),
    getLastColumn: vi.fn(() => 0),
    getRange: vi.fn()
  };
  const getSheetByName = vi.fn(
    (name: string): typeof sheet | null => name === 'users' ? sheet : null
  );
  const spreadsheet = {
    getId: vi.fn(() => 'spreadsheet-id'),
    getSpreadsheetTimeZone: vi.fn(() => 'UTC'),
    getSheetByName,
    insertSheet: vi.fn(() => sheet)
  };
  const getActiveSpreadsheet = vi.fn(
    (): typeof spreadsheet | null => spreadsheet
  );
  const spreadsheetApp = {
    getActiveSpreadsheet,
    openById: vi.fn(() => spreadsheet)
  };

  return { sheet, spreadsheet, spreadsheetApp };
}

describe('GASSourceDriver', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('should use the active spreadsheet when no properties are provided', () => {
    const { spreadsheet, spreadsheetApp } = createAppsScriptMocks();
    vi.stubGlobal('SpreadsheetApp', spreadsheetApp);

    const driver = new GASSourceDriver();

    expect(spreadsheetApp.getActiveSpreadsheet).toHaveBeenCalledOnce();
    expect(driver.getSheet('users').getName()).toBe('users');
    expect(spreadsheet.getSheetByName).toHaveBeenCalledWith('users');
  });

  it('should open a spreadsheet by ID when properties are provided', () => {
    const { spreadsheet, spreadsheetApp } = createAppsScriptMocks();
    vi.stubGlobal('SpreadsheetApp', spreadsheetApp);

    const driver = new GASSourceDriver({ spreadsheetId: 'spreadsheet-id' });

    expect(spreadsheetApp.openById).toHaveBeenCalledWith('spreadsheet-id');
    expect(spreadsheetApp.getActiveSpreadsheet).not.toHaveBeenCalled();
    expect(driver.getOrCreateSheet('users').getName()).toBe('users');
    expect(spreadsheet.insertSheet).not.toHaveBeenCalled();
  });

  it('should pass native table options to the sheet source', () => {
    const { spreadsheetApp } = createAppsScriptMocks();
    const range = { setValues: vi.fn(), clearContent: vi.fn(), getValues: vi.fn(() => []) };
    const sheet = {
      getName: vi.fn(() => 'users'),
      getSheetId: vi.fn(() => 42),
      getDataRange: vi.fn(() => ({ getValues: vi.fn(() => []) })),
      appendRow: vi.fn(),
      clear: vi.fn(),
      getLastRow: vi.fn(() => 0),
      getLastColumn: vi.fn(() => 0),
      getRange: vi.fn(() => range)
    };
    vi.stubGlobal('SpreadsheetApp', {
      ...spreadsheetApp,
      getActiveSpreadsheet: vi.fn(() => ({
        ...spreadsheetApp.getActiveSpreadsheet(),
        getSheetByName: vi.fn(() => sheet)
      }))
    });
    const batchUpdate = vi.fn(() => ({
      replies: [{
        addTable: {
          table: {
            tableId: 'native-table',
            name: 'SheetCollection_users',
            range: {
              sheetId: 42,
              startRowIndex: 0,
              endRowIndex: 2,
              startColumnIndex: 0,
              endColumnIndex: 1
            }
          }
        }
      }]
    }));
    vi.stubGlobal('Sheets', {
      Spreadsheets: {
        get: vi.fn(() => ({ sheets: [{ properties: { sheetId: 42 }, tables: [] }] })),
        batchUpdate
      }
    });

    const driver = new GASSourceDriver();
    const source = driver.getOrCreateSheet('users', { table: true });
    source.setValues([['id'], ['1']]);

    expect(batchUpdate).toHaveBeenCalledWith({
      requests: [{
        addTable: {
          table: expect.objectContaining({
            name: 'SheetCollection_users',
            columnProperties: [{ columnName: 'id', columnIndex: 0 }]
          })
        }
      }]
    }, 'spreadsheet-id');
  });

  it('should create a sheet when it does not already exist', () => {
    const { spreadsheet, spreadsheetApp } = createAppsScriptMocks();
    spreadsheet.getSheetByName.mockReturnValue(null);
    vi.stubGlobal('SpreadsheetApp', spreadsheetApp);

    const driver = new GASSourceDriver();

    expect(driver.getOrCreateSheet('new-users').getName()).toBe('users');
    expect(spreadsheet.insertSheet).toHaveBeenCalledWith('new-users');
  });

  it('should report invalid spreadsheet configuration and missing sheets', () => {
    const { spreadsheet, spreadsheetApp } = createAppsScriptMocks();
    vi.stubGlobal('SpreadsheetApp', spreadsheetApp);
    spreadsheet.getSheetByName.mockReturnValue(null);

    expect(() => new GASSourceDriver({})).toThrow(
      'ID da Planilha não foi informado.'
    );
    expect(() => new GASSourceDriver().getSheet('missing')).toThrow(
      'Aba informada não foi encontrada.'
    );
  });

  it('should report when there is no active spreadsheet', () => {
    const { spreadsheetApp } = createAppsScriptMocks();
    spreadsheetApp.getActiveSpreadsheet.mockReturnValue(null);
    vi.stubGlobal('SpreadsheetApp', spreadsheetApp);

    expect(() => new GASSourceDriver()).toThrow(
      'Nenhuma planilha ativa encontrada.'
    );
  });
});
