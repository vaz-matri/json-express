import { IConfigProvider } from "@json-express/core";

//#region src/index.d.ts
declare class EnvConfigProvider implements IConfigProvider {
  private config;
  constructor(cwd?: string, env?: string);
  get<T>(key: string, defaultValue?: T): T;
  has(key: string): boolean;
  /** Helper to allow deep merging if the advanced config plugin is also loaded */
  getRawConfig(): Record<string, any>;
}
//#endregion
export { EnvConfigProvider };