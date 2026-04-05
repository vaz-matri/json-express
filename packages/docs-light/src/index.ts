import type {
    IConfigProvider,
    IDocProvider,
    RouteDefinition,
    ILogger
} from '@json-express/core';

export class LightDocProvider implements IDocProvider {
    private logger?: ILogger;

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider; logger?: ILogger } = {}) {
        this.logger = logger?.child({ component: 'Docs-Light' });
        this.logger?.info('Lightweight API documentation provider initialized.');
    }

    public renderTitle(): string {
        return 'JSON Express API Manifest';
    }

    public getDocumentationMessage(port: number, path: string): string {
        return [
            `📚 API Documentation (Light) available at: ${path}`,
            `🔗 Raw JSON Manifest available at: ${path}/json`
        ].join('\n');
    }

    public getManifest(routes: RouteDefinition[]): any {
        return routes.map(r => ({
            method: r.method,
            path: r.path,
            middlewares: r.middlewares || []
        }));
    }

    public renderDocumentation(routes: RouteDefinition[]): string {
        const sortedRoutes = [...routes].sort((a, b) => a.path.localeCompare(b.path));

        // Group by resource (first part of path after /api/v1/)
        const groups: Record<string, RouteDefinition[]> = {};
        for (const route of sortedRoutes) {
            const parts = route.path.split('/');
            const resource = parts[3] || 'System'; // Assuming /api/v1/:resource
            if (!groups[resource]) groups[resource] = [];
            groups[resource].push(route);
        }

        const resourceCards = Object.entries(groups).map(([name, rts]) => `
            <div class="card">
                <div class="card-header">
                    <span class="resource-icon">📦</span>
                    <h2>${name.charAt(0).toUpperCase() + name.slice(1)}</h2>
                </div>
                <div class="route-list">
                    ${rts.map(r => `
                        <div class="route-item">
                            <span class="method method-${r.method.toLowerCase()}">${r.method}</span>
                            <code class="path">${r.path}</code>
                            ${r.middlewares?.length ? `<span class="badge" title="${r.middlewares.join(', ')}">🛡️ ${r.middlewares.length}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.renderTitle()}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&family=JetBrains+Mono&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0a0c10;
            --card-bg: #161b22;
            --border: #30363d;
            --text: #c9d1d9;
            --text-dim: #8b949e;
            --primary: #58a6ff;
            --accent: #bc8cff;
            --get: #3fb950;
            --post: #d29922;
            --patch: #1f6feb;
            --delete: #f85149;
        }

        * { box-sizing: border-box; }
        body {
            font-family: 'Outfit', sans-serif;
            background-color: var(--bg);
            color: var(--text);
            margin: 0;
            padding: 2rem;
            line-height: 1.6;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
        }

        header {
            margin-bottom: 3rem;
            text-align: center;
        }

        h1 {
            font-size: 2.5rem;
            font-weight: 600;
            margin: 0;
            background: linear-gradient(135deg, var(--primary), var(--accent));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            color: var(--text-dim);
            font-size: 1.1rem;
            margin-top: 0.5rem;
        }

        .grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
            transition: transform 0.2s, border-color 0.2s;
        }

        .card:hover {
            transform: translateY(-2px);
            border-color: var(--primary);
        }

        .card-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1.25rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 0.75rem;
        }

        .card-header h2 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 600;
        }

        .resource-icon { font-size: 1.25rem; }

        .route-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.5rem 0;
        }

        .method {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.8rem;
            font-weight: 600;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            min-width: 65px;
            text-align: center;
            text-transform: uppercase;
        }

        .method-get { background: rgba(63, 185, 80, 0.15); color: var(--get); }
        .method-post { background: rgba(210, 153, 34, 0.15); color: var(--post); }
        .method-patch { background: rgba(31, 111, 235, 0.15); color: var(--patch); }
        .method-delete { background: rgba(248, 81, 73, 0.15); color: var(--delete); }

        .path {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.95rem;
            color: var(--text-dim);
            flex-grow: 1;
        }

        .badge {
            font-size: 0.75rem;
            background: var(--bg);
            border: 1px solid var(--border);
            padding: 2px 6px;
            border-radius: 4px;
            color: var(--text-dim);
        }

        footer {
            margin-top: 4rem;
            text-align: center;
            font-size: 0.9rem;
            color: var(--text-dim);
        }

        .links {
            margin-top: 1rem;
            display: flex;
            justify-content: center;
            gap: 1rem;
        }

        .links a {
            color: var(--primary);
            text-decoration: none;
        }

        .links a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>JSON Express</h1>
            <div class="subtitle">Interactive API Documentation & Manifest</div>
        </header>

        <div class="grid">
            ${resourceCards}
        </div>

        <footer>
            Built with ⚡ by JSON Express v2
            <div class="links">
                <a href="./docs/json">Raw JSON Manifest</a>
                <a href="/health">System Health</a>
            </div>
        </footer>
    </div>
</body>
</html>
        `;
    }
}
