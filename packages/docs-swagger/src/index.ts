import type {
    IConfigProvider,
    IDocProvider,
    RouteDefinition,
    ILogger
} from '@json-express/core';

export class SwaggerDocProvider implements IDocProvider {
    private logger?: ILogger;

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider; logger?: ILogger } = {}) {
        this.logger = logger?.child({ component: 'Docs-Swagger' });
        this.logger?.info('Interactive Swagger documentation provider initialized.');
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

    /**
     * Translates JSON Express Routes into OpenAPI 3.0.0 Path Objects
     */
    private generateOpenApiSpec(routes: RouteDefinition[]): any {
        const paths: Record<string, any> = {};

        for (const route of routes) {
            const method = route.method.toLowerCase();
            const openApiPath = this.convertPathToOpenApi(route.path);

            if (!paths[openApiPath]) paths[openApiPath] = {};

            paths[openApiPath][method] = {
                summary: `Operation on ${route.path}`,
                description: `Standard ${method.toUpperCase()} endpoint managed by JSON Express.`,
                tags: [this.extractResource(route.path)],
                parameters: this.extractPathParams(route.path),
                responses: {
                    200: {
                        description: 'Successful operation',
                        content: {
                            'application/json': {
                                schema: { type: 'object' }
                            }
                        }
                    }
                }
            };

            // 🔐 Security Metadata Interpretation
            if (route.metadata?.isProtected) {
                paths[openApiPath][method].security = [{ bearerAuth: [] }];
            }

            // 📄 Schema Metadata Interpretation (Zod -> OpenAPI 3)
            let requestSchema: any = { type: 'object' };
            if (route.metadata?.schema) {
                const s = route.metadata.schema;
                console.log(`[Docs Swagger] Intercepted schema for ${method} ${openApiPath}`, !!s.shape);
                if (s._def?.typeName === 'ZodObject' || s.shape) {
                    requestSchema = this.convertZodToOpenApi(s);
                    console.log(`[Docs Swagger] Converted Schema:`, JSON.stringify(requestSchema));
                } else {
                    requestSchema = { type: 'object', description: 'Opaque Schema' };
                }
            }

            // Add request body for mutation methods
            if (['post', 'patch', 'put'].includes(method)) {
                paths[openApiPath][method].requestBody = {
                    content: {
                        'application/json': {
                            schema: requestSchema
                        }
                    }
                };
            }
        }

        return {
            openapi: '3.0.0',
            info: {
                title: 'JSON Express API',
                version: '1.0.0',
                description: 'Auto-generated interactive API documentation.'
            },
            paths,
            components: {
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

    public getManifest(routes: RouteDefinition[]): any {
        return this.generateOpenApiSpec(routes);
    }

    public renderDocumentation(routes: RouteDefinition[], path: string): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${this.renderTitle()}</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" sizes="32x32" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-16x16.png" sizes="16x16" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
        /* Modern aesthetic overrides */
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 0; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" charset="UTF-8"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
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

    private extractResource(path: string): string {
        const parts = path.split('/');
        return parts[3] ? parts[3].charAt(0).toUpperCase() + parts[3].slice(1) : 'General';
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
        // Fallback for non-zod objects natively mapped
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
            else if (typeName === 'ZodArray') schema.properties[key] = { type: 'array', items: {} }; // Basic fallback
            else if (typeName === 'ZodObject') schema.properties[key] = this.convertZodToOpenApi(isOptional ? def.innerType : prop);
            else schema.properties[key] = { type: 'string' }; // Ultimate fallback for unknowns
        }

        if (schema.required.length === 0) delete schema.required;
        return schema;
    }
}
