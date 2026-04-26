# `@json-express/email-console`

> **Console email provider for JSON Express v2.**
> Implements `IEmailProvider` by formatting messages and writing them to the configured logger — no SMTP creds, no I/O, no flake. The default for local dev and the unit-test fixture for `plugin-identity`.

---

## What It Does

This plugin implements `IEmailProvider` from `@json-express/core`. When any consumer (typically `@json-express/plugin-identity`) calls `emailProvider.send(message)`, the provider formats a multi-line block with the From, To, Subject, and body, and emits a single `logger.info(...)` call. The message body also lives in the logger's structured `text` / `html` fields so log scrapers and Playwright `webServer.stdout` capture can find tokens deterministically.

It satisfies the contract just well enough to wire up the real flow end-to-end without any external service.

---

## Installation

```bash
npm install @json-express/email-console
```

The CLI auto-discovers any package matching `@json-express/email-*` in your `package.json` and registers it as the active email provider. If multiple are installed, the standard `JEX.EMAIL=...` selector applies.

---

## Configuration

```env
# Default From address used when message.from is omitted.
JEX__EMAIL__FROM=no-reply@my-app.example
```

| Key | Type | Default | Description |
|---|---|---|---|
| `email.from` | `string` | `no-reply@localhost` | Falls back into `EmailMessage.from` when the caller didn't set one. |

---

## When To Use This vs. Real SMTP

| Scenario | Provider |
|---|---|
| Local dev, examples, CI unit tests | `email-console` (this package) |
| Production transactional email | `email-smtp` *(planned)* — same `IEmailProvider` interface, swap the package |

Switching is a one-line `package.json` change — your application code never imports the provider directly; it always resolves it from the kernel container.

---

## The `IEmailProvider` Contract

Defined in `@json-express/core`:

```typescript
export interface EmailMessage {
    to: string | string[];
    from?: string;        // falls back to the provider's configured default
    subject: string;
    text?: string;        // at least one of text or html must be set
    html?: string;
    replyTo?: string;
    headers?: Record<string, string>;
}

export interface IEmailProvider {
    send(message: EmailMessage): Promise<void>;
    isHealthy?(): Promise<boolean>;
}
```

This package's `send()` throws if neither `text` nor `html` is provided.

---

## Sample Output

```
[INFO]
┌── Email (console) ──────────────────────────────────────
│ From:    no-reply@my-app.example
│ To:      alice@example.com
│ Subject: Verify your email for My App
├─────────────────────────────────────────────────────────
│ Welcome to My App!
│
│ Please verify your email address by visiting:
│ https://my-app.example/auth/verify?token=hQ8…
│
│ If you didn't sign up, you can safely ignore this email.
└─────────────────────────────────────────────────────────
{ from: '...', to: '...', subject: '...', text: '...', html: '...' }
```

The structured payload at the end is what JSON loggers (Pino, etc.) emit — keeping the message scriptable.
