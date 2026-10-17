import { it, expect, describe } from 'vitest';
import { User } from "../fixtures/users.fixture";
import { createMemoryDatabase } from "../helpers/createMemoryDatabase";

describe('Collection', () => {
  it('should insert a document', () => {

    const db = createMemoryDatabase();

    const users =
      db.collection<User>('users');

    users.insert({
      id: '1',
      name: 'Eduardo'
    });

    expect(
      users.findAll()
    ).toEqual([
      {
        id: '1',
        name: 'Eduardo'
      }
    ]);

  });

  it('should generate id automatically when missing', () => {
    interface NumericUser {
      id: number;
      name: string;
    }

    const db = createMemoryDatabase();
    const users =
      db.collection<NumericUser>('users');

    users.insert({
      name: 'Maria'
    });

    expect(
      users.findAll()
    ).toEqual([
      {
        id: 1,
        name: 'Maria'
      }
    ]);
  });

  it('should generate unique ids for consecutive inserts', () => {
    interface NumericUser {
      id: number;
      name: string;
    }

    const db = createMemoryDatabase();
    const users =
      db.collection<NumericUser>('users');

    users.insert({
      name: 'Maria'
    });

    users.insert({
      name: 'Ana'
    });

    expect(
      users.findAll()
    ).toEqual([
      {
        id: 1,
        name: 'Maria'
      },
      {
        id: 2,
        name: 'Ana'
      }
    ]);
  });

  it('should insert multiple documents in a single operation preserving order', () => {
    interface NumericUser {
      id: number;
      name: string;
      age?: number;
    }

    const db = createMemoryDatabase();
    const users =
      db.collection<NumericUser>('users');

    users.insertMany([
      { name: 'Maria' },
      { name: 'Ana', age: 24 },
      { name: 'João' }
    ]);

    expect(
      users.findAll()
    ).toEqual([
      {
        id: 1,
        name: 'Maria'
      },
      {
        id: 2,
        name: 'Ana',
        age: 24
      },
      {
        id: 3,
        name: 'João'
      }
    ]);
  });

  it('should not insert documents with duplicated manual id in batch or existing rows', () => {
    const db = createMemoryDatabase();
    const users =
      db.collection<User>('users');

    users.insert({
      id: '1',
      name: 'Eduardo'
    });

    expect(() => {
      users.insertMany([
        {
          id: '1',
          name: 'Maria'
        },
        {
          id: '2',
          name: 'Ana'
        }
      ]);
    }).toThrow("ID '1' is already in use.");
  });

  it('should preserve manual id when provided', () => {
    const db = createMemoryDatabase();
    const users =
      db.collection<User>('users');

    users.insert({
      id: '10',
      name: 'Maria'
    });

    expect(
      users.findAll()
    ).toEqual([
      {
        id: '10',
        name: 'Maria'
      }
    ]);
  });

  it('should not insert a document with duplicated manual id', () => {
    const db = createMemoryDatabase();
    const users =
      db.collection<User>('users');

    users.insert({
      id: '1',
      name: 'Eduardo'
    });

    expect(() => {
      users.insert({
        id: '1',
        name: 'Maria'
      });
    }).toThrowError("ID '1' is already in use.");
  });

  it('should not insert a document with duplicated numeric/string id', () => {
    interface NumericUser {
      id: number;
      name: string;
    }

    const db = createMemoryDatabase();
    const users =
      db.collection<NumericUser>('users');

    users.insert({
      id: 1,
      name: 'Eduardo'
    });

    expect(() => {
      users.insert({
        id: 1,
        name: 'Maria'
      });
    }).toThrow("ID '1' is already in use.");
  });

  it('should find by id', () => {
    const db = createMemoryDatabase();

    const users =
      db.collection<User>('users');

    users.insert({
      id: '1',
      name: 'Eduardo'
    });

    expect(
      users.findById('1')
    ).toEqual({
      id: '1',
      name: 'Eduardo'
    });

  });

  it('should return an empty list and null when the collection has no documents', () => {
    const users = createMemoryDatabase().collection<User>('users');

    expect(users.findAll()).toEqual([]);
    expect(users.findById('missing')).toBeNull();
  });

  it('should find ids regardless of whether the number or its string form is used', () => {
    interface NumericUser {
      id: number;
      name: string;
    }

    const users = createMemoryDatabase().collection<NumericUser>('users');
    users.insert({ id: 1, name: 'Eduardo' });

    expect(users.findById('1')).toEqual({ id: 1, name: 'Eduardo' });
  });

  it('should update document', () => {

    const db = createMemoryDatabase();

    const users =
      db.collection<User>('users');

    users.insert({
      id: '1',
      name: 'Eduardo'
    });

    expect(users.update(
      '1',
      {
        name: 'Carlos'
      }
    )).toBe(true);

    expect(
      users.findById('1')
    ).toEqual({
      id: '1',
      name: 'Carlos'
    });

  });

  it('should return false when updating a missing document', () => {
    const users = createMemoryDatabase().collection<User>('users');

    expect(users.update('missing', { name: 'Carlos' })).toBe(false);
    expect(users.findAll()).toEqual([]);
  });

  it('should delete document', () => {

    const db = createMemoryDatabase();

    const users =
      db.collection<User>('users');

    users.insert({
      id: '1',
      name: 'Eduardo'
    });

    expect(users.delete('1')).toBe(true);

    expect(
      users.findAll()
    ).toHaveLength(0);

  });

  it('should return false when deleting a missing document without changing other rows', () => {
    const users = createMemoryDatabase().collection<User>('users');
    users.insertMany([
      { id: '1', name: 'Eduardo' },
      { id: '2', name: 'Maria' }
    ]);

    expect(users.delete('missing')).toBe(false);
    expect(users.findAll()).toEqual([
      { id: '1', name: 'Eduardo' },
      { id: '2', name: 'Maria' }
    ]);
  });

  it('should add newly encountered fields to the headers while preserving existing rows', () => {
    interface UserWithAge extends User {
      age?: number;
    }

    const users = createMemoryDatabase().collection<UserWithAge>('users');
    users.insert({ id: '1', name: 'Eduardo' });
    users.insert({ id: '2', name: 'Maria', age: 24 });

    expect(users.findAll()).toEqual([
      { id: '1', name: 'Eduardo' },
      { id: '2', name: 'Maria', age: 24 }
    ]);
  });

  it('should not partially insert a batch when it contains duplicate ids', () => {
    const users = createMemoryDatabase().collection<User>('users');
    users.insert({ id: '1', name: 'Eduardo' });

    expect(() => users.insertMany([
      { id: '2', name: 'Maria' },
      { id: '2', name: 'Ana' }
    ])).toThrow("ID '2' is already in use.");
    expect(users.findAll()).toEqual([
      { id: '1', name: 'Eduardo' }
    ]);
  });

  it('should do nothing when inserting an empty batch', () => {
    const db = createMemoryDatabase();
    const users = db.collection<User>('users');

    users.insertMany([]);

    expect(users.findAll()).toEqual([]);
    expect(db.getSheet('users').getLastRow()).toBe(0);
  });
});