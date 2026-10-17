import { describe, expect, it } from 'vitest';
import { MemorySheetSource } from '../../src/sources/MemorySheetSource';

describe('MemorySheetSource', () => {
  it('should return defensive copies of initial, read, and written values', () => {
    const initial = [['id', 'name'], ['1', 'Eduardo']];
    const source = new MemorySheetSource('users', initial);
    initial[1][1] = 'changed';

    const loaded = source.getValues();
    loaded[1][1] = 'also changed';

    expect(source.getValues()).toEqual([
      ['id', 'name'],
      ['1', 'Eduardo']
    ]);

    const values = [['id'], ['2']];
    source.setValues(values);
    values[1][0] = 'changed';
    expect(source.getValues()).toEqual([['id'], ['2']]);
  });

  it('should append rows and report dimensions', () => {
    const source = new MemorySheetSource('users');
    const row = ['id', 'name'];
    source.appendRow(row);
    row[0] = 'changed';

    expect(source.getName()).toBe('users');
    expect(source.getLastRow()).toBe(1);
    expect(source.getLastColumn()).toBe(2);
    expect(source.getValues()).toEqual([['id', 'name']]);
  });

  it('should report zero dimensions and clear all rows', () => {
    const source = new MemorySheetSource('users', [['id'], ['1']]);
    source.clear();

    expect(source.getValues()).toEqual([]);
    expect(source.getLastRow()).toBe(0);
    expect(source.getLastColumn()).toBe(0);
  });
});
