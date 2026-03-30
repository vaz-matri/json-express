import { IConfigProvider } from "@json-express/core";

//#region src/index.d.ts
declare class AdvancedConfigProvider implements IConfigProvider {
  private config;
  private constructor();
  static init(cwd?: string, env?: string, envConfigOverrides?: Record<string, any>): Promise<AdvancedConfigProvider>;
  private static parseFile;
  get<T>(key: string, defaultValue?: T): T;
  has(key: string): boolean;
}
//#endregion
export { AdvancedConfigProvider };