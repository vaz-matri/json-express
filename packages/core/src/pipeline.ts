import type { JsonRequest, JsonResponse, IMiddleware } from './types';

/**
 * Composes an array of IMiddleware instances into a single execution chain
 * wrapping the final route handler.
 *
 * @param handler The original core route handler from the API Generator.
 * @param middlewares An array of ordered middleware instances to execute.
 * @returns A wrapped handler with the exact same signature.
 */
export function composeMiddlewares(
    handler: (req: JsonRequest) => Promise<JsonResponse>,
    middlewares: IMiddleware[]
): (req: JsonRequest) => Promise<JsonResponse> {
    
    // If no middlewares are attached, just return the raw handler to minimize overhead.
    if (!middlewares || middlewares.length === 0) {
        return handler;
    }

    return async (req: JsonRequest): Promise<JsonResponse> => {
        // Keep track of the active middleware index to prevent multiple next() calls
        let index = -1;

        const dispatch = async (i: number): Promise<JsonResponse> => {
            if (i <= index) {
                throw new Error('next() called multiple times');
            }
            index = i;

            // If we've reached the end of the middleware chain, execute the core handler
            if (i === middlewares.length) {
                return handler(req);
            }

            const middleware = middlewares[i];

            // Execute the middleware, passing `req` and a callback to step into the next part of the chain
            return middleware.handle(req, () => dispatch(i + 1));
        };

        // Kick off the pipeline
        return dispatch(0);
    };
}
