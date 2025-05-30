import Joi from 'joi'
import { getConfig } from '../db/config-store.js'

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

    const allowUnknown = getConfig('schema.validation')

    return Joi.object(joiFields).unknown(allowUnknown !== 'strict')
}

export default createJoiSchema
