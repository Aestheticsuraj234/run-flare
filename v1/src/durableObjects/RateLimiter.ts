import { DurableObject } from "cloudflare:workers";

export class RateLimiter extends DurableObject<Env> {
    private counters: Map<string, { count: number; expiresAt: number }>;

    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        this.counters = new Map();

        // Restore state if needed
        this.ctx.blockConcurrencyWhile(async () => {
            const stored = await this.ctx.storage.get<Map<string, { count: number; expiresAt: number }>>("counters");
            if (stored) {
                this.counters = stored;
            }
        });
    }

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const key = url.searchParams.get("key");
        const limit = parseInt(url.searchParams.get("limit") || "60");
        const windowSeconds = parseInt(url.searchParams.get("window") || "60");

        if (!key) {
            return new Response("Missing key", { status: 400 });
        }

        const now = Date.now();
        let entry = this.counters.get(key);

        // Clean up expired entry
        if (entry && now > entry.expiresAt) {
            entry = undefined;
            this.counters.delete(key);
        }

        if (!entry) {
            entry = { count: 0, expiresAt: now + windowSeconds * 1000 };
        }

        if (entry.count >= limit) {
            return new Response("Too Many Requests", { status: 429 });
        }

        entry.count++;
        this.counters.set(key, entry);

        // Persist periodically or on change (for now, we persist on change for safety, but could optimize)
        // Actually, for rate limiting, strict persistence isn't critical if the DO restarts.
        // We can skip await storage.put for extreme speed if we accept losing counters on crash.
        // Let's persist for correctness.
        this.ctx.storage.put("counters", this.counters);

        return new Response("OK", { status: 200 });
    }

    async alarm() {
        // Cleanup expired counters
        const now = Date.now();
        for (const [key, entry] of this.counters.entries()) {
            if (now > entry.expiresAt) {
                this.counters.delete(key);
            }
        }
        await this.ctx.storage.put("counters", this.counters);
    }
}
