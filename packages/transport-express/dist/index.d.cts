import { ITransport, RouteDefinition } from "@json-express/core";

//#region src/index.d.ts
declare class ExpressTransport implements ITransport {
  private app;
  private server;
  constructor();
  /**
   * Translates a generic RouteDefinition into an Express route
   */
  registerRoute(route: RouteDefinition): void;
  /**
   * Starts the Express server
   */
  start(port: number): Promise<void>;
  /**
   * Stops the Express server safely
   */
  stop(): Promise<void>;
}
//#endregion
export { ExpressTransport };