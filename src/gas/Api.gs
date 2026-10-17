/**
 * Connects to a Sheet Collection data source.
 *
 * Use the Google Sheets driver with the active spreadsheet, or provide a
 * spreadsheet ID. The memory driver is temporary and exists only in memory.
 *
 * @param {Object} config Connection configuration.
 * @param {"google"|"memory"} config.source Data source driver.
 * @param {Object} [config.properties] Optional driver-specific properties.
 * @param {string} [config.properties.spreadsheetId] Spreadsheet ID. Required
 * when properties are provided for the Google Sheets driver.
 * @return {SheetDB} Connected database instance.
 * @throws {Error} If the selected driver cannot be initialized.
 *
 * @example
 * const db = SheetCollection.connect({ source: "google" });
 * const users = db.collection("users");
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
