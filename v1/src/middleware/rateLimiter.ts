import { APP_CONFIG } from "../config/appConfig";

export async function rateLimiter(request: Request, env: Env): Promise<Response | null> {
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const limit = APP_CONFIG.RATE_LIMIT.requestsPerMinute;
    const window = APP_CONFIG.RATE_LIMIT.windowSeconds;

    // Sharding: Distribute IPs across 10 RateLimiter instances to avoid hot spots
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        hash = ((hash << 5) - hash) + ip.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    const shardId = Math.abs(hash) % 10;

    const id = env.RATE_LIMITER.idFromName(`shard-${shardId}`);
    const stub = env.RATE_LIMITER.get(id);

    try {
        const response = await stub.fetch(
            `http://internal/limit?key=${encodeURIComponent(ip)}&limit=${limit}&window=${window}`
        );

        if (response.status === 429) {
            return response;
        }

        return null; // Allowed
    } catch (e) {
        console.error("Rate limiter error:", e);
        // Fail open
        return null;
    }
}
