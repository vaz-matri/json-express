Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region src/index.ts
var ValidationMiddleware = class {
	name = "validation";
	rules = [];
	constructor({ configProvider }) {
		if (!configProvider) return;
		const configRules = configProvider.get("validation.rules", []);
		if (Array.isArray(configRules)) this.rules = configRules;
	}
	matchPath(requestPath, rulePath) {
		if (rulePath instanceof RegExp) return rulePath.test(requestPath);
		return requestPath === rulePath || requestPath.startsWith(rulePath);
	}
	matchMethod(requestMethod, ruleMethod) {
		return ruleMethod === "*" || requestMethod.toUpperCase() === ruleMethod.toUpperCase();
	}
	async handle(req, next) {
		if (this.rules.length === 0) return next();
		const matchedRule = this.rules.find((r) => this.matchMethod(req.method, r.method) && this.matchPath(req.path, r.path));
		if (!matchedRule) return next();
		const errors = {};
		if (matchedRule.body && req.body && Object.keys(req.body).length > 0) {
			const bodyResult = matchedRule.body.safeParse(req.body);
			if (!bodyResult.success) errors.body = bodyResult.error.format();
			else req.body = bodyResult.data;
		}
		if (matchedRule.query && req.query) {
			const queryResult = matchedRule.query.safeParse(req.query);
			if (!queryResult.success) errors.query = queryResult.error.format();
			else req.query = queryResult.data;
		}
		if (Object.keys(errors).length > 0) return {
			statusCode: 400,
			body: {
				error: "Validation failed",
				details: errors
			}
		};
		return next();
	}
};
//#endregion
exports.ValidationMiddleware = ValidationMiddleware;
