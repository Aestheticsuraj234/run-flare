export const APP_CONFIG = {
    // Rate Limiting
    RATE_LIMIT: {
        requestsPerMinute: 60,
        windowSeconds: 60,
    },

    // Batch Processing
    BATCH: {
        maxSize: 20,
    },

    // Execution Limits (Default)
    EXECUTION: {
        numberOfRuns: 1,
        cpuTimeLimit: 5.0,
        cpuExtraTime: 1.0,
        wallTimeLimit: 10.0,
        memoryLimit: 512000, // KB (512MB - increased for Node.js/Java/Python runtime requirements)
        stackLimit: 64000, // KB
        maxProcessesAndThreads: 60,
        enablePerProcessTimeLimit: true,
        enablePerProcessMemoryLimit: true,
        maxFileSize: 1024, // Blocks
    },

    // Timeouts
    TIMEOUTS: {
        maxWaitTime: 30000, // ms
        pollInterval: 500, // ms
    },

    // Caching
    CACHE: {
        ttl: 3600, // 1 hour
        staticTtl: 86400, // 24 hours
    },

    // System
    SYSTEM: {
        workspace: '/workspace',
        stdinFilePrefix: '.stdin-',
        enableNetworkIsolation: false, // Disabled due to permission issues in standard container
    }
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
