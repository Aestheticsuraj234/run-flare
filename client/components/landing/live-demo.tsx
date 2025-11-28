"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CodeEditor } from "./code-editor";
import { TestCaseManager, TestCase } from "./test-case-manager";
import SubmissionControls, { LANGUAGES } from "./submission-controls";
import { OutputDisplay, ExecutionResult } from "./output-display";

// Constants
const API_BASE_URL = "http://localhost:8787/api/v1";
const POLLING_INTERVAL = 1000;
const MAX_POLLING_RETRIES = 20;
const PROCESSING_STATUS_ID = 3; // Status IDs >= 3 are final states

// Default code snippets - BFS Shortest Path problem
const DEFAULT_CODE: Record<number, string> = {
    1: `// JavaScript (Node.js 20) - BFS Shortest Path
// Input: V E (vertices edges), then E lines of u v
// Output: Shortest path distance from 0 to V-1

const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');

if (input.length === 0) {
  console.log(-1);
  process.exit(0);
}

const [V, E] = input[0].split(' ').map(Number);
const adj = Array.from({ length: V }, () => []);

for (let i = 1; i <= E; i++) {
  const [u, v] = input[i].split(' ').map(Number);
  adj[u].push(v);
  adj[v].push(u);
}

const q = [0];
const dist = Array(V).fill(-1);
dist[0] = 0;

while (q.length > 0) {
  const u = q.shift();
  if (u === V - 1) break;

  for (const v of adj[u]) {
    if (dist[v] === -1) {
      dist[v] = dist[u] + 1;
      q.push(v);
    }
  }
}

console.log(dist[V - 1]);`,
    2: `// TypeScript (5.3) - BFS Shortest Path
// Input: V E, then E lines of u v
// Output: Distance from 0 to V-1

import * as fs from 'fs';

const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length === 0) {
  console.log(-1);
  process.exit(0);
}

const [V, E] = input[0].split(' ').map(Number);
const adj: number[][] = Array.from({ length: V }, () => []);

for (let i = 1; i <= E; i++) {
  const [u, v] = input[i].split(' ').map(Number);
  adj[u].push(v);
  adj[v].push(u);
}

const q: number[] = [0];
const dist: number[] = Array(V).fill(-1);
dist[0] = 0;

while (q.length > 0) {
  const u = q.shift()!;
  if (u === V - 1) break;

  for (const v of adj[u]) {
    if (dist[v] === -1) {
      dist[v] = dist[u] + 1;
      q.push(v);
    }
  }
}

console.log(dist[V - 1]);`,
    3: `# Python (3.11) - BFS Shortest Path
# Input: V E, then E lines of u v
# Output: Distance from 0 to V-1

import sys
from collections import deque

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        print(-1)
        return

    iterator = iter(input_data)
    try:
        V = int(next(iterator))
        E = int(next(iterator))
    except StopIteration:
        print(-1)
        return

    adj = [[] for _ in range(V)]
    for _ in range(E):
        try:
            u = int(next(iterator))
            v = int(next(iterator))
            adj[u].append(v)
            adj[v].append(u)
        except StopIteration:
            break

    q = deque([0])
    dist = [-1] * V
    dist[0] = 0

    while q:
        u = q.popleft()
        if u == V - 1:
            break
        
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)

    print(dist[V - 1])

if __name__ == "__main__":
    solve()`,
    4: `// Java (OpenJDK 17) - BFS Shortest Path
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) {
            System.out.println(-1);
            return;
        }

        int V = sc.nextInt();
        int E = sc.nextInt();

        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < V; i++) {
            adj.add(new ArrayList<>());
        }

        for (int i = 0; i < E; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            adj.get(u).add(v);
            adj.get(v).add(u);
        }

        Queue<Integer> q = new LinkedList<>();
        q.add(0);
        int[] dist = new int[V];
        Arrays.fill(dist, -1);
        dist[0] = 0;

        while (!q.isEmpty()) {
            int u = q.poll();
            if (u == V - 1) break;

            for (int v : adj.get(u)) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + 1;
                    q.add(v);
                }
            }
        }

        System.out.println(dist[V - 1]);
        sc.close();
    }
}`,
    5: `// C++ (GCC 11) - BFS Shortest Path
#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>

using namespace std;

int main() {
    int V, E;
    if (!(cin >> V >> E)) {
        cout << -1 << endl;
        return 0;
    }

    vector<vector<int>> adj(V);
    for (int i = 0; i < E; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    queue<int> q;
    q.push(0);
    vector<int> dist(V, -1);
    dist[0] = 0;

    while (!q.empty()) {
        int u = q.front();
        q.pop();

        if (u == V - 1) break;

        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }

    cout << dist[V - 1] << endl;
    return 0;
}`
};

// Helper function to get WebSocket URL
const getWebSocketUrl = (token: string): string => {
    return `ws://localhost:8787/api/v1/submissions/${token}/ws`;
};

