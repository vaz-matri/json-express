import jwt from "jsonwebtoken";
//#region src/index.ts
var AuthMiddleware = class {
	name = "auth";
	secret = null;
	excludePaths = [];
	constructor({ configProvider }) {
		if (!configProvider) return;
		this.secret = configProvider.get("auth.secret", null);
		const rawExclude = configProvider.get("auth.exclude", []);
		if (Array.isArray(rawExclude)) this.excludePaths = rawExclude;
		else if (typeof rawExclude === "string") this.excludePaths = rawExclude.split(",").map((s) => s.trim()).filter(Boolean);
	}
	async handle(req, next) {
		if (!this.secret) {
			console.warn("⚠️ [AuthMiddleware] JEX__AUTH__SECRET is missing. Authentication bypassed completely.");
			return next();
		}
		if (this.excludePaths.some((path) => req.path.startsWith(path))) return next();
		const authHeader = req.headers["authorization"];
		if (!authHeader || Array.isArray(authHeader) || !authHeader.startsWith("Bearer ")) return {
			statusCode: 401,
			body: { error: "Unauthorized: Missing or invalid Bearer token." }
		};
		const token = authHeader.split(" ")[1];
		try {
			const decoded = jwt.verify(token, this.secret);
			req.headers["x-user-payload"] = JSON.stringify(decoded);
			return next();
		} catch (error) {
			return {
				statusCode: 403,
				body: { error: "Forbidden: Invalid or expired token." }
			};
		}
	}
};
//#endregion
export { AuthMiddleware };
