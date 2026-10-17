/**
 * Minimal appearance options for a native Google Sheets table.
 */
export interface TableOptions {
  /** The built-in table appearance to use. Defaults to `default`. */
  preset?: 'default';
  /** Optional spreadsheet-wide unique table name. */
  name?: string;
  /** Optional hex colors for the header and alternating body rows. */
  headerColor?: string;
  firstBandColor?: string;
  secondBandColor?: string;
}

/**
 * Options applied when a collection is created.
 */
export interface CollectionOptions {
  /**
   * Enables a native Google Sheets table with the default preset.
   * An options object can customize its name and row colors.
   */
  table?: boolean | TableOptions;
}
