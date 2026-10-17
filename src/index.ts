import { SheetDB } from './core/SheetDB';

const globalScope = typeof globalThis !== "undefined" ? globalThis : this;

/**
 * @preserve
 * SheetDB constructor exposed by the library for advanced use and backwards
 * compatibility. Prefer the documented `connect()` library function.
 */
(globalScope as any).SheetDB = SheetDB;