import { SheetAdapter } from "../adapters/SheetAdapter";
import { SheetSource } from "../sources/SheetSource";

/**
 * Document type accepted by insert operations. The `id` field is optional
 * because the collection generates a numeric ID when one is not provided.
 */
type InsertDocument<T> = T extends { id: infer V }
  ? Omit<T, 'id'> & Partial<Pick<T, 'id'>>
  : T & Partial<Record<'id', unknown>>;

/**
 * @preserve
 * Represents a typed collection backed by a sheet.
 * Documents are plain objects whose property names map to sheet headers.
 * With the Google driver, field values should be scalar values supported by
 * Google Sheets (`string`, `number`, `boolean`, or `Date`); nested objects and
 * arrays are not supported cell values. This type is not runtime schema
 * validation.
 */
export class Collection<T> {

  private readonly adapter: SheetAdapter;

  constructor(
    source: SheetSource
  ) {
    this.adapter = new SheetAdapter(source);
  }

  /**
   * @preserve
   * Returns every row after the header row as a document.
   *
   * Header names become document property names. Values are returned as read
   * by the selected driver; the generic type is not checked at runtime.
   *
   * @returns {Object[]} All documents in the collection, or an empty array
   * when it has no data rows.
   *
   * @example
   * const users = db.collection("users");
   * const allUsers = users.findAll();
   */
  findAll(): T[] {
    return this.adapter.findAll<T>();
  }

  /**
   * @preserve
   * Finds the first document whose `id` matches the supplied identifier.
   *
   * @param {*} id Identifier to search for. IDs are compared using the
   * collection's ID matching rules; numbers and their string forms match.
   * @returns {Object|null} The matching document, or `null` when no document
   * is found.
   *
   * @example
   * const user = users.findById(1);
   */
  findById(
    id: unknown
  ): T | null {
    return this.adapter.findById<T>(
      id
    );
  }

  /**
   * @preserve
   * Inserts one document into the collection.
   *
   * The document's keys are written as headers when the sheet is empty.
   * If `id` is omitted or `null`, a numeric ID is generated. Existing IDs
   * must be unique.
   *
   * @param {Object} document Plain object containing the document fields. On Google
   * Sheets, values should be scalar `string`, `number`, `boolean`, or `Date`
   * values supported by `Range.setValues`.
   * @returns {void}
   * @throws {Error} If the document's ID is already in use or the selected
   * driver rejects a value.
   *
   * @example
   * users.insert({ name: "Ada Lovelace", active: true });
   */
  insert(
    document: InsertDocument<T>
  ): void {
    this.adapter.insert(
      document
    );
  }

  /**
   * @preserve
   * Inserts multiple documents in one operation.
   *
   * Creates headers when needed, preserves document order, and generates
   * numeric IDs for documents without an ID. IDs must be unique both within
   * the input and against existing documents.
   *
   * @param {Object[]} documents Documents to insert. With the Google driver, each field
   * should contain a scalar `string`, `number`, `boolean`, or `Date` value
   * supported by `Range.setValues`.
   * @returns {void}
   * @throws {Error} If an ID is duplicated or the selected driver rejects a
   * value.
   *
   * @example
   * users.insertMany([
   *   { name: "Ada Lovelace" },
   *   { name: "Grace Hopper" }
   * ]);
   */
  insertMany(
    documents: InsertDocument<T>[]
  ): void {
    this.adapter.insertMany(
      documents
    );
  }

  /**
   * @preserve
   * Updates fields of the document with the given `id`.
   *
   * Only the provided fields are changed; fields omitted from `document`
   * remain unchanged.
   *
   * @param {*} id Identifier of the document to update.
   * @param {Object} document Fields and replacement values to write.
   * @returns {boolean} `true` if a matching document was updated; otherwise
   * `false`.
   *
   * @example
   * const updated = users.update(1, { active: false });
   */
  update(
    id: unknown,
    document: Partial<T>
  ): boolean {
    return this.adapter.update(
      id,
      "id",
      document
    );
  }

  /**
   * @preserve
   * Deletes the document with the given `id`.
   *
   * @param {*} id Identifier of the document to delete.
   * @returns {boolean} `true` if a matching document was deleted; otherwise
   * `false`.
   *
   * @example
   * const deleted = users.delete(1);
   */
  delete(
    id: unknown
  ): boolean {
    return this.adapter.delete(
      id,
      "id"
    );
  }

}