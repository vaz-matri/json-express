/**
 * Deeply merges multiple objects.
 * Arrays and primitives are overwritten. Objects are merged recursively.
 * Precedence goes from left to right (last object wins).
 */
export function deepMerge(...objects: any[]): any {
    const isObject = (obj: any) => obj && typeof obj === 'object' && !Array.isArray(obj)

    return objects.reduce((prev, obj) => {
        if (!isObject(prev) || !isObject(obj)) {
            return obj !== undefined ? obj : prev
        }

        const output = { ...prev }
        Object.keys(obj).forEach(key => {
            if (isObject(obj[key])) {
                if (!(key in prev)) {
                    output[key] = obj[key]
                } else {
                    output[key] = deepMerge(prev[key], obj[key])
                }
            } else {
                output[key] = obj[key]
            }
        })
        return output
    }, {})
}

/**
 * Retrieves a nested value from an object using dot notation.
 */
export function getNestedValue(obj: any, path: string, defaultValue?: any): any {
    const keys = path.split('.')
    let current = obj
    for (const key of keys) {
        if (current === undefined || current === null) return defaultValue
        current = current[key]
    }
    return current !== undefined ? current : defaultValue
}

/**
 * Sets a nested value inside an object using dot notation.
 * Mutates the original object. Creates missing intermediate objects.
 */
export function setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    let current = obj
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (current[key] === undefined || current[key] === null || typeof current[key] !== 'object') {
            current[key] = {}
        }
        current = current[key]
    }
    current[keys[keys.length - 1]] = value
}

/**
 * Converts a flat Record (e.g. process.env) with `jex` prefixes and dot notation into a nested object.
 * Prefix and key casing are both case-insensitive — `jex.database.max_connections` (preferred)
 * and `JEX__DATABASE__MAX_CONNECTIONS` (cloud-safe) produce the same result.
 * Example: { "jex.database.max_connections": "100" } => { database: { max_connections: 100 } }
 */
export function buildNestedConfigFromEnv(envVars: Record<string, string | undefined>, namespace = 'jex'): Record<string, any> {
    const config: Record<string, any> = {};

    // Regex explanation:
    // ^${namespace} -> Starts with 'jex'
    // (?:\.|__)     -> Followed EXACTLY by a dot (.) or double underscore (__)
    // (.*)$         -> Captures everything after it
    // 'i' flag      -> Makes it completely case-insensitive (jex, JEX, Jex)
    const regex = new RegExp(`^${namespace}(?:\\.|__)(.*)$`, 'i');

    for (const [key, value] of Object.entries(envVars)) {
        if (value === undefined) continue;

        const match = key.match(regex);
        if (!match) continue;

        // match[1] contains the rest of the key.
        // 1. Lowercase it to normalize
        // 2. Replace all remaining double underscores (__) with dots (.) to standardize block separators
        // *Single underscores naturally remain untouched as multi-word separators!*
        const normalizedPath = match[1].toLowerCase().replace(/__/g, '.');
        const parts = normalizedPath.split('.');

        let current = config;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            // Fix: If the intermediate path doesn't exist or is not an object, create it.
            // This prevents flat keys (like jex.api) from breaking nested keys (like jex.api.rest.prefix).
            if (!current[part] || typeof current[part] !== 'object') {
                current[part] = {};
            }
            current = current[part];
        }

        let parsedValue: any = value;
        if (value === 'true') parsedValue = true;
        else if (value === 'false') parsedValue = false;
        else if (!isNaN(Number(value)) && value.trim() !== '') parsedValue = Number(value);

        // Fix: If we're setting a terminal value but an object already exists there,
        // we skip it to prevent losing nested config (Nested keys take priority).
        if (typeof current[parts[parts.length - 1]] !== 'object') {
            current[parts[parts.length - 1]] = parsedValue;
        }
    }

    return config;
}
