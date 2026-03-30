import { IConfigProvider, ITransport, RouteDefinition } from "@json-express/core";

//#region src/index.d.ts
declare class ExpressTransport implements ITransport {
  private app;
  private server;
  private config?;
  constructor({
    configProvider
  }?: {
    configProvider?: IConfigProvider;
  });
  registerRoute(route: RouteDefinition): void;
  start(port: number): Promise<void>;
  stop(): Promise<void>;
}
//#endregion
export { ExpressTransport };