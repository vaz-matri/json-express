import { IConfigProvider, IDatabaseAdapter } from "@json-express/core";

//#region src/index.d.ts
declare class MemoryDatabaseAdapter implements IDatabaseAdapter {
  private store;
  private config?;
  constructor({
    configProvider
  }?: {
    configProvider?: IConfigProvider;
  });
  /**
   * Helper method to load the initial JSON data into memory
   */
  loadData(initialData: Record<string, any[]>): void;
  private hasRef;
  private getRefs;
  private findById;
  getAll(collection: string): Promise<any[]>;
  getById(collection: string, id: string): Promise<any>;
  search(collection: string, query: Record<string, any>): Promise<any[]>;
  create(collection: string, data: any): Promise<any>;
  update(collection: string, id: string, data: any): Promise<any>;
  delete(collection: string, id: string): Promise<any>;
}
//#endregion
export { MemoryDatabaseAdapter };