// API helper functions
const createSubmission = async (
    code: string,
    languageId: number,
    stdin: string,
    expectedOutput?: string
): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            source_code: code,
            language_id: languageId,
            stdin: stdin,
            expected_output: expectedOutput,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Failed to create submission`);
    }

    const result = await response.json();
    return result.data?.token || result.token;
};

const createBatchSubmissions = async (
    code: string,
    languageId: number,
    testCases: TestCase[]
): Promise<string[]> => {
    const submissions = testCases.map(tc => ({
        source_code: code,
        language_id: languageId,
        stdin: tc.stdin,
        expected_output: tc.expected_output,
    }));

    const response = await fetch(`${API_BASE_URL}/submissions/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissions }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: Failed to create batch submission`);
    }

    const result = await response.json();
    const tokens = result.data || result;
    return Array.isArray(tokens) ? tokens.map((t: any) => t.token) : [];
};

export function LiveDemo() {
    const [languageId, setLanguageId] = useState(3); // Default to Python
    const [code, setCode] = useState(DEFAULT_CODE[3]);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [submissionMode, setSubmissionMode] = useState<"single" | "batch">("single");
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<ExecutionResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Refs for cleanup
    const wsRef = useRef<WebSocket | null>(null);
    const wsRefsMap = useRef<Map<string, WebSocket>>(new Map());
    const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup function
    const cleanup = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        // Close all batch WebSocket connections
        wsRefsMap.current.forEach(ws => ws.close());
        wsRefsMap.current.clear();

        if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current);
            pollingTimeoutRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    // Update code when language changes (only if using default code)
    useEffect(() => {
        const isUsingDefaultCode = Object.values(DEFAULT_CODE).some(
            defaultCode => defaultCode === code
        );

        if (isUsingDefaultCode || code === "") {
            const newCode = DEFAULT_CODE[languageId];
            if (newCode) {
                setCode(newCode);
            }
        }
    }, [languageId, code]);

    const updateResult = useCallback((token: string, update: Partial<ExecutionResult>) => {
        setResults(prev =>
            prev.map(r => (r.token === token ? { ...r, ...update } : r))
        );
    }, []);

    const pollSubmission = useCallback(async (token: string) => {
        let retries = 0;

        const poll = async (): Promise<void> => {
            try {
                const response = await fetch(`${API_BASE_URL}/submissions/${token}`);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: Failed to fetch submission status`);
                }

                const result = await response.json();
                const data = result.data || result;
                updateResult(token, data);

                // Check if finished
                if (data.status?.id >= PROCESSING_STATUS_ID) {
                    setIsRunning(false);
                    return;
                }

                // Continue polling
                retries++;
                if (retries < MAX_POLLING_RETRIES) {
                    pollingTimeoutRef.current = setTimeout(poll, POLLING_INTERVAL);
                } else {
                    throw new Error("Polling timed out after maximum retries");
                }
            } catch (err) {
                setIsRunning(false);
                throw err;
            }
        };

        await poll();
    }, [updateResult]);

    const pollBatch = useCallback(async (tokens: string[]) => {
        let retries = 0;
        const tokenString = tokens.join(",");

        const poll = async (): Promise<void> => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/submissions/batch?tokens=${tokenString}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: Failed to fetch batch submission status`);
                }

                const result = await response.json();
                const batchData = result.data || result;

                // Update results with the fetched data
                if (Array.isArray(batchData)) {
                    setResults(prev => {
                        return prev.map(prevResult => {
                            const updatedData = batchData.find((d: any) => d.token === prevResult.token);
                            return updatedData ? { ...prevResult, ...updatedData } : prevResult;
                        });
                    });

                    // Check if all submissions are finished
                    const allFinished = batchData.every((d: any) => d.status?.id >= PROCESSING_STATUS_ID);

                    if (allFinished) {
                        setIsRunning(false);
                        return;
                    }
                }

                // Continue polling
                retries++;
                if (retries < MAX_POLLING_RETRIES) {
                    pollingTimeoutRef.current = setTimeout(poll, POLLING_INTERVAL);
                } else {
                    throw new Error("Batch polling timed out after maximum retries");
                }
            } catch (err) {
                setIsRunning(false);
                throw err;
            }
        };

        await poll();
    }, []);

    const connectWebSocket = useCallback((token: string) => {
        const wsUrl = getWebSocketUrl(token);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("WebSocket connected");
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                if (msg.type === "status_update" || msg.type === "connected") {
                    const data = msg.data || {};
                    updateResult(token, {
                        status: msg.status || data.status,
                        stdout: data.stdout,
                        stderr: data.stderr,
                        compile_output: data.compile_output,
                        time: data.time,
                        memory: data.memory,
                    });

                    // Check if finished
                    const statusId = msg.status?.id || data.status?.id;
                    if (statusId && statusId >= PROCESSING_STATUS_ID) {
                        setIsRunning(false);
                        ws.close();
                    }
                }
            } catch (err) {
                console.error("Failed to parse WebSocket message:", err);
            }
        };

        ws.onerror = (e) => {
            console.error("WebSocket error:", e);
            setError("WebSocket connection failed. Falling back to polling.");
            ws.close();
            pollSubmission(token);
        };

        ws.onclose = () => {
            wsRef.current = null;
        };
    }, [updateResult, pollSubmission]);

    const connectBatchWebSockets = useCallback((tokens: string[]) => {
        let finishedCount = 0;
        const totalCount = tokens.length;

        tokens.forEach(token => {
            const wsUrl = getWebSocketUrl(token);
            const ws = new WebSocket(wsUrl);
            wsRefsMap.current.set(token, ws);

            ws.onopen = () => {
                console.log(`WebSocket connected for token: ${token}`);
            };

            ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);

                    if (msg.type === "status_update" || msg.type === "connected") {
                        const data = msg.data || {};
                        updateResult(token, {
                            status: msg.status || data.status,
                            stdout: data.stdout,
                            stderr: data.stderr,
                            compile_output: data.compile_output,
                            time: data.time,
                            memory: data.memory,
                        });

                        // Check if this submission finished
                        const statusId = msg.status?.id || data.status?.id;
                        if (statusId && statusId >= PROCESSING_STATUS_ID) {
                            finishedCount++;
                            ws.close();
                            wsRefsMap.current.delete(token);

                            // Check if all submissions are finished
                            if (finishedCount >= totalCount) {
                                setIsRunning(false);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Failed to parse WebSocket message for token ${token}:`, err);
                }
            };

            ws.onerror = (e) => {
                console.error(`WebSocket error for token ${token}:`, e);
                ws.close();
                wsRefsMap.current.delete(token);
                // Fallback to polling for this specific token
                pollSubmission(token);
            };

            ws.onclose = () => {
                wsRefsMap.current.delete(token);
            };
        });
    }, [updateResult, pollSubmission]);

    const runSingle = useCallback(async (mode: "polling" | "websocket") => {
        const stdin = testCases.length > 0 ? testCases[0].stdin : "";
        const expectedOutput = testCases.length > 0 ? testCases[0].expected_output : undefined;

        const token = await createSubmission(code, languageId, stdin, expectedOutput);

        // Set initial result
        setResults([{
            token,
            status: { id: 1, description: "In Queue" },
            testCaseId: testCases[0]?.id,
        }]);

        if (mode === "websocket") {
            connectWebSocket(token);
        } else {
            await pollSubmission(token);
        }
    }, [code, languageId, testCases, connectWebSocket, pollSubmission]);

    const runBatch = useCallback(async (mode: "polling" | "websocket") => {
        if (testCases.length === 0) {
            throw new Error("Add at least one test case for batch execution");
        }

        const tokens = await createBatchSubmissions(code, languageId, testCases);

        // Set initial results
        setResults(
            tokens.map((token, i) => ({
                token,
                status: { id: 1, description: "In Queue" },
                testCaseId: testCases[i].id,
            }))
        );

        if (mode === "websocket") {
            connectBatchWebSockets(tokens);
        } else {
            await pollBatch(tokens);
        }
    }, [code, languageId, testCases, pollBatch, connectBatchWebSockets]);

    const handleRun = useCallback(async (mode: "polling" | "websocket" | "batch-polling" | "batch-websocket") => {
        cleanup(); // Clean up any existing connections
        setIsRunning(true);
        setResults([]);
        setError(null);

        try {
            if (mode === "batch-polling") {
                await runBatch("polling");
            } else if (mode === "batch-websocket") {
                await runBatch("websocket");
            } else {
                await runSingle(mode);
            }
        } catch (err) {
            console.error("Execution error:", err);
            setError(err instanceof Error ? err.message : "An unknown error occurred");
            setIsRunning(false);
        }
    }, [cleanup, runBatch, runSingle]);

    const selectedLanguage = LANGUAGES.find(l => l.id === languageId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mx-auto">
            {/* Left Column - Editor and Test Cases */}
            <div className="flex flex-col gap-4 min-h-[700px] lg:min-h-[750px]">
                {/* Code Editor */}
                <div className="flex-1 border rounded-lg overflow-hidden bg-card shadow-sm border-border">
                    <SubmissionControls
                        languageId={languageId}
                        setLanguageId={setLanguageId}
                        isRunning={isRunning}
                        onRun={handleRun}
                        submissionMode={submissionMode}
                        setSubmissionMode={setSubmissionMode}
                    />
                    <div className="h-[450px] lg:h-[500px] relative">
                        <CodeEditor
                            value={code}
                            onChange={setCode}
                            language={selectedLanguage?.monaco || "javascript"}
                            className="absolute inset-0"
                        />
                    </div>
                </div>

                {/* Test Cases */}
                <div className="h-[200px] lg:h-[220px]">
                    <TestCaseManager testCases={testCases} setTestCases={setTestCases} />
                </div>
            </div>

            {/* Right Column - Output */}
            <div className="min-h-[700px] lg:min-h-[750px]">
                <OutputDisplay results={results} isLoading={isRunning} error={error} />
            </div>
        </div>
    );
}