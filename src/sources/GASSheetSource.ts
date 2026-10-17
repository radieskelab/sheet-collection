import { NativeTableConfiguration } from "@interfaces/NativeTableConfiguration";
import { NativeTableState } from "@interfaces/NativeTableServiceInterfaces";
import { SheetSource } from "@sources/SheetSource";
import { NativeTableService } from "@sources/NativeTableService";

/**
 * 
 * Google App Script
 * 
 */
export class GASSheetSource implements SheetSource {

    constructor(
        private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet,
        table?: NativeTableConfiguration
    ) {
        this.tableService = table
            ? new NativeTableService(
                table.spreadsheetId,
                sheet.getSheetId(),
                table.collectionName,
                table.options
            )
            : undefined;
    }

    private readonly tableService?: NativeTableService;

    getName(): string {
        return this.sheet.getName();
    }

    getValues(): unknown[][] {
        const table = this.getNativeTable(true);

        if (this.tableService && !table) {
            return [];
        }

        if (table) {
            const rowCount = table.range.endRowIndex - table.range.startRowIndex;
            const columnCount = table.range.endColumnIndex - table.range.startColumnIndex;
            const values = this.sheet.getRange(
                table.range.startRowIndex + 1,
                table.range.startColumnIndex + 1,
                rowCount,
                columnCount
            ).getValues();
            while (values.length > 1 && this.isEmptyRow(values[values.length - 1])) {
                values.pop();
            }
            return values;
        }

        return this.sheet
            .getDataRange()
            .getValues()
    }

    appendRow(values: unknown[]): void {
        this.appendRows([values]);
    }

    appendRows(values: unknown[][]): void {
        if (values.length === 0) {
            return;
        }

        const table = this.getNativeTable(true);

        if (table && this.tableService) {
            const rowCount = table.range.endRowIndex - table.range.startRowIndex;
            const columnCount = table.range.endColumnIndex - table.range.startColumnIndex;
            const tableValues = this.sheet.getRange(
                table.range.startRowIndex + 1,
                table.range.startColumnIndex + 1,
                rowCount,
                columnCount
            ).getValues();
            let lastNonEmptyRow = 0;

            tableValues.forEach((row, index) => {
                if (!this.isEmptyRow(row)) {
                    lastNonEmptyRow = index;
                }
            });

            const insertionOffset = lastNonEmptyRow + 1;
            const insertionRow = table.range.startRowIndex + insertionOffset;
            const requiredEndRow = insertionRow + values.length;
            const currentEndRow = table.range.endRowIndex;

            if (requiredEndRow > currentEndRow) {
                this.tableService.resizeTableRows(
                    table,
                    requiredEndRow - table.range.startRowIndex
                );
            }

            this.sheet.getRange(
                insertionRow + 1,
                table.range.startColumnIndex + 1,
                values.length,
                values[0].length
            ).setValues(values);
            return;
        }

        this.sheet.getRange(
            this.sheet.getLastRow() + 1,
            1,
            values.length,
            values[0].length
        ).setValues(values);
    }

    setValues(values: unknown[][]): void {
        if (this.tableService) {
            this.setTableValues(values);
            return;
        }

        const newRows = values.length;
        const newColumns = values[0]?.length ?? 0;

        const currentRows = this.sheet.getLastRow();
        const currentColumns = this.sheet.getLastColumn();

        if (newRows > 0) {
            this.sheet
                .getRange(1, 1, newRows, newColumns)
                .setValues(values);
        }

        if (currentRows > newRows) {
            this.sheet
                .getRange(
                    newRows + 1,
                    1,
                    currentRows - newRows,
                    Math.max(currentColumns, newColumns)
                )
                .clearContent();
        }
    }

    clear(): void {
        const table = this.tableService?.findTable(true);
        if (table) {
            this.tableService!.deleteTable(table);
        }
        this.sheet.clear();
    }

    getLastRow(): number {
        const table = this.getNativeTable();
        if (table) {
            return table.range.endRowIndex - table.range.startRowIndex;
        }
        return this.sheet.getLastRow();
    }

    getLastColumn(): number {
        const table = this.getNativeTable();
        if (table) {
            return table.range.endColumnIndex - table.range.startColumnIndex;
        }
        return this.sheet.getLastColumn();
    }

    private setTableValues(values: unknown[][]): void {
        const currentTable = this.getNativeTable();

        if (values.length === 0 || (values[0]?.length ?? 0) === 0) {
            if (currentTable) {
                throw new Error('Uma tabela nativa precisa manter ao menos a linha de cabeçalho.');
            }
            return;
        }

        this.tableService!.validateValues(values);

        if (!currentTable) {
            this.writeValues(0, 0, values);
            const created = this.tableService!.createTable(values);
            this.clearStaleCells(created.range, values.length, values[0].length);
            return;
        }

        const oldRange = currentTable.range;
        this.tableService!.resizeTable(currentTable, values);
        this.writeValues(
            oldRange.startRowIndex,
            oldRange.startColumnIndex,
            values
        );
        this.clearStaleCells(oldRange, values.length, values[0].length);
    }

    private writeValues(
        startRowIndex: number,
        startColumnIndex: number,
        values: unknown[][]
    ): void {
        this.sheet.getRange(
            startRowIndex + 1,
            startColumnIndex + 1,
            values.length,
            values[0].length
        ).setValues(values);
    }

    private clearStaleCells(
        previousRange: NativeTableState['range'],
        newRowCount: number,
        newColumnCount: number
    ): void {
        const previousRows = previousRange.endRowIndex - previousRange.startRowIndex;
        const previousColumns = previousRange.endColumnIndex - previousRange.startColumnIndex;

        if (previousRows > newRowCount) {
            this.sheet.getRange(
                previousRange.startRowIndex + newRowCount + 1,
                previousRange.startColumnIndex + 1,
                previousRows - newRowCount,
                previousColumns
            ).clearContent();
        }
        if (previousColumns > newColumnCount) {
            this.sheet.getRange(
                previousRange.startRowIndex + 1,
                previousRange.startColumnIndex + newColumnCount + 1,
                Math.min(previousRows, newRowCount),
                previousColumns - newColumnCount
            ).clearContent();
        }
    }

    private getNativeTable(refresh = false): NativeTableState | null {
        if (!this.tableService) {
            return null;
        }

        const table = this.tableService.findTable(refresh);
        if (table || this.sheet.getLastRow() === 0 || this.sheet.getLastColumn() === 0) {
            return table;
        }

        const existingValues = this.sheet.getDataRange().getValues();
        return this.tableService.createTable(existingValues);
    }

    private isEmptyRow(row: unknown[]): boolean {
        return row.every(value => value === '' || value === null || value === undefined);
    }

}