import { YamlParser } from '../utils/yaml-parser';

// Embedded OpenAPI specification as a JavaScript object
const openApiSpec = {
    openapi: '3.1.0',
    info: {
        title: 'Run-Flare Code Execution API',
        version: '1.0.0',
        description: 'A powerful code execution API built on Cloudflare Workers that allows you to execute code in multiple programming languages with real-time status updates via WebSocket.',
        contact: {
            name: 'API Support',
            url: 'https://github.com/Aestheticsuraj234/run-flare'
        },
        license: {
            name: 'MIT'
        }
    },
    servers: [
        {
            url: 'https://api.run-flare.com',
            description: 'Production server'
        },
        {
            url: 'http://localhost:8787',
            description: 'Local development server'
        }
    ],
    tags: [
        { name: 'Submissions', description: 'Code submission and execution endpoints' },
        { name: 'Languages', description: 'Supported programming languages' },
        { name: 'Statuses', description: 'Execution status information' },
        { name: 'WebSocket', description: 'Real-time submission status updates' }
    ],
    paths: {
        '/api/v1/submissions': {
            post: {
                tags: ['Submissions'],
                summary: 'Create a code submission',
                description: 'Submit code for execution. Returns a token that can be used to retrieve results.',
                operationId: 'createSubmission',
                parameters: [
                    {
                        name: 'base64_encoded',
                        in: 'query',
                        description: 'Whether source_code and stdin are base64 encoded',
                        required: false,
                        schema: { type: 'boolean', default: false }
                    },
                    {
                        name: 'wait',
                        in: 'query',
                        description: 'Wait for execution to complete before returning',
                        required: false,
                        schema: { type: 'boolean', default: false }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateSubmissionRequest' }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Submission created successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    oneOf: [
                                        { $ref: '#/components/schemas/SubmissionTokenResponse' },
                                        { $ref: '#/components/schemas/SubmissionResponse' }
                                    ]
                                }
                            }
                        }
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '422': { $ref: '#/components/responses/ValidationError' },
                    '500': { $ref: '#/components/responses/InternalError' }
                }
            }
        },
        '/api/v1/submissions/{token}': {
            get: {
                tags: ['Submissions'],
                summary: 'Get submission result',
                description: 'Retrieve the execution result of a submission using its token',
                operationId: 'getSubmission',
                parameters: [
                    {
                        name: 'token',
                        in: 'path',
                        required: true,
                        description: 'Submission token returned from create endpoint',
                        schema: { type: 'string' }
                    },
                    {
                        name: 'base64_encoded',
                        in: 'query',
                        description: 'Whether to return stdout/stderr as base64 encoded',
                        required: false,
                        schema: { type: 'boolean', default: false }
                    },
                    {
                        name: 'fields',
                        in: 'query',
                        description: 'Comma-separated list of fields to include in response',
                        required: false,
                        schema: { type: 'string' },
                        example: 'stdout,stderr,status_id,time'
                    }
                ],
                responses: {
                    '200': {
                        description: 'Submission result',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/SubmissionResponse' }
                            }
                        }
                    },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '500': { $ref: '#/components/responses/InternalError' }
                }
            }
        },
        '/api/v1/submissions/batch': {
            post: {
                tags: ['Submissions'],
                summary: 'Create multiple submissions',
                description: 'Submit multiple code executions in a single request',
                operationId: 'createBatchSubmissions',
                parameters: [
                    {
                        name: 'base64_encoded',
                        in: 'query',
                        description: 'Whether source_code and stdin are base64 encoded',
                        required: false,
                        schema: { type: 'boolean', default: false }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['submissions'],
                                properties: {
                                    submissions: {
                                        type: 'array',
                                        maxItems: 20,
                                        items: { $ref: '#/components/schemas/CreateSubmissionRequest' }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    '201': {
                        description: 'Batch submissions created',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/SubmissionTokenResponse' }
                                }
                            }
                        }
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '422': { $ref: '#/components/responses/ValidationError' },
                    '500': { $ref: '#/components/responses/InternalError' }
                }
            },
            get: {
                tags: ['Submissions'],
                summary: 'Get multiple submission results',
                description: 'Retrieve results for multiple submissions',
                operationId: 'getBatchSubmissions',
                parameters: [
                    {
                        name: 'tokens',
                        in: 'query',
                        required: true,
                        description: 'Comma-separated list of submission tokens',
                        schema: { type: 'string' },
                        example: 'token1,token2,token3'
                    },
                    {
                        name: 'base64_encoded',
                        in: 'query',
                        description: 'Whether to return stdout/stderr as base64 encoded',
                        required: false,
                        schema: { type: 'boolean', default: false }
                    },
                    {
                        name: 'fields',
                        in: 'query',
                        description: 'Comma-separated list of fields to include in response',
                        required: false,
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    '200': {
                        description: 'Batch submission results',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        submissions: {
                                            type: 'array',
                                            items: {
                                                oneOf: [
                                                    { $ref: '#/components/schemas/SubmissionResponse' },
                                                    {
                                                        type: 'object',
                                                        properties: {
                                                            token: { type: 'string' },
                                                            error: { type: 'string' }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '500': { $ref: '#/components/responses/InternalError' }
                }
            }
        },
        '/api/v1/languages': {
            get: {
                tags: ['Languages'],
                summary: 'Get supported languages',
                description: 'Retrieve list of all supported programming languages',
                operationId: 'getLanguages',
                responses: {
                    '200': {
                        description: 'List of supported languages',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        success: { type: 'boolean' },
                                        message: { type: 'string' },
                                        data: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/Language' }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    '500': { $ref: '#/components/responses/InternalError' }
                }
            }
        },
        '/api/v1/statuses': {
            get: {
                tags: ['Statuses'],
                summary: 'Get execution statuses',
                description: 'Retrieve list of all possible execution statuses',
                operationId: 'getStatuses',
                responses: {
                    '200': {
                        description: 'List of execution statuses',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Status' }
                                }
                            }
                        }
                    },
                    '500': { $ref: '#/components/responses/InternalError' }
                }
            }
        },
        '/api/v1/submissions/{token}/ws': {
            get: {
                tags: ['WebSocket'],
                summary: 'WebSocket connection for real-time updates',
                description: 'Establish a WebSocket connection to receive real-time updates about submission execution.',
                operationId: 'connectWebSocket',
                parameters: [
                    {
                        name: 'token',
                        in: 'path',
                        required: true,
                        description: 'Submission token',
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    '101': { description: 'WebSocket connection established' },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '500': { $ref: '#/components/responses/InternalError' }
                }
            }
        }
    },
    components: {
        schemas: {
            CreateSubmissionRequest: {
                type: 'object',
                required: ['source_code', 'language_id'],
                properties: {
                    source_code: { type: 'string', description: 'Source code to execute' },
                    language_id: { type: 'integer', description: 'Programming language ID', example: 63 },
                    stdin: { type: 'string', nullable: true, description: 'Standard input for the program' },
                    expected_output: { type: 'string', nullable: true, description: 'Expected output for validation' },
                    user_id: { type: 'string', nullable: true, description: 'User identifier' },
                    number_of_runs: { type: 'integer', description: 'Number of times to run the program', default: 1 },
                    cpu_time_limit: { type: 'number', description: 'CPU time limit in seconds', default: 2 },
                    cpu_extra_time: { type: 'number', description: 'Extra CPU time allowed', default: 0.5 },
                    wall_time_limit: { type: 'number', description: 'Wall time limit in seconds', default: 5 },
                    memory_limit: { type: 'integer', description: 'Memory limit in kilobytes', default: 128000 },
                    stack_limit: { type: 'integer', description: 'Stack size limit in kilobytes', default: 64000 },
                    max_processes_and_or_threads: { type: 'integer', description: 'Maximum number of processes/threads', default: 60 },
                    enable_per_process_and_thread_time_limit: { type: 'boolean', default: false },
                    enable_per_process_and_thread_memory_limit: { type: 'boolean', default: false },
                    max_file_size: { type: 'integer', description: 'Maximum file size in kilobytes', default: 1024 },
                    compiler_options: { type: 'string', nullable: true, description: 'Additional compiler options' },
                    command_line_arguments: { type: 'string', nullable: true, description: 'Command line arguments for the program' },
                    redirect_stderr_to_stdout: { type: 'boolean', description: 'Redirect stderr to stdout', default: false },
                    callback_url: { type: 'string', nullable: true, description: 'URL to POST results when execution completes' },
                    additional_files: { type: 'string', description: 'Base64 encoded additional files' },
                    enable_network: { type: 'boolean', description: 'Enable network access during execution', default: false }
                }
            },
            SubmissionTokenResponse: {
                type: 'object',
                properties: {
                    token: { type: 'string', description: 'Unique submission token', example: 'abc123def456' }
                }
            },
            SubmissionResponse: {
                type: 'object',
                properties: {
                    token: { type: 'string', description: 'Unique submission token' },
                    status_id: { type: 'integer', description: 'Status ID' },
                    status: { $ref: '#/components/schemas/Status' },
                    stdout: { type: 'string', nullable: true, description: 'Standard output' },
                    stderr: { type: 'string', nullable: true, description: 'Standard error' },
                    compile_output: { type: 'string', nullable: true, description: 'Compiler output' },
                    message: { type: 'string', nullable: true, description: 'Additional message' },
                    time: { type: 'string', nullable: true, description: 'Execution time in seconds' },
                    memory: { type: 'integer', nullable: true, description: 'Memory used in kilobytes' },
                    exit_code: { type: 'integer', nullable: true, description: 'Program exit code' }
                }
            },
            Language: {
                type: 'object',
                properties: {
                    id: { type: 'integer', description: 'Language ID' },
                    name: { type: 'string', description: 'Language name and version' }
                }
            },
            Status: {
                type: 'object',
                properties: {
                    id: { type: 'integer', description: 'Status ID' },
                    description: { type: 'string', description: 'Status description' }
                }
            },
            Error: {
                type: 'object',
                properties: {
                    error: { type: 'string', description: 'Error message' },
                    details: { type: 'string', description: 'Additional error details' }
                }
            }
        },
        responses: {
            BadRequest: {
                description: 'Bad request',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' }
                    }
                }
            },
            ValidationError: {
                description: 'Validation error',
                content: {
                    'application/json': {
                        schema: {
                            oneOf: [
                                { $ref: '#/components/schemas/Error' },
                                {
                                    type: 'object',
                                    additionalProperties: {
                                        type: 'array',
                                        items: { type: 'string' }
                                    }
                                }
                            ]
                        }
                    }
                }
            },
            NotFound: {
                description: 'Resource not found',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' }
                    }
                }
            },
            InternalError: {
                description: 'Internal server error',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' }
                    }
                }
            }
        }
    },
    security: []
};

const docsHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Run-Flare API Documentation</title>
  <meta name="description" content="Interactive API documentation for Run-Flare Code Execution API">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <script
    id="api-reference"
    data-url="/api/v1/docs/openapi.json"
    data-configuration='{"theme":"purple","layout":"modern","defaultHttpClient":{"targetKey":"javascript","clientKey":"fetch"}}'
  ></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`;

export class DocsController {
    async serveDocs(request: Request, env: Env): Promise<Response> {
        return new Response(docsHtmlTemplate, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    }

    async serveSpec(request: Request, env: Env, format: 'yaml' | 'json'): Promise<Response> {
        try {
            if (format === 'yaml') {
                const yamlContent = YamlParser.jsonToYaml(openApiSpec);
                return new Response(yamlContent, {
                    headers: {
                        'Content-Type': 'application/x-yaml; charset=utf-8',
                        'Cache-Control': 'public, max-age=3600',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            } else {
                return new Response(JSON.stringify(openApiSpec, null, 2), {
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8',
                        'Cache-Control': 'public, max-age=3600',
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
        } catch (error) {
            console.error('Error serving OpenAPI spec:', error);
            return new Response(
                JSON.stringify({ error: 'Failed to serve OpenAPI specification' }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    }
}
