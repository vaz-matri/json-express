import createJoiSchema from './create-joi-schema.js'

export const validateCreateReq = (jsonSchema, createReq) => {
    const schema = createJoiSchema(jsonSchema)

    return schema.validate(createReq)
}
