import { RowMapper } from "../mappers/RowMapper";
import { SheetSource } from "../sources/SheetSource";

export class SheetAdapter {

  constructor(
    private readonly source: SheetSource
  ) { }

  findAll<T>(): T[] {
    const values = this.source.getValues();

    if (values.length === 0) {
      return [];
    }

    const [headerRow, ...rows] = values;

    const headers = headerRow.map(String);

    return rows.map(row =>
      RowMapper.toDocument<T>(
        headers,
        row
      )
    );
  }

  findById<T>(
    id: unknown,
    primaryKey = "id"
  ): T | null {
    return (
      this.findAll<Record<string, unknown>>()
        .find(document =>
          this.areIdsEqual(
            document[primaryKey],
            id
          )
        ) as T | undefined
    ) ?? null;
  }

  insert<T>(
    document: T
  ): void {
    const values = this.source.getValues();

    const record =
      this.ensureDocumentHasId(
        document,
        values
      );

    if (this.source.getLastRow() === 0) {
      const headers = Object.keys(record);

      this.source.setValues([
        headers,
        RowMapper.toRow(
          record,
          headers
        )
      ]);

      return;
    }

    const currentHeaders = values[0].map(String);
    const headers = [...currentHeaders];

    Object.keys(record).forEach(header => {
      if (!headers.includes(header)) {
        headers.push(header);
      }
    });

    if (headers.length !== currentHeaders.length) {
      const existingRows = values
        .slice(1)
        .map(row => {
          const normalized = [...row];

          while (normalized.length < headers.length) {
            normalized.push(undefined);
          }

          return normalized;
        });

      this.source.setValues([
        headers,
        ...existingRows,
        RowMapper.toRow(record, headers)
      ]);

      return;
    }

    this.source.appendRow(RowMapper.toRow(record, headers));
  }

  insertMany<T>(
    documents: T[]
  ): void {
    if (documents.length === 0) {
      return;
    }

    const values = this.source.getValues();
    const currentHeaders = values.length === 0
      ? []
      : values[0].map(String);

    const headers = this.mergeHeaders(
      currentHeaders,
      documents
    );

    const usedIds = new Set<string>(
      currentHeaders.includes('id')
        ? values
          .slice(1)
          .map(row => String(row[currentHeaders.indexOf('id')]))
        : []
    );

    const records = documents.map(document => {
      const record = { ...document } as Record<string, unknown>;

      if (this.hasId(record)) {
        const idString = String(record.id);

        if (usedIds.has(idString)) {
          throw new Error(
            `ID '${record.id}' is already in use.`
          );
        }

        usedIds.add(idString);

        return record;
      }

      const generatedId = this.generateNextId(
        values,
        currentHeaders,
        usedIds
      );

      record.id = generatedId;
      usedIds.add(String(generatedId));

      return record;
    });

    if (values.length === 0) {
      this.source.setValues([
        headers,
        ...records.map(record =>
          RowMapper.toRow(record, headers)
        )
      ]);

      return;
    }

    const updatedRows = values
      .slice(1)
      .map(row => {
        const normalized = [...row];

        while (normalized.length < headers.length) {
          normalized.push(undefined);
        }

        return normalized;
      });

    this.source.setValues([
      headers,
      ...updatedRows,
      ...records.map(record =>
        RowMapper.toRow(record, headers)
      )
    ]);
  }

  private mergeHeaders<T>(
    currentHeaders: string[],
    documents: T[]
  ): string[] {
    const headers = [...currentHeaders];

    documents.forEach(document => {
      Object.keys(document as Record<string, unknown>)
        .forEach(header => {
          if (!headers.includes(header)) {
            headers.push(header);
          }
        });
    });

    const needsIdHeader =
      !headers.includes('id') &&
      documents.some(document =>
        !this.hasId(document as Record<string, unknown>)
      );

    if (needsIdHeader) {
      headers.push('id');
    }

    return headers;
  }

  private generateNextId(
    values: unknown[][],
    headers: string[],
    usedIds: Set<string>
  ): number {
    let candidate = 1;

    if (headers.indexOf('id') !== -1) {
      const idIndex = headers.indexOf('id');

      const existingIds = values
        .slice(1)
        .map(row => row[idIndex]);

      const numericValues = existingIds
        .map(id => {
          if (typeof id === 'number') {
            return id;
          }

          if (typeof id === 'string') {
            const parsed = Number(id);
            return Number.isFinite(parsed)
              ? parsed
              : NaN;
          }

          return NaN;
        })
        .filter(Number.isFinite as (value: number) => boolean);

      candidate = numericValues.length > 0
        ? Math.max(...numericValues) + 1
        : 1;
    }

    while (usedIds.has(String(candidate))) {
      candidate += 1;
    }

    return candidate;
  }

