import { describe, expect, it } from "vitest";
import { SheetDB } from "../../src/core/SheetDB";
import { createMemoryDatabase } from "../helpers/createMemoryDatabase";

describe('MemorySourceDriver', () => {
    it('should persist sheets', () => {

        const db =
            createMemoryDatabase();

        const sheet =
            db.getOrCreateSheet('users');

        sheet.appendRow([
            '1',
            'Eduardo'
        ]);

        const loaded =
            db.getSheet('users');

        expect(
            loaded.getValues()
        ).toEqual([
            [
                '1',
                'Eduardo'
            ]
        ]);

    });

    it('should return the same sheet when requested repeatedly', () => {
        const db = createMemoryDatabase();
        const first = db.getOrCreateSheet('users');
        first.appendRow(['id']);

        expect(db.getOrCreateSheet('users').getValues()).toEqual([['id']]);
    });

    it('should isolate sheets between database connections', () => {
        const firstDb = createMemoryDatabase();
        const secondDb = createMemoryDatabase();
        firstDb.getOrCreateSheet('users').appendRow(['id']);

        expect(() => secondDb.getSheet('users')).toThrow(
            "Sheet 'users' não encontrada."
        );
    });

    it('should create a separate driver for each connection', () => {
        const firstDb = SheetDB.connect({ source: 'memory' });
        const secondDb = SheetDB.connect({ source: 'memory' });
        firstDb.collection('users').insert({ id: '1' });

        expect(secondDb.collection('users').findAll()).toEqual([]);
    });

});