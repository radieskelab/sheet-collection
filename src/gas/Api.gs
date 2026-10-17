/**
 * Connects to a Sheet Collection data source.
 *
 * The returned database provides `collection(name)`. A collection provides
 * `findAll`, `findById`, `insert`, `insertMany`, `update`, and `delete`.
 * The Apps Script editor may not show completion for members of returned
 * library objects; see the library API reference for method details.
 *
 * @param {Object} config Connection configuration.
 * @param {"google"|"memory"} config.source Storage driver to use.
 * Use `google` for Google Sheets or `memory` for temporary in-memory data.
 * @param {Object} [config.properties] Optional driver-specific settings.
 * @param {string} [config.properties.spreadsheetId] Google spreadsheet ID.
 * Required when properties are supplied for the Google driver. If properties
 * are omitted, the Google driver uses the active spreadsheet.
 * @return {SheetDB} Connected database instance. Use `db.collection(name)` to
 * access a sheet-backed collection.
 * @throws {Error} If the driver cannot be initialized or its configuration is
 * invalid.
 *
 * @example
 * const db = SheetCollection.connect({ source: "google" });
 * const clients = db.collection("clients");
 * clients.insert({ name: "Ada Lovelace" });
 * const allClients = clients.findAll();
 * const client = clients.findById(1);
 * clients.update(1, { name: "Ada" });
 * clients.delete(1);
 *
 * @example
 * const db = SheetCollection.connect({
 *   source: "google",
 *   properties: { spreadsheetId: "YOUR_SPREADSHEET_ID" }
 * });
 */
function connect(config) {
  return SheetDB.connect(config);
}
