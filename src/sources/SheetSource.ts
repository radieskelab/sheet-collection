export interface SheetSource {

    getName(): string;

    getValues(): unknown[][];

    appendRow(values: unknown[]): void;

    appendRows?(values: unknown[][]): void;

    setValues(values: unknown[][]): void;

    clear(): void;

    getLastRow(): number;

    getLastColumn(): number;

}