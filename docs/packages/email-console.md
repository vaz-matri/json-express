---
title: "@json-express/email-console"
description: "A development email provider for JSONExpress that prints emails to the terminal instead of sending them."
---

# @json-express/email-console

> The default development email provider for JSONExpress.

The `@json-express/email-console` package implements `IEmailProvider` and intercepts all outgoing emails, printing them to the terminal in a beautifully formatted box instead of actually sending them over the network.

This is essential for local development and automated testing, where you need to verify that emails are being triggered correctly without configuring an SMTP server or consuming API credits.

## Installation

```bash
npm install @json-express/email-console
```

## Configuration

```typescript
import { ConsoleEmailProvider } from '@json-express/email-console';

const emailProvider = new ConsoleEmailProvider({
    configProvider: myConfig
});
```

You can configure the default sender address:

```bash
# .env
JEX.EMAIL.FROM=noreply@myapp.com
```

## What It Looks Like

When the `@json-express/plugin-identity` triggers a password reset email, you will see this in your terminal:

```
┌── Email (console) ──────────────────────────────────────
│ From:    noreply@myapp.com
│ To:      user@example.com
│ Subject: Password Reset Request
├─────────────────────────────────────────────────────────
│ Click the link below to reset your password:
│ https://myapp.com/reset?token=abc123def456
└─────────────────────────────────────────────────────────
```

## Core Features

### 1. Structured Logging Integration
The email is printed using the system `ILogger`, not raw `console.log`. This means:
*   If you are using `@json-express/logger-pino`, the email content will appear as structured JSON with proper `traceId` correlation.
*   If you are using `@json-express/logger-console`, it will be printed as a human-readable box.

### 2. Playwright Test Compatibility
The email body is also injected into the logger's `text` metadata field. This allows Playwright E2E tests to programmatically scrape the server output, extract password reset tokens, and complete the full authentication flow in an automated test without needing a real email inbox.

### 3. Health Check
The provider exposes an `isHealthy()` method that always returns `true`, satisfying the readiness probe contract.

## Related Ecosystem Packages
*   **[@json-express/plugin-identity](/packages/plugin-identity):** The primary consumer that dispatches password reset and verification emails.
*   **[@json-express/queue-memory](/packages/queue-memory):** Emails are typically dispatched via the task queue, not called directly.
