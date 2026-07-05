import type {
    IConfigProvider,
    IDocProvider,
    RouteDefinition,
    JsonRequest,
    ILogger,
    ModelSchema
} from '@json-express/core';

export class SwaggerDocProvider implements IDocProvider {
    private logger: ILogger;
    private configProvider?: IConfigProvider;
    private schemas: ModelSchema[] = [];

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider; logger: ILogger }) {
        this.logger = logger.child({ component: 'Docs-Swagger' });
        this.configProvider = configProvider;
        this.logger.info('Interactive Swagger documentation provider initialized.');
    }

    public setSchemas(schemas: ModelSchema[]): void {
        this.schemas = schemas;
    }

    public renderTitle(): string {
        return 'JSON Express API — Interactive Swagger UI';
    }

    public getDocumentationMessage(port: number, path: string): string {
        return [
            `📚 API Documentation (Swagger) available at: ${path}`,
            `🔗 OpenAPI 3.0 Spec available at: ${path}/json`
        ].join('\n');
    }

    private convertPathToOpenApi(path: string): string {
        return path.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
    }

    private resolveBaseUrl(req: JsonRequest): string {
        const hardcodedOverride = this.configProvider?.get<string>('docs.baseUrl');
        const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
        const host = (req.headers['x-forwarded-host'] as string)
            || (req.headers['host'] as string)
            || req.hostname
            || 'localhost';
        const rawPrefix = this.configProvider?.get<string>('api.rest.prefix')
            ?? this.configProvider?.get<string>('api.prefix', '')
            ?? '';
        const prefix = rawPrefix.endsWith('/') ? rawPrefix.slice(0, -1) : rawPrefix;
        return hardcodedOverride || `${proto}://${host}${prefix}`;
    }

    /**
     * Resolve the resource (collection name) for a given route. Schemas are the
     * authoritative source: each schema's `name` is the collection segment used
     * when api-rest mints `${prefix}/${collection}` and `${prefix}/${collection}/:id`.
     * We pick the longest matching name so an `albums-archive` collection isn't
     * shadowed by a shorter `albums`.
     */
    private resolveResource(route: RouteDefinition): string | undefined {
        const segments = route.path.split('/').filter(Boolean);
        if (segments.length === 0) return undefined;

        const schemaNames = this.schemas
            .map(s => s.name)
            .sort((a, b) => b.length - a.length);

        for (const name of schemaNames) {
            if (segments.includes(name)) return name;
        }
        return undefined;
    }

    private capitalize(s: string): string {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    /**
     * Convert one ModelSchema into an OpenAPI components.schemas entry.
     * Only the persisted, framework-known field types — anything exotic
     * degrades to `string` rather than crashing the spec.
     */
    private schemaToOpenApi(schema: ModelSchema): any {
        const properties: Record<string, any> = {};
        const required: string[] = [];

        for (const [key, def] of Object.entries(schema.fields || {})) {
            const fieldDef = def as any;
            const opts = fieldDef.options || {};
            let prop: any;
            switch (fieldDef.type) {
                case 'string':
                    prop = { type: 'string' };
                    if (opts.maxLength) prop.maxLength = opts.maxLength;
                    if (opts.minLength) prop.minLength = opts.minLength;
                    break;
                case 'number':
                    prop = { type: 'number' };
                    if (opts.min !== undefined) prop.minimum = opts.min;
                    if (opts.max !== undefined) prop.maximum = opts.max;
                    break;
                case 'boolean':
                    prop = { type: 'boolean' };
                    break;
                case 'date':
                    prop = { type: 'string', format: 'date-time' };
                    break;
                case 'id':
                    prop = { type: 'string' };
                    break;
                case 'relation':
                    prop = { type: 'string', description: `FK → ${opts.target}` };
                    break;
                default:
                    prop = { type: 'string' };
            }
            if (opts.default !== undefined) prop.default = opts.default;
            properties[key] = prop;
            if (opts.required) required.push(key);
        }

        const out: any = { type: 'object', properties };
        if (required.length) out.required = required;
        return out;
    }

    /**
     * Translates JSON Express Routes into OpenAPI 3.0.0 Path Objects.
     * Schemas (when provided via setSchemas) drive resource grouping and
     * request/response body shapes; falls back to per-route inference
     * when schemas are not available.
     */
    private generateOpenApiSpec(routes: RouteDefinition[], baseUrl: string): any {
        const paths: Record<string, any> = {};
        const componentSchemas: Record<string, any> = {};
        const tagSet = new Map<string, string>();

        for (const schema of this.schemas) {
            // Fieldless models declare behavior only — no entity schema to emit.
            // Their custom endpoints are still documented via the routes loop below.
            if (!schema.fields) continue;
            const componentName = this.capitalize(schema.name);
            componentSchemas[componentName] = this.schemaToOpenApi(schema);
            tagSet.set(componentName, `Operations on the ${schema.name} collection.`);
        }

        for (const route of routes) {
            const method = route.method.toLowerCase();
            const openApiPath = this.convertPathToOpenApi(route.path);

            if (!paths[openApiPath]) paths[openApiPath] = {};

            const resource = this.resolveResource(route);
            const tag = resource ? this.capitalize(resource) : 'General';
            if (resource && !tagSet.has(tag)) {
                tagSet.set(tag, `Operations on the ${resource} collection.`);
            }

            const op: any = {
                summary: `Operation on ${route.path}`,
                description: `Standard ${method.toUpperCase()} endpoint managed by JSON Express.`,
                tags: [tag],
                parameters: this.extractPathParams(route.path),
                responses: {
                    200: {
                        description: 'Successful operation',
                        content: {
                            'application/json': {
                                schema: resource && componentSchemas[this.capitalize(resource)]
                                    ? { $ref: `#/components/schemas/${this.capitalize(resource)}` }
                                    : { type: 'object' }
                            }
                        }
                    }
                }
            };

            if (route.metadata?.isProtected) {
                op.security = [{ bearerAuth: [] }];
            }

            // Request-body shape: prefer the model schema for the resource.
            // Validation middleware may also attach a Zod schema in metadata —
            // honor it as an override when present.
            if (['post', 'patch', 'put'].includes(method)) {
                let bodySchema: any = { type: 'object' };
                const componentName = resource ? this.capitalize(resource) : undefined;
                if (componentName && componentSchemas[componentName]) {
                    bodySchema = { $ref: `#/components/schemas/${componentName}` };
                }
                if (route.metadata?.schema) {
                    const s = route.metadata.schema;
                    if (s._def?.typeName === 'ZodObject' || s.shape) {
                        bodySchema = this.convertZodToOpenApi(s);
                    }
                }
                op.requestBody = {
                    content: {
                        'application/json': {
                            schema: bodySchema
                        }
                    }
                };
            }

            paths[openApiPath][method] = op;
        }

        return {
            openapi: '3.0.0',
            info: {
                title: 'JSON Express API',
                version: '1.0.0',
                description: 'Auto-generated interactive API documentation.'
            },
            servers: [{ url: baseUrl }],
            tags: Array.from(tagSet.entries()).map(([name, description]) => ({ name, description })),
            paths,
            components: {
                schemas: componentSchemas,
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        };
    }

    public getManifest(routes: RouteDefinition[], req: JsonRequest): any {
        return this.generateOpenApiSpec(routes, this.resolveBaseUrl(req));
    }

    public renderDocumentation(routes: RouteDefinition[], path: string, req: JsonRequest): string {
        // Configurable (jex.docs.swagger.assetsBaseUrl) so airgapped deployments
        // can point at an internal mirror instead of unpkg.
        const assetsBase = (this.configProvider?.get<string>(
            'docs.swagger.assetsBaseUrl',
            'https://unpkg.com/swagger-ui-dist@5.11.0'
        ) ?? 'https://unpkg.com/swagger-ui-dist@5.11.0').replace(/\/$/, '');
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${this.renderTitle()}</title>
    <link rel="stylesheet" type="text/css" href="${assetsBase}/swagger-ui.css">
    <link rel="icon" type="image/png" href="${assetsBase}/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="${assetsBase}/favicon-16x16.png" sizes="16x16" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="${assetsBase}/swagger-ui-bundle.js" charset="UTF-8"></script>
    <script src="${assetsBase}/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
    <script>
    window.onload = function() {
        const ui = SwaggerUIBundle({
            url: "${path}/json",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "BaseLayout",
            persistAuthorization: true,
        });
        window.ui = ui;
    };
    </script>
</body>
</html>
        `;
    }

    private extractPathParams(path: string): any[] {
        const params: any[] = [];
        const matches = path.match(/:[a-zA-Z0-9]+/g);
        if (matches) {
            for (const match of matches) {
                params.push({
                    name: match.replace(':', ''),
                    in: 'path',
                    required: true,
                    schema: { type: 'string' }
                });
            }
        }
        return params;
    }

    private convertZodToOpenApi(zodSchema: any): any {
        const schema: any = { type: 'object', properties: {}, required: [] };
        if (!zodSchema.shape) return schema;

        for (const [key, prop] of Object.entries(zodSchema.shape)) {
            const def = (prop as any)._def;
            if (!def) continue;

            const isOptional = def.typeName === 'ZodOptional' || def.typeName === 'ZodDefault';
            const innerDef = isOptional && def.innerType ? def.innerType._def : def;

            if (!isOptional) {
                schema.required.push(key);
            }

            const typeName = innerDef?.typeName || def.typeName;
            if (typeName === 'ZodString') schema.properties[key] = { type: 'string' };
            else if (typeName === 'ZodNumber') schema.properties[key] = { type: 'number' };
            else if (typeName === 'ZodBoolean') schema.properties[key] = { type: 'boolean' };
            else if (typeName === 'ZodArray') schema.properties[key] = { type: 'array', items: {} };
            else if (typeName === 'ZodObject') schema.properties[key] = this.convertZodToOpenApi(isOptional ? def.innerType : prop);
            else schema.properties[key] = { type: 'string' };
        }

        if (schema.required.length === 0) delete schema.required;
        return schema;
    }
}

export default SwaggerDocProvider;
