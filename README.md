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
* TypeScript API

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

### Native Google Sheets tables

Collections use the existing plain-sheet behavior by default. To create a
native Google Sheets table in the collection tab, enable the default table
preset when obtaining the collection:

```javascript
const clients = db.collection("clients", {
  table: true
});
```

The default preset adds a native table with a blue header and alternating
light rows. The table is created on the first insert, when the column headers
are known. Existing plain cell data in the collection tab is adopted when the
table option is enabled. The table name is derived from the collection name.
If the tab already has a native table, configure its existing name as
`table.name`; a differently named table is rejected rather than modified.

The preset allows limited customization of the name and row colors:

```javascript
const clients = db.collection("clients", {
  table: {
    preset: "default",
    name: "Clients",
    headerColor: "#366092",
    firstBandColor: "#FFFFFF",
    secondBandColor: "#EAF2F8"
  }
});
```

Colors use `#RRGGBB`; table names must be unique in the spreadsheet. To use
native tables, enable the Advanced Sheets service (Sheets API v4) in the Apps
Script project. The service is included in this project's manifest. If the
Apps Script project uses a standard Google Cloud project, enable the Google
Sheets API there as well. The memory driver ignores table appearance options
and remains suitable for CRUD tests.

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

Provides an in-memory storage backend.

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

## Contributing

Issues, feature requests and pull requests are welcome. See
[CONTRIBUTING.md](CONTRIBUTING.md) for development and contribution guidance.

---

# License

MIT License.

---
