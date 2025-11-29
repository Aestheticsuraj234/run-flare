import { getSandbox, Sandbox } from "@cloudflare/sandbox";
import { APP_CONFIG } from "../config/appConfig";
import { normalizeToUtf8String } from "./encoding";

export interface SandboxExecutionParams {
  submissionId: string;
  sourceCode: string;
  command: string;
  sourceFile: string;
  stdin: string;
  limits: any;
  options: any;
  isCompilation?: boolean;
}

export interface SandboxExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  exitSignal: number | null;
  time: number;
  memory: number;
  wallTime: number;
  timeLimitExceeded: boolean;
  startedAt: Date;
  finishedAt: Date;
}

// Security: Validate paths to prevent traversal attacks
export function validatePath(path: string): void {
  if (path.includes("..")) {
    throw new Error(`Invalid path: ${path}. Path traversal is not allowed.`);
  }
  if (path.startsWith("/")) {
    throw new Error(`Invalid path: ${path}. Absolute paths are not allowed.`);
  }
}

export async function executeInSandbox(
  params: SandboxExecutionParams,
  sandboxBinding: DurableObjectNamespace<Sandbox>
): Promise<SandboxExecutionResult> {
  const { submissionId, sourceCode, command, sourceFile, stdin = "", options, limits } = params;

  // Create a unique workspace directory for this submission to prevent file collisions
  // in the shared singleton sandbox.
  const ROOT_WORKSPACE = APP_CONFIG.SYSTEM.workspace;
  const SUBMISSION_DIR = `${ROOT_WORKSPACE}/${submissionId}`;

  // Use a fixed ID for the sandbox to ensure we reuse the same container (Singleton pattern)
  const sandbox = getSandbox(sandboxBinding, "shared-sandbox-instance");

  // Validate paths
  validatePath(sourceFile);
  if (options?.additionalFiles) {
    for (const f of options.additionalFiles) {
      validatePath(f.path);
    }
  }

  try {
    // Create submission directory
    await sandbox.mkdir(SUBMISSION_DIR);

    const filePath = `${SUBMISSION_DIR}/${sourceFile}`;
    await sandbox.writeFile(filePath, normalizeToUtf8String(sourceCode));

    // Write additional files
    if (options?.additionalFiles && Array.isArray(options.additionalFiles)) {
      for (const f of options.additionalFiles) {
        try {
          const p = `${SUBMISSION_DIR}/${f.path}`;
          // Ensure parent dirs exist for additional files if they have paths
          // This might be tricky if sandbox.mkdir doesn't support recursive, 
          // but for now assuming flat or simple paths. 
          // Ideally we should check for slashes and mkdir -p.
          // For safety/simplicity in this fix, we assume flat or pre-existing structure isn't needed deep.

          if (f.contentBase64) {
            await sandbox.writeFile(p, f.contentBase64, { encoding: "base64" });
          } else {
            await sandbox.writeFile(p, normalizeToUtf8String(f.content ?? ""));
          }
        } catch (e) {
          console.warn("[Sandbox] Failed to write additional file", e);
        }
      }
    }

    // Security: Sanitize arguments to prevent command injection
    const sanitizeArg = (arg: string) => {
      if (!arg) return "";
      return arg.replace(/[^a-zA-Z0-9 \-_=./]/g, "");
    };

    const segments = [command?.trim()];

    if (options?.compilerOptions) {
      segments.push(sanitizeArg(options.compilerOptions.trim()));
    }

    if (options?.commandLineArguments) {
      segments.push(sanitizeArg(options.commandLineArguments.trim()));
    }

    const fullCommand = segments.filter(Boolean).join(" ");

    if (!fullCommand) {
      throw new Error("Execution command is empty.");
    }

    // Security: Construct the command with resource limits
    const limitCmds: string[] = [];

    if (limits && !params.isCompilation) {
      if (limits.cpuTimeLimit) limitCmds.push(`ulimit -t ${Math.ceil(limits.cpuTimeLimit)}`);
      if (limits.maxFileSize) limitCmds.push(`ulimit -f ${Math.ceil(limits.maxFileSize)}`);
    }

    let wrappedCommand = fullCommand;

    // Apply limits if any
    if (limitCmds.length > 0) {
      wrappedCommand = `${limitCmds.join(" && ")} && ${wrappedCommand}`;
    }

    // Network Isolation
    if (!options?.enableNetwork && APP_CONFIG.SYSTEM.enableNetworkIsolation) {
      wrappedCommand = `unshare -n -- sh -c "${wrappedCommand.replace(/"/g, '\\"')}"`;
    }

    let stdinFilePath: string | null = null;
    let execCommand: string;

    if (stdin) {
      stdinFilePath = `${SUBMISSION_DIR}/${APP_CONFIG.SYSTEM.stdinFilePrefix}stdin.txt`;
      await sandbox.writeFile(stdinFilePath, normalizeToUtf8String(stdin));

      if (limitCmds.length > 0) {
        execCommand = `sh -c '${limitCmds.join(" && ")} && ${fullCommand.replace(/'/g, "'\\''")} < ${stdinFilePath}'`;
      } else {
        execCommand = `${fullCommand} < ${stdinFilePath}`;
      }
    } else {
      execCommand = wrappedCommand;
    }

    // Security: Implement Wall Time Limit
    const wallTimeLimitMs = (limits?.wallTimeLimit || 10) * 1000;

    // Create a timeout promise
    let timeoutId: any;
    const timeoutPromise = new Promise<SandboxExecutionResult>((resolve) => {
      timeoutId = setTimeout(() => {
        resolve({
          stdout: "",
          stderr: "Time Limit Exceeded",
          exitCode: 124,
          exitSignal: 9,
          time: wallTimeLimitMs,
          memory: 0,
          wallTime: wallTimeLimitMs,
          timeLimitExceeded: true,
          startedAt: new Date(),
          finishedAt: new Date(),
        });
      }, wallTimeLimitMs);
    });

    // Execute in the submission specific directory
    const executionPromise = sandbox.exec(execCommand, { cwd: SUBMISSION_DIR }).then((runResult) => {
      clearTimeout(timeoutId);

      const stdout = runResult.stdout ?? "";
      const stderr = runResult.stderr ?? "";
      const duration = runResult.duration ?? 0;
      const startedAt = runResult.timestamp ? new Date(runResult.timestamp) : new Date();
      const finishedAt = new Date(startedAt.getTime() + duration);

      return {
        stdout,
        stderr,
        exitCode: typeof runResult.exitCode === "number" ? runResult.exitCode : 0,
        exitSignal: null,
        time: duration,
        memory: 0,
        wallTime: duration,
        timeLimitExceeded: false,
        startedAt,
        finishedAt,
      };
    });

    return await Promise.race([executionPromise, timeoutPromise]);

  } catch (error: any) {
    console.error("[Sandbox] Execution error:", error);
    return {
      stdout: "",
      stderr: String(error?.message ?? error),
      exitCode: 1,
      exitSignal: null,
      time: 0,
      memory: 0,
      wallTime: 0,
      timeLimitExceeded: false,
      startedAt: new Date(),
      finishedAt: new Date(),
    };
  } finally {
    // Cleanup: Delete the entire submission directory
    try {
      // Recursive delete if supported, or just rm -rf via exec if API doesn't support it directly
      // The sandbox API usually has deleteFile. For directories, we might need `rm -rf` via exec
      // or delete files individually.
      // Let's try to be clean and use exec for rm -rf as it's most reliable for dirs
      await sandbox.exec(`rm -rf ${SUBMISSION_DIR}`);
    } catch (e) {
      console.warn(`[Sandbox] Failed to cleanup directory ${SUBMISSION_DIR}:`, e);
    }
  }
}
