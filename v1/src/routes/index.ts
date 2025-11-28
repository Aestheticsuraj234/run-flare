import { Router } from "../lib/router";

import { SubmissionController } from "../controllers/SubmissionController";
import { LanguageController } from "../controllers/LanguageController";
import { StatusController } from "../controllers/StatusController";
import { WebSocketController } from "../controllers/WebSocketController";
import { DocsController } from "../controllers/DocsController";

import { SubmissionService } from "../services/SubmissionService";
import { ValidationService } from "../services/ValidationService";

import { SubmissionRepository } from "../repositories/SubmissionRepository";
import { LanguageRepository } from "../repositories/LanguageRepository";
import { StatusRepository } from "../repositories/StatusRepository";

export function setupRoutes(env: Env): Router {
  const router = new Router();

  // Initialize repositories
  const submissionRepo = new SubmissionRepository();
  const languageRepo = new LanguageRepository();
  const statusRepo = new StatusRepository();

  // Initialize services
  const validationService = new ValidationService(languageRepo);
  const submissionService = new SubmissionService(
    submissionRepo,
    languageRepo,
    validationService,
    env.SUBMISSION_QUEUE
  );

  // Initialize controllers
  const submissionController = new SubmissionController(submissionService);
  const languageController = new LanguageController(languageRepo);
  const statusController = new StatusController(statusRepo);
  const webSocketController = new WebSocketController(submissionRepo);
  const docsController = new DocsController();

  // Documentation routes
  router.add("GET", "/api/v1/docs", (req, env, ctx) =>
    docsController.serveDocs(req, env)
  );

  router.add("GET", "/api/v1/docs/openapi.yaml", (req, env, ctx) =>
    docsController.serveSpec(req, env, "yaml")
  );

  router.add("GET", "/api/v1/docs/openapi.json", (req, env, ctx) =>
    docsController.serveSpec(req, env, "json")
  );

  // Register routes
  router.add("GET", "/api/v1/languages", (req, env, ctx) =>
    languageController.list(req, env)
  );

  router.add("GET", "/api/v1/statuses", (req, env, ctx) =>
    statusController.list(req, env)
  );

  router.add("POST", "/api/v1/submissions/batch", (req, env, ctx) =>
    submissionController.createBatch(req, env)
  );

  router.add("GET", "/api/v1/submissions/batch", (req, env, ctx) =>
    submissionController.getBatch(req, env)
  );

  router.add("POST", "/api/v1/submissions", (req, env, ctx) =>
    submissionController.create(req, env)
  );

  // WebSocket route - must come before the generic :token route
  router.add("GET", "/api/v1/submissions/:token/ws", (req, env, ctx, params) =>
    webSocketController.connect(req, params, env)
  );

  router.add("GET", "/api/v1/submissions/:token", (req, env, ctx, params) =>
    submissionController.get(req, params)
  );

  return router;
}

