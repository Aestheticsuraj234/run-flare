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
  const WORKSPACE_DIR = APP_CONFIG.SYSTEM.workspace;

  const sandbox = getSandbox(sandboxBinding, `submission-${submissionId}`);

  // Validate paths
  validatePath(sourceFile);
  if (options?.additionalFiles) {
    for (const f of options.additionalFiles) {
      validatePath(f.path);
    }
  }

  const filePath = `${WORKSPACE_DIR}/${sourceFile}`;

  await sandbox.writeFile(filePath, normalizeToUtf8String(sourceCode));

  // Write additional files
  if (options?.additionalFiles && Array.isArray(options.additionalFiles)) {
    for (const f of options.additionalFiles) {
      try {
        const p = `${WORKSPACE_DIR}/${f.path}`;
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
  // We only allow alphanumeric characters, spaces, dashes, underscores, equals, dots, and slashes.
  const sanitizeArg = (arg: string) => {
    if (!arg) return "";
    // Remove any character that is NOT allowed
    // Allowed: a-z, A-Z, 0-9, space, -, _, =, ., /
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

  // Security: Construct the command with resource limits and network isolation
  // BUT: Don't apply ulimit during compilation as it can cause timeouts
  const limitCmds: string[] = [];

  if (limits && !params.isCompilation) {
    // CPU time limit (seconds) - Soft limit
    if (limits.cpuTimeLimit) limitCmds.push(`ulimit -t ${Math.ceil(limits.cpuTimeLimit)}`);
    // Virtual memory limit (KB) - DISABLED: Too restrictive for Node.js/Java/Python which need large virtual address spaces
    // if (limits.memoryLimit) limitCmds.push(`ulimit -v ${limits.memoryLimit}`);
    // File size limit (blocks)
    if (limits.maxFileSize) limitCmds.push(`ulimit -f ${Math.ceil(limits.maxFileSize)}`);
    // Note: ulimit -u (max processes) is not supported in all shells, so we skip it
  }

  let wrappedCommand = fullCommand;

  // Apply limits if any
  if (limitCmds.length > 0) {
    wrappedCommand = `${limitCmds.join(" && ")} && ${wrappedCommand}`;
  }

  // Network Isolation
  // If network is NOT enabled AND network isolation is enabled in config, use unshare -n
  if (!options?.enableNetwork && APP_CONFIG.SYSTEM.enableNetworkIsolation) {
    wrappedCommand = `unshare -n -- sh -c "${wrappedCommand.replace(/"/g, '\\"')}"`;
  }

  let stdinFilePath: string | null = null;
  let execCommand: string;

  if (stdin) {
    stdinFilePath = `${WORKSPACE_DIR}/${APP_CONFIG.SYSTEM.stdinFilePrefix}${submissionId}-${crypto.randomUUID()}.txt`;
    await sandbox.writeFile(stdinFilePath, normalizeToUtf8String(stdin));

    // Wrap everything in a shell to properly handle stdin redirection with ulimit
    // The ulimit commands need to be in the same shell as the execution
    if (limitCmds.length > 0) {
      execCommand = `sh -c '${limitCmds.join(" && ")} && ${fullCommand.replace(/'/g, "'\\''")} < ${stdinFilePath}'`;
    } else {
      execCommand = `${fullCommand} < ${stdinFilePath}`;
    }
  } else {
    execCommand = wrappedCommand;
  }

  try {
    // Security: Implement Wall Time Limit
    const wallTimeLimitMs = (limits?.wallTimeLimit || 10) * 1000;

    // Create a timeout promise
    let timeoutId: any;
    const timeoutPromise = new Promise<SandboxExecutionResult>((resolve) => {
      timeoutId = setTimeout(() => {
        resolve({
          stdout: "",
          stderr: "Time Limit Exceeded",
          exitCode: 124, // Standard timeout exit code
          exitSignal: 9, // SIGKILL
          time: wallTimeLimitMs,
          memory: 0,
          wallTime: wallTimeLimitMs,
          timeLimitExceeded: true,
          startedAt: new Date(),
          finishedAt: new Date(),
        });
      }, wallTimeLimitMs);
    });

    const executionPromise = sandbox.exec(execCommand, { cwd: WORKSPACE_DIR }).then((runResult) => {
      clearTimeout(timeoutId);

      const stdout = runResult.stdout ?? "";
      const stderr = runResult.stderr ?? "";
      const duration = runResult.duration ?? 0; // duration is usually in ms
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

    // Race execution against timeout
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
  }

}
