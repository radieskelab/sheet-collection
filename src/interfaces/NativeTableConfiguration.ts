import { TableOptions } from "@interfaces/CollectionOptions";

export interface NativeTableConfiguration {
  spreadsheetId: string;
  collectionName: string;
  options: TableOptions;
}
