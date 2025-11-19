export const EXECUTION_CONFIG = {
  workspace: '/workspace',
  stdinFilePrefix: '.stdin-',
  executionHost: 'worker-01',
} as const;

export const STATUS_IDS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_FILE_SIZE: 8,
  RUNTIME_ERROR_FPE: 9,
  RUNTIME_ERROR_ABORTED: 10,
  RUNTIME_ERROR_NONZERO: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
} as const;

