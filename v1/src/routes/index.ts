
import { LanguageController } from "../controllers/LanguageController";
import { StatusController } from "../controllers/StatusController";
import { Router } from "../lib/router";
import { LanguageRepository } from "../repositories/LanguageRepository";
import { StatusRepository } from "../repositories/StatusRepository";


export function setupRoutes(env: Env): Router {
    const router = new Router();

    // Initalize repositories
    const languageRepo = new LanguageRepository();
    const statusRepo = new StatusRepository();


    // Initalize Controllers
    const languageController = new LanguageController(languageRepo);
    const statusController = new StatusController(statusRepo);


    router.add("GET", "/api/v1/languages", (req, env, ctx) =>
        languageController.list(req, env)
    );
    
    router.add("GET", "/api/v1/statuses", (req, env, ctx) =>
        statusController.list(req, env)
    );


    return router
}