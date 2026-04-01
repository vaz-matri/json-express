//#region ../core/dist/index.d.mts
/**
 * 3. The Database Adapter Contract
 * Any database plugin (Memory, Mongo, Postgres) MUST implement these methods.
 */
interface IDatabaseAdapter {
  getAll(collection: string): Promise<any[]>;
  getById(collection: string, id: string): Promise<any>;
  search(collection: string, query: Record<string, any>): Promise<any[]>;
  create(collection: string, data: any): Promise<any>;
  update(collection: string, id: string, data: any): Promise<any>;
  delete(collection: string, id: string): Promise<any>;
}
/**
 * 4. The Transport Server Contract
 * Any server plugin (Express, Fastify) MUST implement these methods.
 */
/**
 * 7. The Configuration Provider Contract
 * Supplies configuration values to all other plugins during the boot sequence.
 */
interface IConfigProvider {
  get<T>(key: string, defaultValue?: T): T;
  has(key: string): boolean;
} //#endregion
//#region src/kernel.d.ts
//#endregion
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