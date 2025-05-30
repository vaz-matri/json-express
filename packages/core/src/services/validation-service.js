import createJoiSchema from './create-joi-schema.js'

export const validateCreateReq = (jsonSchema, createReq) => {
    const schema = createJoiSchema(jsonSchema)

    return schema.validate(createReq)
}

export const validateUpdateReq = (jsonSchema, updateReq) => {
    const optionalSchema = {}
    Object.keys(jsonSchema).forEach((keys) => {
        optionalSchema[keys] = { ...jsonSchema[keys], required: false }
    })

    const schema = createJoiSchema(optionalSchema)

    return schema.validate(updateReq)
}
