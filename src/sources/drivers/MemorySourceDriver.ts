import { CollectionOptions } from "@interfaces/CollectionOptions";
import { ConnectionConfigProperties } from "@interfaces/ConnectionConfigProperties";
import { MemorySheetSource } from "@sources/MemorySheetSource";
import { SheetSource } from "@sources/SheetSource";
import { SourceDriver } from "@sources/drivers/SourceDriver";

/**
 * @preserve
 * In-memory storage driver intended for tests and temporary data.
 *
 * Collections exist only within this driver instance and are not persisted or
 * shared with Google Sheets. Connection properties are not used.
 */
export class MemorySourceDriver implements SourceDriver {

  private sheets = new Map<
    string,
    MemorySheetSource
  >();

  /**
   * @preserve
   * Creates an empty in-memory driver.
   *
   * @param {Object} [properties] Accepted for the common driver constructor and
   * ignored by this driver.
   * @returns {void}
   */
  constructor(properties?: ConnectionConfigProperties) { }

  /**
   * @preserve
   * Gets a collection that has already been created in this connection.
   *
   * @param {string} collectionName Collection name.
   * @returns {SheetSource} The existing in-memory source.
   * @throws {Error} If the collection does not exist.
   */
  getSheet(
    collectionName: string
  ): SheetSource {
    const sheet = this.sheets.get(collectionName);

    if (!sheet) {
      throw new Error( `Sheet '${collectionName}' não encontrada.`);
    }

    return sheet;
  }

  /**
   * @preserve
   * Gets a collection or creates an empty one.
   *
   * @param {string} collectionName Collection name.
   * @returns {SheetSource} The in-memory source.
   */
  getOrCreateSheet(
    collectionName: string,
    _options?: CollectionOptions
  ): SheetSource {
    let sheet = this.sheets.get(collectionName);

    if (!sheet) {
      sheet = new MemorySheetSource(collectionName);
      this.sheets.set(collectionName, sheet);
    }

    return sheet;
  }
}