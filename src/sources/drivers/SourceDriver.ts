import { SheetSource } from "../SheetSource";
import { CollectionOptions } from "../../interfaces/CollectionOptions";

/**
 * Contract implemented by storage drivers used by SheetDB.
 *
 * Drivers provide access to named collections as sheet-like sources.
 */
export interface SourceDriver  {

  /**
   * Opens an existing collection.
   *
   * @param name Collection or sheet name.
   * @returns The existing collection source.
   * @throws {Error} If the collection does not exist.
   */
  getSheet(name: string): SheetSource;

  /**
   * Opens a collection or creates it when it does not exist.
   *
   * @param name Collection or sheet name.
   * @returns The collection source.
   */
  getOrCreateSheet(name: string, options?: CollectionOptions): SheetSource;

}