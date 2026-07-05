export class JsonExpressError extends Error {
    public statusCode: number;
    public context?: Record<string, any>;

    constructor(message: string, statusCode: number = 500, context?: Record<string, any>) {
        super(message);
        this.name = 'JsonExpressError';
        this.statusCode = statusCode;
        this.context = context;
        Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
    }
}

/**
 * Thrown to abort boot with a remedy the operator/agent must act on. The runner
 * catches it and prints `message` + `remedy` in the `resolveActive` fatal format,
 * then exits non-zero. This is the sanctioned way for ANY plugin to veto boot —
 * prefer it (fail closed, loud) over fabricating an unsafe default. Never invent a
 * secret to keep the server up; throw this instead.
 */
export class FatalBootError extends JsonExpressError {
    public remedy: string;

    constructor(message: string, remedy: string) {
        super(message, 500, { remedy });
        this.name = 'FatalBootError';
        this.remedy = remedy;
    }
}

export class UniqueConstraintError extends JsonExpressError {
    public collection: string;
    public field: string;
    public value: any;

    constructor(collection: string, field: string, value: any) {
        super(`Unique constraint violated: ${collection}.${field} already exists.`, 400, { collection, field, value });
        this.name = 'UniqueConstraintError';
        this.collection = collection;
        this.field = field;
        this.value = value;
    }
}
