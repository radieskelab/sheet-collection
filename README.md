# Sheet Collection

> 📦 Available as a Google Apps Script Library
>
> **Script ID**
>
> `1uJFD2xU_Teb-lKbxPt5YpFqdl-6C_5GUQNVRLs8Ps3Kb0rjUCxabFXOj`

Google Sheets collections for Google Apps Script.

Work with spreadsheet data as JavaScript objects instead of manually handling rows, ranges and column indexes.

```javascript
const db = SheetCollection.connect({
  source: "google"
});

const clients = db.collection("clients");

clients.insert({
  name: "John Doe",
  email: "john@email.com"
});

Logger.log(clients.findAll());
```

---

## Why?

Google Apps Script often leads to code like this:

```javascript
const sheet = SpreadsheetApp
  .getActiveSpreadsheet()
  .getSheetByName("clients");

const values = sheet
  .getDataRange()
  .getValues();
```

With Sheet Collection:

```javascript
const clients =
  db.collection("clients");

const data =
  clients.findAll();
```

Focus on your data, not spreadsheet plumbing.

---

## Features

* Collection-based API
* Automatic header management
* Google Sheets storage
* Memory driver for testing
* CRUD operations
* Driver architecture
* Google Apps Script compatible
* Zero runtime dependencies
* TypeScript-first development

---

## Installation

### Google Apps Script Library

1. Open your Google Apps Script project.
2. Click **Libraries** in the left sidebar.
3. Click **Add a library**.
4. Paste the following Script ID:

```text
1uJFD2xU_Teb-lKbxPt5YpFqdl-6C_5GUQNVRLs8Ps3Kb0rjUCxabFXOj
```

5. Select the latest version.
6. Use the default identifier:

```javascript
SheetCollection
```

7. Click **Add**.

### Verify Installation

```javascript
function testLibrary() {

  const db = SheetCollection.connect({
    source: 'google'
  });

  Logger.log(db);
}
```

### Build and verify autocomplete

The build outputs the bundled JavaScript, Apps Script manifest, generated
TypeScript declarations, and a documented `Api.gs` facade. The facade exposes
`connect()` as a top-level Apps Script library function. That is the API point
for which the editor shows JSDoc. The editor may not provide member completion
for `db` and `clients`, even though the returned objects have those methods at
runtime; the method reference below documents their signatures and behavior.

```javascript
const db = SheetCollection.connect({ source: "google" });
```

Run the automated build and distribution smoke test locally:

```sh
npm run verify
```

The GitHub Actions pipeline runs `npm run verify` for pull requests targeting
`main` and for pushes to `main`. It installs the locked dependencies with
`npm ci`, then runs the unit tests, build, and distribution smoke test.

To validate autocomplete in the Apps Script editor:

1. Build and push the generated project with `npm run push`.
2. Create and publish a new library version, then select that version in a
   consumer project. The consumer must use the library identifier
   `SheetCollection`.
3. In the editor, type `SheetCollection.` and confirm `connect` is suggested.
   Open its hint and confirm the configuration properties, driver behavior,
   and usage example appear.
4. Check the behavior of `db.` and `clients.` separately. Current testing
   confirms the library function's JSDoc, but not member completion for objects
   returned by library calls. Do not treat missing member suggestions as a
   build failure; the editor does not currently resolve those custom return
   types in this project.
5. Run the CRUD example below with the memory driver. Local tests validate
   runtime behavior and generated comments, not Google's editor completion.

---

## Quick Start

### Connect to Active Spreadsheet

```javascript
const db = SheetCollection.connect({
  source: "google"
});
```

### Connect to a Specific Spreadsheet

```javascript
const db = SheetCollection.connect({
  source: "google",
  properties: {
    spreadsheetId: "YOUR_SPREADSHEET_ID"
  }
});
```

---

## Collections

A collection maps directly to a spreadsheet tab.

```javascript
const clients =
  db.collection("clients");
```

