# Usage examples

These examples are kept outside `src/`; the library build only compiles and
bundles the source code. The test suite is also excluded from the build.

## Google Apps Script

The [Orders.gs](apps-script/Orders.gs) example connects to the active
spreadsheet, creates an `orders` collection (tab) if needed, inserts two
orders, queries them, updates one, and deletes the other. The updated order
remains in the sheet after the function finishes.

### Expected spreadsheet structure

The first insert creates the header row automatically. With this example, the
`orders` tab will have these columns (the generated `id` is added automatically):

| orderNumber | customer | email | status | total | createdAt | id |
| --- | --- | --- | --- | ---: | --- | ---: |
| DEMO-123-001 | Ada Lovelace | ada@example.com | paid | 129.9 | Date/time | Generated number |

The exact generated IDs and timestamps vary. The second sample order is deleted
by the example, so only the updated order remains after it runs.

### Run the example

1. Create or open a Google spreadsheet and open **Extensions > Apps Script**.
   This bound script uses the active spreadsheet.
2. In the Apps Script editor, click **Libraries** > **Add a library** and enter
   the Sheet Collection Script ID:

   ```text
   1uJFD2xU_Teb-lKbxPt5YpFqdl-6C_5GUQNVRLs8Ps3Kb0rjUCxabFXOj
   ```

3. Select the latest library version and keep the identifier
   `SheetCollection`.
4. Create a script file, copy in the contents of
   [Orders.gs](apps-script/Orders.gs), and save.
5. Select `runOrdersCrudExample` in the function menu and click **Run**.
   Approve the requested spreadsheet permissions.
6. Check the `orders` tab for the resulting row and **Executions** (or the
   execution log) for the CRUD results.

For a standalone Apps Script project, provide a spreadsheet ID instead of
using the active spreadsheet:

```javascript
const db = SheetCollection.connect({
  source: "google",
  properties: {
    spreadsheetId: "YOUR_SPREADSHEET_ID"
  }
});
```

## Memory Driver (local)

The [Memory Driver example](memory-driver/index.mjs) exercises the same CRUD
operations locally without connecting to Google Sheets. It uses assertions so
the command also acts as a small runnable test.

From the repository root, run:

```sh
npm run example:memory
```

The command builds the library and then runs the example with Node.js. Data is
kept only in memory and is discarded when the process exits.
