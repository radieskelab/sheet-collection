import { describe, expect, it } from 'vitest';
import { RowMapper } from '../../src/mappers/RowMapper';

describe('RowMapper', () => {
  it('should map a row to a document using header names', () => {
    expect(
      RowMapper.toDocument(['id', 'name'], ['1', 'Eduardo'])
    ).toEqual({
      id: '1',
      name: 'Eduardo'
    });
  });

  it('should map document fields in header order', () => {
    expect(
      RowMapper.toRow(
        { name: 'Eduardo', id: '1', ignored: true },
        ['id', 'name']
      )
    ).toEqual(['1', 'Eduardo']);
  });

  it('should use undefined for headers missing from a row', () => {
    expect(
      RowMapper.toDocument(['id', 'name'], ['1'])
    ).toEqual({
      id: '1',
      name: undefined
    });
  });

  it('should ignore row values that have no matching header', () => {
    expect(
      RowMapper.toDocument(['id'], ['1', 'extra'])
    ).toEqual({ id: '1' });
  });
});
