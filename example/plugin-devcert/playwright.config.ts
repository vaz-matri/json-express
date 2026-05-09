import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    reporter: 'list',
    use: {
        baseURL: 'https://localhost:3000',
        ignoreHTTPSErrors: true,
    },
    webServer: {
        command: 'npm run serve',
        url: 'https://localhost:3000/albums',
        ignoreHTTPSErrors: true,
        reuseExistingServer: true,
    },
});
