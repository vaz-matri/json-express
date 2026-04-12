import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests sequentially for stable CRUD operations
  reporter: 'list',    // Terminal-only output, prevents opening the browser report
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
