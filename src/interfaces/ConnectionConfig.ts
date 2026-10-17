import { SourceType } from "../types/SourceType";
import { ConnectionConfigProperties } from "./ConnectionConfigProperties";

/**
 * Configuration used to connect to a Sheet Collection data source.
 *
 * For the Google driver, omitting `properties` uses the active spreadsheet.
 * If `properties` is provided, it must include `spreadsheetId`. The memory
 * driver keeps data in memory for the lifetime of its connection.
 */
export interface ConnectionConfig {
  /** Storage driver to use: Google Sheets or an in-memory source. */
  source: SourceType;

  /** Optional properties for the selected driver. */
  properties?: ConnectionConfigProperties;
}