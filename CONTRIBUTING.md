# Contributing

Issues, feature requests and pull requests are welcome. If you have ideas for
improving the developer experience in Google Apps Script, open a discussion or
create an issue.

## Development

Install the project dependencies:

```sh
npm ci
```

Run the tests with coverage, type-check the test sources, build, and run the
distribution smoke test:

```sh
npm run verify
```

The `verify` script runs the unit and in-memory integration tests with a V8
coverage report, type-checks the TypeScript test sources, builds the library,
and checks the generated distribution with a consumer smoke test. Coverage
thresholds start below the current baseline (80% statements and lines, 70%
branches, and 90% functions) to prevent substantial regressions while leaving
room to expand coverage. The GitHub Actions pipeline runs `npm run verify` for
pull requests targeting `main` and for pushes to `main`.

The build outputs the bundled JavaScript, Apps Script manifest, generated
TypeScript declarations, and a documented `Api.gs` facade.

### Apps Script autocomplete

The `Api.gs` facade exposes `connect()` as a top-level Apps Script library
function. That is the API point for which the editor shows JSDoc. The editor
may not provide member completion for `db` and `clients`, even though the
returned objects have those methods at runtime.

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
5. Run a CRUD example with the memory driver. Local tests validate runtime
   behavior and generated comments, not Google's editor completion.

## Testing

The Memory Driver allows testing business logic without Google Sheets, without
relying on `SpreadsheetApp` mocks:

```javascript
const db = SheetCollection.connect({
  source: "memory"
});
```

Tests are grouped by intent under `tests/unit`, `tests/integration`, and
`tests/consumer`. The GAS adapter and driver tests use narrow Apps Script mocks;
they validate our calls and handling, not behavior of Google's live services.
Run `npm test` for a fast test run, `npm run typecheck:test` for test-source
type checking, or `npm run test:coverage` to inspect the coverage baseline.

## Architecture

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

## Roadmap

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
