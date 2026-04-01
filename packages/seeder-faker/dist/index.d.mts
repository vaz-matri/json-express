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
}
/**
 * 8. The Seeder Contract
 * Generates initial data dynamically
 */
interface ISeeder {
  name: string;
  seed(database: IDatabaseAdapter, isForce: boolean): Promise<void>;
} //#endregion
//#region src/kernel.d.ts
//#endregion
//#region src/index.d.ts
interface FakerConfig {
  mode?: 'auto' | 'manual';
  count?: number;
  collections?: Record<string, number | (() => any)>;
}
declare class FakerSeeder implements ISeeder {
  readonly name = "faker";
  private config;
  constructor({
    configProvider
  }: {
    configProvider?: IConfigProvider;
  });
  private getDefaultSchema;
  seed(database: IDatabaseAdapter, isForce: boolean): Promise<void>;
}
//#endregion
export { FakerConfig, FakerSeeder };