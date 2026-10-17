import '../../dist/SheetCollection.js';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInThisContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const bundlePath = resolve(projectRoot, 'dist/SheetCollection.js');
const apiPath = resolve(projectRoot, 'dist/Api.gs');
const manifestPath = resolve(projectRoot, 'dist/appsscript.json');
const collectionTypesPath = resolve(projectRoot, 'dist/core/Collection.d.ts');

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
assert.equal(manifest.runtimeVersion, 'V8');

const bundle = readFileSync(bundlePath, 'utf8');
assert.doesNotMatch(bundle, /^\s*(?:import|export)\s/m);
assert.doesNotMatch(bundle, /^\s*var SheetCollection\s*=/m);
assert.match(bundle, /globalScope\.SheetDB\s*=\s*SheetDB/);
assert.match(bundle, /Gets a typed collection backed by a spreadsheet tab or memory sheet/);
assert.match(bundle, /Returns every row after the header row as a document/);
assert.match(bundle, /Inserts one document into the collection/);
assert.match(bundle, /Updates fields of the document with the given `id`/);
assert.match(bundle, /Deletes the document with the given `id`/);

const collectionTypes = readFileSync(collectionTypesPath, 'utf8');
assert.match(collectionTypes, /findAll\(\): T\[\]/);
assert.match(collectionTypes, /findById\(id: unknown\): T \| null/);
assert.match(collectionTypes, /insertMany\(documents: InsertDocument<T>\[\]\): void/);

const apiFacade = readFileSync(apiPath, 'utf8');
assert.match(apiFacade, /@return \{SheetDB\}/);
assert.match(apiFacade, /@param \{Object\} config/);
assert.match(apiFacade, /@param \{"google"\|"memory"\} config\.source/);
assert.match(apiFacade, /@param \{string\} \[config\.properties\.spreadsheetId\]/);
assert.match(apiFacade, /clients\.insert\(\{ name: "Ada Lovelace" \}\)/);
assert.match(apiFacade, /function connect\(config\)/);
runInThisContext(apiFacade, { filename: apiPath });

assert.equal(typeof globalThis.SheetDB, 'function');
assert.doesNotMatch(bundle, /globalScope\.Collection\s*=/);
assert.equal(typeof globalThis.connect, 'function');

const db = globalThis.connect({
  source: 'memory'
});

const users =
  db.collection('users');

users.insert({
  id: '1',
  name: 'Eduardo'
});

users.insert({
  id: '2',
  name: 'Maria'
});

assert.throws(
  () => {
    users.insert({
      id: '1',
      name: 'Maria'
    });
  },
  /ID '1' is already in use\./,
  'should not allow inserting duplicate id'
);

const allReg = users.findAll();
console.log('findAll', allReg)
assert.equal(allReg.length, 2);

const findByID = users.findById('1');
console.log('findByID 1', findByID);
assert.equal(
    findByID.name,
    'Eduardo'
);

users.update(
  '1',
  {
    name: 'Carlos'
  }
);

const update = users.findById('1');
console.log('update 1', update)
assert.equal(
  update.name,
  'Carlos'
);

users.delete('2');
const del = users.findAll();
console.log('delete 2', del);
assert.equal(del.length, 1);

console.log(
  '✓ Distribution test passed'
);