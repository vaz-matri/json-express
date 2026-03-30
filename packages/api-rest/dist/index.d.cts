import { IApiGenerator, IConfigProvider, IDatabaseAdapter, RouteDefinition } from "@json-express/core";

//#region src/index.d.ts
declare class RestApiGenerator implements IApiGenerator {
  private db;
  private config?;
  constructor({
    database,
    configProvider
  }: {
    database: IDatabaseAdapter;
    configProvider?: IConfigProvider;
  });
  generate(collections: string[]): RouteDefinition[];
}
//#endregion
export { RestApiGenerator };