export async function getCachedResponse(
    request: Request,
    cacheKey: string,
    fetchFn: () => Promise<Response>,
    ttl: number = 86400
): Promise<Response> {
    const cache = caches.default;
    const url = new URL(request.url);
    // Use a custom cache key based on the request URL or a specific key
    const cacheUrl = new URL(url.origin + cacheKey);
    const cacheRequest = new Request(cacheUrl.toString(), request);

    // Check for existing cache
    let response = await cache.match(cacheRequest);

    if (!response) {
        // If not in cache, fetch fresh data
        response = await fetchFn();

        // Clone response to cache it
        const responseToCache = response.clone();

        // Set cache headers
        responseToCache.headers.set("Cache-Control", `public, max-age=${ttl}, s-maxage=${ttl}`);

        // Store in cache
        // We need to use waitUntil to ensure caching completes, but we don't have access to ctx here easily
        // So we'll just await it. For better performance in a real worker, passing ctx would be better.
        // However, caches.default.put returns a promise that resolves when the cache is updated.
        await cache.put(cacheRequest, responseToCache);
    }

    return response;
}
