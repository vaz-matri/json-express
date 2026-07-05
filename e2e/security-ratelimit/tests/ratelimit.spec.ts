import { test, expect } from '@playwright/test';

// The server is configured (see .env) with max=10 requests per a long (120s) window, so all
// requests in this run share one window. /docs is excluded so readiness polling is free.
test.describe.configure({ mode: 'serial' });

test('throttles a client after the configured max, returning 429', async ({ request }) => {
  const statuses: number[] = [];
  for (let i = 0; i < 15; i++) {
    statuses.push((await request.get('/widgets')).status());
  }

  // Some requests succeeded, and the excess is rejected.
  expect(statuses.filter(s => s === 200).length).toBe(10);
  expect(statuses).toContain(429);
  // Once over the limit it stays limited for the rest of the window.
  expect(statuses[statuses.length - 1]).toBe(429);
});

test('a 429 carries Retry-After and X-RateLimit headers', async ({ request }) => {
  // Still inside the same long window, so this client is already limited.
  const res = await request.get('/widgets');
  expect(res.status()).toBe(429);
  const headers = res.headers();
  expect(headers['retry-after']).toBeDefined();
  expect(headers['x-ratelimit-limit']).toBe('10');
  expect(headers['x-ratelimit-remaining']).toBe('0');
});
