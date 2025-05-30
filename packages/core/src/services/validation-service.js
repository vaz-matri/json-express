import createJoiSchema from './create-joi-schema.js'

const getOptionalSchema = (jsonSchema = {}) => {
    const optionalSchema = {}
    Object.keys(jsonSchema).forEach((key) => {
        optionalSchema[key] = { ...jsonSchema[key], required: false }
    })

    return optionalSchema
}

export const validateCreateReq = (jsonSchema, createReq) => {
    const schema = createJoiSchema(jsonSchema)

    return schema.validate(createReq)
}

export const validateUpdateReq = (jsonSchema, updateReq) => {
    const optionalSchema = getOptionalSchema(jsonSchema)
    const schema = createJoiSchema(optionalSchema)

    return schema.validate(updateReq)
}

export const validateSearchReq = (jsonSchema, searchReq) => {
    const optionalSchema = getOptionalSchema(jsonSchema)
    const schema = createJoiSchema(optionalSchema)

    return schema.validate(searchReq)
}
