import { ConnectionConfig } from "../interfaces/ConnectionConfig";
import { SourceDriver } from "../sources/drivers/SourceDriver";
import { SheetSource } from "../sources/SheetSource";
import { Collection } from "./Collection";
import { Connection } from "./Connection";

/**
 * @preserve
 * SheetDB is the main entrypoint for connecting to a storage source.
 * It exposes a typed collection API over Google Sheets and memory drivers.
 */
export class SheetDB {
  private constructor(
    private readonly driver: SourceDriver
  ) { }

  /**
   * @preserve
   * Creates a connection to a data source.
   *
   * @param config Configuration selecting the `google` or `memory` driver.
   * For Google Sheets, omit `properties` to use the active spreadsheet, or
   * provide `properties.spreadsheetId` to open a specific spreadsheet.
   * @returns A connected database instance.
   * @throws {Error} If the selected driver cannot be initialized.
   *
   * @example
   * const db = SheetCollection.connect({ source: "google" });
   * const users = db.collection("users");
   */
  static connect(
    config: ConnectionConfig
  ): SheetDB {
    const conn = new Connection(config);

    return new SheetDB(
      conn.connect()
    )
  }

  /**
   * @preserve
   * Gets a typed collection backed by a spreadsheet tab or memory sheet.
   *
   * The sheet is created automatically if it does not exist. The generic
   * type describes the document shape expected by the caller; sheet contents
   * are mapped by their header names and are not runtime-validated against it.
   *
   * @typeParam T Type of stored documents.
   * @param {string} name Name of the collection and spreadsheet tab.
   * @returns {Collection} Collection for the requested sheet.
   *
   * @example
   * const users = db.collection("users");
   * users.insert({ name: "Ada Lovelace" });
   */
  collection<T>(
    name: string
  ): Collection<T> {
    const source = this.getOrCreateSheet(name);

    return new Collection<T>(
      source
    );
  }

  /**
   * @preserve
   * Gets an existing sheet without creating it.
   *
   * @param {string} name Name of the spreadsheet tab.
   * @returns {SheetSource} The source for the existing sheet.
   * @throws {Error} If the sheet does not exist.
   */
  getSheet(
    name: string
  ): SheetSource {
    return this.driver.getSheet(name);
  }

  /**
   * @preserve
   * Gets an existing sheet or creates it if it does not exist.
   *
   * @param {string} name Name of the spreadsheet tab.
   * @returns {SheetSource} The source for the existing or newly created sheet.
   */
  getOrCreateSheet(
    name: string
  ): SheetSource {
    return this.driver.getOrCreateSheet(name);
  }
}