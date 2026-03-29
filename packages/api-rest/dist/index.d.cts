import { IApiGenerator, IDatabaseAdapter, RouteDefinition } from "@json-express/core";

//#region src/index.d.ts
declare class RestApiGenerator implements IApiGenerator {
  private db;
  /**
   * Awilix will automatically inject the active database adapter here.
   * It could be Mongo, Postgres, or the local Memory adapter — this class
   * doesn't need to know, as long as IDatabaseAdapter is fulfilled.
   */
  constructor({
    database
  }: {
    database: IDatabaseAdapter;
  });
  /**
   * Iterates over all discovered collections and generates standard
   * RESTful RouteDefinitions (GET, POST, PATCH, DELETE) for each.
   *
   * For a collection named "albums", this produces:
   *   GET    /albums          → db.getAll / db.search (if query params present)
   *   GET    /albums/:id      → db.getById
   *   POST   /albums          → db.create
   *   PATCH  /albums/:id      → db.update
   *   DELETE /albums/:id      → db.delete
   */
  generate(collections: string[]): RouteDefinition[];
}
//#endregion
export { RestApiGenerator };