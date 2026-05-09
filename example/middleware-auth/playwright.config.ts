import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:3000/posts',
    reuseExistingServer: true,
  },
});
