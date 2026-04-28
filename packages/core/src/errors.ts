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