  private ensureDocumentHasId<T>(
    document: T,
    values: unknown[][]
  ): Record<string, unknown> {
    const record = {
      ...document
    } as Record<string, unknown>;

    const headers = values.length === 0
      ? []
      : values[0].map(String);

    if (this.hasId(record)) {
      this.ensureUniqueId(
        record,
        values,
        headers
      );

      return record;
    }

    record.id = this.generateId(
      values,
      headers
    );

    return record;
  }

  private hasId(
    record: Record<string, unknown>
  ): boolean {
    return (
      Object.prototype.hasOwnProperty.call(
        record,
        'id'
      ) &&
      record.id !== undefined &&
      record.id !== null
    );
  }

  private ensureUniqueId(
    record: Record<string, unknown>,
    values: unknown[][],
    headers: string[]
  ): void {
    const idIndex = headers.indexOf('id');

    if (idIndex === -1) {
      return;
    }

    const existingIds = values
      .slice(1)
      .map(row => row[idIndex]);

    if (this.isIdUsed(record.id, existingIds)) {
      throw new Error(
        `ID '${record.id}' is already in use.`
      );
    }
  }

  private generateId(
    values: unknown[][],
    headers: string[]
  ): number {
    if (values.length === 0 || headers.indexOf('id') === -1) {
      return 1;
    }

    const idIndex = headers.indexOf('id');

    const existingIds = values
      .slice(1)
      .map(row => row[idIndex]);

    const occupied = new Set(existingIds);
    const stringOccupied = new Set(existingIds.map(String));

    const numericValues = existingIds
      .map(id => {
        if (typeof id === 'number') {
          return id;
        }

        if (typeof id === 'string') {
          const parsed = Number(id);
          return Number.isFinite(parsed)
            ? parsed
            : NaN;
        }

        return NaN;
      })
      .filter(Number.isFinite);

    let candidate =
      numericValues.length > 0
        ? Math.max(...numericValues) + 1
        : 1;

    while (
      occupied.has(candidate) ||
      stringOccupied.has(String(candidate))
    ) {
      candidate += 1;
    }

    return candidate;
  }

  private isIdUsed(
    id: unknown,
    ids: unknown[]
  ): boolean {
    return ids.some(existing =>
      this.areIdsEqual(existing, id)
    );
  }

  private areIdsEqual(
    left: unknown,
    right: unknown
  ): boolean {
    if (left === right) {
      return true;
    }

    if (
      left === undefined ||
      left === null ||
      right === undefined ||
      right === null
    ) {
      return false;
    }

    return String(left) === String(right);
  }

  update<T>(
    id: unknown,
    primaryKey: string,
    document: Partial<T>
  ): boolean {

    const values = this.source.getValues();

    if (values.length === 0) {
      return false;
    }

    const [headerRow, ...rows] = values;

    const headers = headerRow.map(String);

    const rowIndex =
      rows.findIndex(row => {

        const current =
          RowMapper.toDocument<
            Record<string, unknown>
          >(
            headers,
            row
          );

        return this.areIdsEqual(
          current[primaryKey],
          id
        );
      });

    if (rowIndex === -1) {
      return false;
    }

    const current =
      RowMapper.toDocument<
        Record<string, unknown>
      >(
        headers,
        rows[rowIndex]
      );

    const updated = {
      ...current,
      ...document
    };

    rows[rowIndex] =
      RowMapper.toRow(
        updated,
        headers
      );

    this.source.setValues([
      headers,
      ...rows
    ]);

    return true;
  }

  delete(
    id: unknown,
    primaryKey: string
  ): boolean {

    const values = this.source.getValues();

    if (values.length === 0) {
      return false;
    }

    const [headerRow, ...rows] = values;

    const headers = headerRow.map(String);

    const filtered =
      rows.filter(row => {

        const current =
          RowMapper.toDocument<
            Record<string, unknown>
          >(
            headers,
            row
          );

        return !this.areIdsEqual(
          current[primaryKey],
          id
        );
      });


    if (filtered.length === rows.length) {
      return false;
    }

    this.source.setValues([
      headers,
      ...filtered
    ]);

    return true;
  }

}