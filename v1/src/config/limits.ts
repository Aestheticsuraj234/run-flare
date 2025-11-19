export const DEFAULT_SUBMISSION_LIMITS = {
  numberOfRuns: 1,
  cpuTimeLimit: 5.0,
  cpuExtraTime: 1.0,
  wallTimeLimit: 10.0,
  memoryLimit: 128000,
  stackLimit: 64000,
  maxProcessesAndThreads: 60,
  enablePerProcessTimeLimit: true,
  enablePerProcessMemoryLimit: true,
  maxFileSize: 1024,
} as const;

export const EXECUTION_TIMEOUTS = {
  maxWaitTime: 30000,
  pollInterval: 500,
} as const;

