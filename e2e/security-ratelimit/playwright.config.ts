import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // shared rate-limit window — requests must run sequentially
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    // /docs is excluded from the limiter (see .env) so the readiness poll never eats budget.
    command: 'npm run serve',
    url: 'http://localhost:3000/docs',
    reuseExistingServer: true,
  },
});
