import jwt from 'jsonwebtoken';

export interface IssuedTokenPayload {
    sub: string;
    role: string;
    email: string;
}

export interface JwtIssuerConfig {
    secret: string;
    ttl: string;
    issuer?: string;
    audience?: string | string[];
    algorithms?: jwt.Algorithm[];
}

export function signAccessToken(
    payload: IssuedTokenPayload,
    config: JwtIssuerConfig
): string {
    const algorithm = config.algorithms?.[0] ?? 'HS256';
    const opts: jwt.SignOptions = {
        expiresIn: config.ttl as jwt.SignOptions['expiresIn'],
        algorithm,
    };
    if (config.issuer) opts.issuer = config.issuer;
    if (config.audience) opts.audience = config.audience;
    return jwt.sign(payload, config.secret, opts);
}
