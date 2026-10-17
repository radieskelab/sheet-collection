import { SheetSource } from './SheetSource';

export class MemorySheetSource implements SheetSource {

    private values: unknown[][] = [];

    constructor(
        private readonly name: string,
        initialValues: unknown[][] = []
    ) {
        this.values = initialValues.map(row => [...row]);
    }

    getName(): string {
        return this.name;
    }

    getValues(): unknown[][] {
        return this.values.map(row => [...row]);
    }

    appendRow(values: unknown[]): void {
        this.values.push([...values]);
    }

    appendRows(values: unknown[][]): void {
        values.forEach(row => this.values.push([...row]));
    }

    setValues(values: unknown[][]): void {
        this.values = values.map(row => [...row]);
    }

    clear(): void {
        this.values = [];
    }

    getLastRow(): number {
        return this.values.length;
    }

    getLastColumn(): number {
        if (this.values.length === 0) {
            return 0;
        }

        return Math.max(
            ...this.values.map(row => row.length),
            0
        );
    }

}