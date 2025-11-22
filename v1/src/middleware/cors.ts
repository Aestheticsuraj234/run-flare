// CORS Middleware for Run-Flare
// Handles Cross-Origin Resource Sharing for API requests

export interface CorsConfig {
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    exposedHeaders?: string[];
    maxAge?: number;
    credentials?: boolean;
}

const DEFAULT_CORS_CONFIG: CorsConfig = {
    allowedOrigins: [
        'http://localhost:5500',
        'http://localhost:3000',
        'http://localhost:8787',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8787',
    ],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400, // 24 hours
    credentials: true,
};

export function corsMiddleware(
    request: Request,
    config: Partial<CorsConfig> = {}
): Response | null {
    const corsConfig = { ...DEFAULT_CORS_CONFIG, ...config };
    const origin = request.headers.get('Origin');

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
        return handlePreflightRequest(origin, corsConfig);
    }

    // For non-OPTIONS requests, return null to continue processing
    // CORS headers will be added to the response later
    return null;
}

export function addCorsHeaders(
    response: Response,
    request: Request,
    config: Partial<CorsConfig> = {}
): Response {
    const corsConfig = { ...DEFAULT_CORS_CONFIG, ...config };
    const origin = request.headers.get('Origin');

    // Check if origin is allowed
    if (!origin || !isOriginAllowed(origin, corsConfig.allowedOrigins)) {
        return response;
    }

    // Clone response to add headers
    const newResponse = new Response(response.body, response);

    // Add CORS headers
    newResponse.headers.set('Access-Control-Allow-Origin', origin);
    newResponse.headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
    newResponse.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));

    if (corsConfig.exposedHeaders && corsConfig.exposedHeaders.length > 0) {
        newResponse.headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
    }

    if (corsConfig.credentials) {
        newResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (corsConfig.maxAge) {
        newResponse.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
    }

    return newResponse;
}

function handlePreflightRequest(origin: string | null, config: CorsConfig): Response {
    // Check if origin is allowed
    if (!origin || !isOriginAllowed(origin, config.allowedOrigins)) {
        return new Response(null, { status: 403 });
    }

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', config.allowedMethods.join(', '));
    headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));

    if (config.credentials) {
        headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (config.maxAge) {
        headers.set('Access-Control-Max-Age', config.maxAge.toString());
    }

    return new Response(null, {
        status: 204,
        headers,
    });
}

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
    // Allow wildcard
    if (allowedOrigins.includes('*')) {
        return true;
    }

    // Check exact match
    if (allowedOrigins.includes(origin)) {
        return true;
    }

    // Check pattern match (e.g., *.example.com)
    return allowedOrigins.some(allowed => {
        if (allowed.includes('*')) {
            const pattern = allowed.replace(/\*/g, '.*');
            const regex = new RegExp(`^${pattern}$`);
            return regex.test(origin);
        }
        return false;
    });
}
