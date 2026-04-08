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
