/**
 * Optional properties supported by a connection's selected driver.
 */
export interface ConnectionConfigProperties {
  /**
   * ID of the Google spreadsheet to open.
   *
   * Required when `properties` is supplied to the Google driver. When omitted
   * entirely, the Google driver uses the active spreadsheet. Ignored by the
   * memory driver.
   */
  spreadsheetId?: string;
}