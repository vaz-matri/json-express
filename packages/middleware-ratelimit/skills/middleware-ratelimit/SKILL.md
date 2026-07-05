---
name: middleware-ratelimit
description: Add and tune global rate limiting for a JSON Express app — throttle all traffic, protect login/token endpoints from brute-force, and get multi-instance-correct limits with a shared KV store.
---

# Rate limiting a JSON Express app

Rate limiting is infrastructure, so it is a package (decision-ladder rung 3), never model
code. Installing it is the whole integration — there is no throttling code to write in
`models/`.

## Add it
```
npm i @json-express/middleware-ratelimit
```
It is discovered automatically and applied to **every route** as a global middleware,
ordered before auth. Nothing else to wire.

## Tune it (`.env`, all keys lowercase under `jex.ratelimit.*`)
```
jex.ratelimit.window=60000     # window length in ms
jex.ratelimit.max=100          # requests per client per window
jex.ratelimit.exclude=/health  # comma-separated path prefixes to skip
jex.ratelimit.trustproxy=false # see the warning below
```

## Behind a proxy or load balancer
By default the limiter keys on the real socket address. If your app sits behind a trusted
reverse proxy / load balancer, the socket address is the proxy's, so set:
```
jex.ratelimit.trustproxy=true
```
This makes it read the client IP from `X-Forwarded-For`. **Only enable this when a trusted
proxy actually sets that header.** On a directly-exposed server the header is attacker-
controlled, so trusting it lets a caller forge a new identity per request and slip the limit.

## Running more than one instance
The in-process fallback only bounds a single instance (and warns at boot). For any
multi-replica deployment, install a shared store so all instances share one counter:
```
npm i @json-express/kv-redis
```
No further config — the limiter picks up the KV store automatically.

## It is required by identity
`@json-express/plugin-identity` declares a hard `requires: ['ratelimit']`. An identity app
with no rate limiter installed fails to boot with a remedy telling you to install this
package — login and token endpoints must never be un-throttled.

## Responses
- Allowed requests carry `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- Over the limit → `429 Too Many Requests` with a `Retry-After` header.
