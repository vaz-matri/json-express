import type { 
    IPlugin, 
    IConfigProvider, 
    IDocProvider, 
    RouteDefinition, 
    ILogger 
} from '@json-express/core';

export class SwaggerPlugin implements IPlugin {
    name = 'swagger';

    async onBoot(kernel: any, configProvider: IConfigProvider) {
        const logger: ILogger = kernel.container.resolve('logger');
        // Register the Swagger provider to override the default one
        kernel.registerDocProvider(new SwaggerDocProvider());
        
        logger.info('Interactive Swagger documentation plugin initialized.');
    }
}

class SwaggerDocProvider implements IDocProvider {
    renderTitle(): string {
        return 'JSON Express API — Interactive Swagger UI';
    }

    /**
     * Translates JSON Express Routes into OpenAPI 3.0.0 Path Objects
     */
    getManifest(routes: RouteDefinition[]): any {
        const paths: Record<string, any> = {};

        for (const route of routes) {
            const method = route.method.toLowerCase();
            const path = route.path;

            if (!paths[path]) paths[path] = {};

            paths[path][method] = {
                summary: `Operation on ${path}`,
                description: `Standard ${method.toUpperCase()} endpoint managed by JSON Express.`,
                tags: [this.extractResource(path)],
                parameters: this.extractPathParams(path),
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

            // Add request body for mutation methods
            if (['post', 'patch', 'put'].includes(method)) {
                paths[path][method].requestBody = {
                    content: {
                        'application/json': {
                            schema: { type: 'object' }
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
            paths
        };
    }

    renderDocumentation(routes: RouteDefinition[]): string {
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
            url: "/info/routes", // Point to the dynamic manifest endpoint
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
}
