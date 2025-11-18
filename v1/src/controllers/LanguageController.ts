import { LanguageRepository } from "../repositories/LanguageRepository";

export class LanguageController {
  constructor(private languageRepo: LanguageRepository) {}

  async list(request: Request, env: Env): Promise<Response> {
    try {
      const languages = await this.languageRepo.findAll();
      return Response.json({
        success: true,
        message: "Languages fetched",
        data: languages,
      });
    } catch (error) {
      console.error("GET /api/v1/languages error:", error);
      return Response.json({ error: "Failed to fetch languages" }, { status: 500 });
    }
  }
}

