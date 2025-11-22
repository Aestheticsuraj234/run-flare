export async function errorHandler(
    request: Request,
    handler: () => Promise<Response>
): Promise<Response> {
    try {
        return await handler();
    } catch (error: any) {
        console.error("Global error handler caught:", error);

        const status = error.status || 500;
        const message = error.message || "Internal Server Error";

        // Don't leak internal error details in production unless needed
        // For this project, we'll return the message.

        return Response.json(
            {
                error: message,
                timestamp: new Date().toISOString(),
                path: new URL(request.url).pathname
            },
            { status }
        );
    }
}
