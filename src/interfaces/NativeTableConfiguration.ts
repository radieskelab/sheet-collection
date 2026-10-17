import { TableOptions } from "./CollectionOptions";

export interface NativeTableConfiguration {
  spreadsheetId: string;
  collectionName: string;
  options: TableOptions;
}
