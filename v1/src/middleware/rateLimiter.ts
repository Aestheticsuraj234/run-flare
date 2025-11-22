import { APP_CONFIG } from "../config/appConfig";

export async function rateLimiter(request: Request, env: Env): Promise<Response | null> {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const key = `rate_limit:${ip}`;
    const limit = APP_CONFIG.RATE_LIMIT.requestsPerMinute;
    const window = APP_CONFIG.RATE_LIMIT.windowSeconds;

    try {
        const current = await env.RATE_LIMITER.get(key);
        let count = current ? parseInt(current) : 0;

        if (count >= limit) {
            return new Response("Too Many Requests", { status: 429 });
        }

        count++;

        if (count === 1) {
            await env.RATE_LIMITER.put(key, count.toString(), { expirationTtl: window });
        } else {
            await env.RATE_LIMITER.put(key, count.toString(), { expirationTtl: window });
        }

        return null; // Allowed
    } catch (e) {
        console.error("Rate limiter error:", e);
        // Fail open
        return null;
    }
}
