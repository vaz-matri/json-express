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
 * Converts a flat Record (e.g. process.env) with JEX_ prefixes and dot notation into a nested object.
 * Example: { "JEX_DATABASE.MAX_CONNECTIONS": "100" } => { database: { max_connections: 100 } }
 */
export function buildNestedConfigFromEnv(envVars: Record<string, string | undefined>, prefix = 'JEX_'): Record<string, any> {
    const config: Record<string, any> = {}

    for (const [key, value] of Object.entries(envVars)) {
        if (!key.startsWith(prefix) || value === undefined) continue

        const normalizedPath = key.slice(prefix.length).toLowerCase()
        const parts = normalizedPath.split('.')

        let current = config
        for (let i = 0; i < parts.length - 1; i) {
            const part = parts[i]
            if (!current[part]) current[part] = {}
            current = current[part]
        }

        // Try to parse numbers or booleans implicitly, else keep as string
        let parsedValue: any = value
        if (value === 'true') parsedValue = true
        else if (value === 'false') parsedValue = false
        else if (!isNaN(Number(value)) && value.trim() !== '') parsedValue = Number(value)

        current[parts[parts.length - 1]] = parsedValue
    }

    return config
}
