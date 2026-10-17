import { afterEach, describe, expect, it, vi } from 'vitest';
import { GASSheetSource } from '../../src/sources/GASSheetSource';

function createSheetMock() {
  const range = {
    setValues: vi.fn(),
    clearContent: vi.fn()
  };

  const sheet = {
    getName: vi.fn(() => 'users'),
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
  afterEach(() => vi.restoreAllMocks());

  it('should delegate reads, appends, and clearing to the Apps Script sheet', () => {
    const { sheet } = createSheetMock();
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

    expect(sheet.appendRow).toHaveBeenCalledWith(['2', 'Maria']);
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
});
