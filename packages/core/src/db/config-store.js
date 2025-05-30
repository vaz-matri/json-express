let configStore = {
    port: 3000
}

export const updateCofigStore = (store) => {
    configStore = { ...configStore, ...store }
}

export const getConfig = (key) => {
    return configStore[key]
}

export const upsertConfig = (key, config) => {
    configStore[key] = config
}
