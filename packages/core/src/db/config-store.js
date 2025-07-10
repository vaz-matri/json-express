let configStore = {
    port: 3000,
    'schema.validation': 'optional' // optional | strict
}

export const updateConfigStore = (store) => {
    configStore = { ...configStore, ...store }
}

export const getConfig = (key) => {
    return configStore[key]
}

export const upsertConfig = (key, config) => {
    configStore[key] = config
}
