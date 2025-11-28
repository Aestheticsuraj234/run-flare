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


        const responseToCache = response.clone();


        responseToCache.headers.set("Cache-Control", `public, max-age=${ttl}, s-maxage=${ttl}`);

        await cache.put(cacheRequest, responseToCache);
    }

    return response;
}
