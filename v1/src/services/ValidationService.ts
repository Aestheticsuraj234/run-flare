import { CreateSubmissionBody } from "../types/types";
import { LanguageRepository } from "../repositories/LanguageRepository";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationService {
  constructor(private languageRepo: LanguageRepository) {}

  validateSubmissionInput(body: CreateSubmissionBody): ValidationResult {
    const errors: string[] = [];

    if (!body.source_code) {
      errors.push("source_code can't be blank");
    }

    if (!body.language_id) {
      errors.push("language_id can't be blank");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async validateLanguageExists(languageId: number) {
    return this.languageRepo.findById(languageId);
  }
}

