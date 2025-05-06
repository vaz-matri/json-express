const errorCodes = {
    400: {
        statusCode: 400,
        code: 'incomplete-fields'
    },
    404: {
        statusCode: 404,
        code: 'not-found'
    }
}

class AppError extends Error {
    constructor(message, statusCode, code) {
        super(message)

        this.name = 'AppError'

        const errorCode = errorCodes[statusCode]
        this.statusCode = errorCode.statusCode || statusCode
        this.code = errorCode.code || code

        Error.captureStackTrace(this, this.constructor)
    }
}

export default AppError