If the sheet does not exist, it is created automatically.

### Collection API reference

The methods below are available on the object returned by `db.collection()`.
They are documented in the TypeScript source and generated declarations; the
Apps Script editor may not show member autocomplete or inline JSDoc for them
when the object comes from the library.

| Method | Parameters | Return | Behavior |
| --- | --- | --- | --- |
| `findAll()` | None | `T[]` | Returns all data rows as documents; returns `[]` when empty. |
| `findById(id)` | `id: unknown` | `T \| null` | Finds the first matching `id`, or returns `null`. Numeric and string forms of an ID match. |
| `insert(document)` | A document object; `id` may be omitted | `void` | Inserts one row, creating headers if needed. Generates a numeric ID when omitted; duplicate IDs throw. |
| `insertMany(documents)` | Array of document objects | `void` | Inserts multiple rows and generates missing numeric IDs. Duplicate IDs throw. |
| `update(id, document)` | ID and partial document | `boolean` | Updates supplied fields; `false` if no matching document exists. |
| `delete(id)` | ID | `boolean` | Deletes the matching document; `false` if none exists. |

For Google Sheets, fields should contain values supported by `Range.setValues`
(strings, numbers, booleans, or dates). Documents are mapped by header name;
the generic document type is not runtime schema validation.

```javascript
const db = SheetCollection.connect({ source: "memory" });
const clients = db.collection("clients");

clients.insertMany([
  { name: "Ada Lovelace", email: "ada@example.com" },
  { name: "Grace Hopper", email: "grace@example.com" }
]);

const allClients = clients.findAll();
const client = clients.findById(1);
const updated = clients.update(1, { name: "Ada" });
const deleted = clients.delete(2);
```

---

## Insert Documents

```javascript
clients.insert({
  id: 1,
  name: "John Doe",
  email: "john@email.com"
});
```

The first insertion automatically creates the header row.

| id | name     | email                                   |
| -- | -------- | --------------------------------------- |
| 1  | John Doe | [john@email.com](mailto:john@email.com) |

---

## Find All

```javascript
const data =
  clients.findAll();
```

Output:

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@email.com"
  }
]
```

---

## Find By Id

```javascript
const client =
  clients.findById(1);
```

---

## Update

```javascript
clients.update(
  1,
  {
    name: "Updated Name"
  }
);
```

---

## Delete

```javascript
clients.delete(1);
```

---

# Drivers

Sheet Collection supports multiple storage backends.

---

## Google Sheets Driver

```javascript
const db = SheetCollection.connect({
  source: "google"
});
```

---

## Memory Driver

Useful for testing and local development.

```javascript
const db = SheetCollection.connect({
  source: "memory"
});
```

Example:

```javascript
const clients =
  db.collection("clients");

clients.insert({
  id: 1,
  name: "Test User"
});

Logger.log(
  JSON.stringify(
    clients.findAll()
  )
);
```

---

# Testing

The Memory Driver allows testing business logic without Google Sheets.

```javascript
const db = SheetCollection.connect({
  source: "memory"
});
```

This makes unit testing significantly easier than relying on SpreadsheetApp mocks.

---

# Architecture

```text
┌─────────────┐
│   SheetDB   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Collection  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│SheetAdapter │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ SheetSource │
└──────┬──────┘
       │
 ┌─────┴─────┐
 ▼           ▼
Google     Memory
```

---

# Roadmap

### Data

* Custom primary keys
* Auto-generated IDs
* Batch operations
* Upsert
* Query filters

### Spreadsheet

* Column types
* Checkbox columns
* Date formatting
* Currency formatting
* Dropdown validation
* Formula helpers
* Table presets

### Platform

* Driver registration API
* Additional storage providers
* Collection hooks

---

# Contributing

Issues, feature requests and pull requests are welcome.

If you have ideas for improving the developer experience in Google Apps Script, open a discussion or create an issue.

---

# License

MIT License.

---
