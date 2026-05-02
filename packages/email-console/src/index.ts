import type { IEmailProvider, EmailMessage, IConfigProvider, ILogger } from '@json-express/core';

const DEFAULT_FROM = 'no-reply@localhost';

export class ConsoleEmailProvider implements IEmailProvider {
    private logger: ILogger;
    private defaultFrom: string;

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider; logger: ILogger }) {
        this.logger = logger.child({ component: 'Email-Console' });
        this.defaultFrom = configProvider?.get<string>('email.from', DEFAULT_FROM) ?? DEFAULT_FROM;
    }

    public async send(message: EmailMessage): Promise<void> {
        if (!message.text && !message.html) {
            throw new Error('ConsoleEmailProvider.send: at least one of `text` or `html` must be set');
        }

        const to = Array.isArray(message.to) ? message.to.join(', ') : message.to;
        const from = message.from ?? this.defaultFrom;
        const body = (message.text ?? message.html ?? '').replace(/\r\n/g, '\n');

        // Multi-line block via a single logger.info call so structured loggers (Pino, etc.)
        // keep the metadata grouped. The body is also surfaced in `text` so log scrapers
        // and Playwright `webServer` capture can find tokens deterministically.
        this.logger.info(
            '\n' +
            '┌── Email (console) ──────────────────────────────────────\n' +
            `│ From:    ${from}\n` +
            `│ To:      ${to}\n` +
            `│ Subject: ${message.subject}\n` +
            '├─────────────────────────────────────────────────────────\n' +
            body.split('\n').map(l => `│ ${l}`).join('\n') + '\n' +
            '└─────────────────────────────────────────────────────────',
            { from, to, subject: message.subject, text: message.text, html: message.html }
        );
    }

    public async isHealthy(): Promise<boolean> {
        return true;
    }
}
