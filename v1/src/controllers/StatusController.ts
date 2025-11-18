import { StatusRepository } from "../repositories/StatusRepository";

export class StatusController {
  constructor(private statusRepo: StatusRepository) {}

  async list(request: Request, env: Env): Promise<Response> {
    try {
      const statuses = await this.statusRepo.findAll();
      return Response.json(statuses);
    } catch (error) {
      console.error("GET /api/v1/statuses error:", error);
      return Response.json({ error: "Failed to fetch statuses" }, { status: 500 });
    }
  }
}

