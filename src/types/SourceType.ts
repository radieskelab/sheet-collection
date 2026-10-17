/**
 * Built-in storage drivers accepted by {@link ConnectionConfig}.
 *
 * `google` uses Google Sheets through Apps Script; `memory` stores data only
 * in the current in-memory connection.
 */
export type SourceType =
  | "google"
  | "memory";