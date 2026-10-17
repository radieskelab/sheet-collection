import { ConnectionConfigProperties } from "../../interfaces/ConnectionConfigProperties";
import { GASSheetSource } from "../GASSheetSource";
import { SheetSource } from "../SheetSource";
import { SourceDriver } from "./SourceDriver";

/**
 * @preserve
 * Google Sheets storage driver for Google Apps Script.
 *
 * Omitting connection properties uses the active spreadsheet. If properties
 * are provided, `spreadsheetId` is required. Document cell values must be
 * supported by Google Sheets `Range.setValues` (strings, numbers, booleans,
 * or dates); strings beginning with `=` are interpreted as formulas by Sheets.
 */
export class GASSourceDriver implements SourceDriver {

  private spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

  /**
   * @preserve
   * Creates a driver for the active spreadsheet or a spreadsheet by ID.
   *
   * @param {Object} [properties] Optional driver properties.
   * @param {string} [properties.spreadsheetId] ID of the spreadsheet to open.
   * @returns {void}
   * @throws {Error} If no active spreadsheet exists or a supplied ID is missing.
   */
  constructor(properties?: ConnectionConfigProperties) {
    if (!properties) {
      this.spreadsheet = this.getActiveSpreadsheet(); 
      return;
    }

    if (!properties.spreadsheetId) throw new Error("ID da Planilha não foi informado.");

    const spreadsheet = SpreadsheetApp.openById(properties.spreadsheetId);

    if (!spreadsheet) throw new Error("Planilha não foi encontrada.");

    this.spreadsheet = spreadsheet;
  }

  /**
   * @preserve
   * Gets an existing spreadsheet tab.
   *
   * @param {string} collectionName Name of the tab.
   * @returns {SheetSource} The source wrapping the existing tab.
   * @throws {Error} If the tab does not exist.
   */
  getSheet(
    collectionName: string
  ): SheetSource {
    let sheet = this.spreadsheet.getSheetByName(
        collectionName
    );

    if (!sheet) throw new Error("Aba informada não foi encontrada.");

    return new GASSheetSource(
      sheet
    );
  }

  /**
   * @preserve
   * Gets a spreadsheet tab, creating it when needed.
   *
   * @param {string} collectionName Name of the tab.
   * @returns {SheetSource} The source wrapping the tab.
   */
  getOrCreateSheet(
    collectionName: string
  ): SheetSource {
    const existing = this.spreadsheet.getSheetByName(
        collectionName
    );

    if (existing) return new GASSheetSource(existing);

    return new GASSheetSource(
      this.spreadsheet.insertSheet(collectionName)
    );
  }

  private getActiveSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    const active = SpreadsheetApp.getActiveSpreadsheet();

    if (!active) throw new Error("Nenhuma planilha ativa encontrada.");

    return active
  }
}