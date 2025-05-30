import Joi from 'joi'

const createJoiSchema = (jsonSchema = {}) => {
    const joiFields = {}

    for (const [fieldName, fieldConfig] of Object.entries(jsonSchema)) {
        const { type, required } = fieldConfig

        let joiValidator
        if (type.toLowerCase() === 'string') {
            joiValidator = Joi.string()
        } else {
            joiValidator = Joi.any()
        }

        if (required === true) {
            joiValidator = joiValidator.required()
        }

        joiFields[fieldName] = joiValidator
    }

    return Joi.object(joiFields).unknown(true) //:TODO handle from config
}

export default createJoiSchema
