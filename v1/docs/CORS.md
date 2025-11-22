# CORS Configuration Guide

## Overview

Run-Flare now includes CORS (Cross-Origin Resource Sharing) support to allow web applications from different origins to access the API.

## Default Configuration

By default, the following origins are allowed:

```typescript
- http://localhost:3000
- http://localhost:8787
- http://127.0.0.1:3000
- http://127.0.0.1:8787
```

**Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS  
**Allowed Headers**: Content-Type, Authorization, X-Requested-With  
**Max Age**: 24 hours (86400 seconds)  
**Credentials**: Enabled

## Customizing CORS Configuration

### Option 1: Modify Default Configuration

Edit `src/middleware/cors.ts` and update the `DEFAULT_CORS_CONFIG`:

```typescript
const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [
    'https://yourdomain.com',
    'https://app.yourdomain.com',
    'http://localhost:3000', // For development
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400,
  credentials: true,
};
```

### Option 2: Use Environment Variables

You can configure CORS via environment variables in `wrangler.jsonc`:

```jsonc
{
  "vars": {
    "ALLOWED_ORIGINS": "https://yourdomain.com,https://app.yourdomain.com,http://localhost:3000"
  }
}
```

Then update `src/index.ts` to read from environment:

```typescript
const allowedOrigins = env.ALLOWED_ORIGINS 
  ? env.ALLOWED_ORIGINS.split(',') 
  : DEFAULT_CORS_CONFIG.allowedOrigins;

const corsResponse = corsMiddleware(request, { allowedOrigins });
```

### Option 3: Allow All Origins (Development Only)

⚠️ **Warning**: Only use this for development, never in production!

```typescript
const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: ['*'], // Allow all origins
  // ... rest of config
};
```

## Wildcard Patterns

You can use wildcard patterns to allow multiple subdomains:

```typescript
allowedOrigins: [
  'https://*.yourdomain.com',  // Matches any subdomain
  'https://yourdomain.com',     // Exact match
]
```

## Testing CORS

### Test with curl

```bash
# Test preflight request
curl -X OPTIONS http://localhost:8787/api/v1/submissions \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Test actual request
curl -X POST http://localhost:8787/api/v1/submissions \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"source_code": "console.log(1);", "language_id": 63}' \
  -v
```

### Test with JavaScript

```javascript
// From your web application
fetch('http://localhost:8787/api/v1/submissions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    source_code: 'console.log("Hello");',
    language_id: 63,
  }),
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

## Common CORS Headers

### Request Headers
- `Origin`: The origin making the request
- `Access-Control-Request-Method`: Method for preflight
- `Access-Control-Request-Headers`: Headers for preflight

### Response Headers
- `Access-Control-Allow-Origin`: Allowed origin
- `Access-Control-Allow-Methods`: Allowed HTTP methods
- `Access-Control-Allow-Headers`: Allowed request headers
- `Access-Control-Allow-Credentials`: Whether credentials are allowed
- `Access-Control-Max-Age`: How long preflight can be cached
- `Access-Control-Expose-Headers`: Headers exposed to client

## Troubleshooting

### Error: "No 'Access-Control-Allow-Origin' header"

**Cause**: Your origin is not in the allowed list.

**Solution**: Add your origin to `allowedOrigins` in `cors.ts`.

### Error: "CORS preflight failed"

**Cause**: Preflight OPTIONS request is being blocked.

**Solution**: Ensure OPTIONS method is in `allowedMethods` and your origin is allowed.

### Error: "Credentials flag is 'true', but 'Access-Control-Allow-Credentials' header is ''"

**Cause**: Trying to send credentials but server doesn't allow it.

**Solution**: Set `credentials: true` in CORS config.

### WebSocket CORS Issues

WebSocket connections don't use CORS in the same way as HTTP. If you're having issues:

1. Ensure the WebSocket URL uses the correct protocol (`ws://` or `wss://`)
2. Check that the origin is allowed in your CORS config
3. Some browsers may still check the origin header

## Production Recommendations

1. **Never use wildcard (`*`) in production**
2. **Specify exact origins** for better security
3. **Use HTTPS** (`https://`) origins in production
4. **Limit allowed methods** to only what you need
5. **Set appropriate max-age** to reduce preflight requests
6. **Monitor CORS errors** in your logs

## Example Production Configuration

```typescript
const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [
    'https://yourdomain.com',
    'https://app.yourdomain.com',
    'https://admin.yourdomain.com',
  ],
  allowedMethods: ['GET', 'POST', 'OPTIONS'], // Only what you need
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length'],
  maxAge: 86400,
  credentials: true,
};
```

## Additional Resources

- [MDN CORS Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Cloudflare Workers CORS Guide](https://developers.cloudflare.com/workers/examples/cors-header-proxy/)
