export type RouteHandler = (
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  params: any
) => Promise<Response>;

export class Router {
  private routes: Array<{
    method: string;
    pattern: URLPattern;
    handler: RouteHandler;
  }> = [];

  add(method: string, path: string, handler: RouteHandler) {
    const pattern = new URLPattern({ pathname: path });
    this.routes.push({ method, pattern, handler });
  }

  async handle(request: Request, env: Env, ctx: ExecutionContext): Promise<Response | null> {
    const url = new URL(request.url);
    for (const r of this.routes) {
      if (r.method !== request.method) continue;
      const match = r.pattern.exec(url);
      if (match) {
        return r.handler(request, env, ctx, match.pathname.groups);
      }
    }
    return null;
  }
}

