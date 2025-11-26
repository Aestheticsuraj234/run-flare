"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, Database, Terminal, AlertCircle, Loader2 } from "lucide-react";

export interface ExecutionResult {
    token: string;
    status?: {
        id: number;
        description: string;
        name?: string;
    };
    stdout?: string | null;
    stderr?: string | null;
    compile_output?: string | null;
    message?: string | null;
    time?: string | null;
    memory?: number | null;
    testCaseId?: string; // For batch mapping
}

interface OutputDisplayProps {
    results: ExecutionResult[];
    isLoading: boolean;
    error?: string | null;
}

// Status categorization based on backend IDs
const getStatusCategory = (statusId?: number) => {
    if (!statusId) return "processing";
    if (statusId === 1 || statusId === 2) return "processing"; // In Queue, Processing
    if (statusId === 3) return "success"; // Accepted
    return "error"; // 4-13: Wrong Answer, TLE, Compilation Error, Runtime Errors, Internal Error
};

const getStatusColor = (statusId?: number) => {
    const category = getStatusCategory(statusId);

    switch (category) {
        case "success":
            return "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20";
        case "error":
            return "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20";
        case "processing":
        default:
            return "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20";
    }
};

const getStatusIcon = (statusId?: number) => {
    const category = getStatusCategory(statusId);

    switch (category) {
        case "success":
            return <CheckCircle2 className="w-3.5 h-3.5" />;
        case "error":
            return <XCircle className="w-3.5 h-3.5" />;
        case "processing":
        default:
            return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    }
};

export function OutputDisplay({ results, isLoading, error }: OutputDisplayProps) {
    if (error) {
        return (
            <div className="h-full p-6 border rounded-lg bg-destructive/10 dark:bg-destructive/5 border-destructive/20 text-destructive flex items-center justify-center text-center">
                <div className="space-y-3">
                    <XCircle className="w-10 h-10 mx-auto opacity-80" />
                    <div>
                        <p className="font-semibold text-base">Execution Error</p>
                        <p className="text-sm opacity-90 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (results.length === 0 && !isLoading) {
        return (
            <div className="h-full p-8 border rounded-lg bg-muted/10 dark:bg-muted/5 border-border text-muted-foreground flex flex-col items-center justify-center text-center">
                <Terminal className="w-14 h-14 mb-4 opacity-20" />
                <div className="space-y-1">
                    <p className="font-medium">Ready to Execute</p>
                    <p className="text-sm opacity-80">Select a language and run your code to see results</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full border rounded-lg overflow-hidden bg-card border-border shadow-sm flex flex-col">
            <div className="p-3 border-b border-border bg-muted/30 dark:bg-muted/10">
                <h3 className="font-medium text-sm flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Output
                    {isLoading && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Running...
                        </span>
                    )}
                </h3>
            </div>

            <ScrollArea className="flex-1">
                <div className="divide-y divide-border">
                    {results.map((result, index) => {
                        const statusCategory = getStatusCategory(result.status?.id);
                        const isSuccess = statusCategory === "success";
                        const isError = statusCategory === "error";
                        const isProcessing = statusCategory === "processing";

                        return (
                            <div key={result.token || index} className="p-4 space-y-3 hover:bg-muted/5 transition-colors">
                                {/* Header */}
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
                                            Result #{index + 1}
                                        </span>
                                        <div
                                            className={cn(
                                                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap",
                                                getStatusColor(result.status?.id)
                                            )}
                                        >
                                            {getStatusIcon(result.status?.id)}
                                            <span className="truncate">{result.status?.description || result.message || "Unknown"}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                                        {result.time && (
                                            <div className="flex items-center gap-1" title="Execution time">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{result.time}ms</span>
                                            </div>
                                        )}
                                        {result.memory && result.memory > 0 && (
                                            <div className="flex items-center gap-1" title="Memory used">
                                                <Database className="w-3.5 h-3.5" />
                                                <span>{Math.round(result.memory / 1024)}KB</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Output sections */}
                                {result.stdout && (
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium text-muted-foreground">Output:</span>
                                        <pre className="p-3 rounded-md bg-muted/50 dark:bg-muted/20 text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-border">
                                            {result.stdout.startsWith("data:") || result.stdout.length < 100 ? result.stdout : atob(result.stdout)}
                                        </pre>
                                    </div>
                                )}

                                {result.stderr && (
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium text-destructive flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Error Output:
                                        </span>
                                        <pre className="p-3 rounded-md bg-destructive/10 dark:bg-destructive/5 text-destructive text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-destructive/20">
                                            {result.stderr.startsWith("data:") || result.stderr.length < 100 ? result.stderr : atob(result.stderr)}
                                        </pre>
                                    </div>
                                )}

                                {result.compile_output && (
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-medium text-orange-600 dark:text-orange-500 flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5" />
                                            Compilation:
                                        </span>
                                        <pre className="p-3 rounded-md bg-orange-500/10 dark:bg-orange-500/5 text-orange-600 dark:text-orange-500 text-xs font-mono overflow-x-auto whitespace-pre-wrap border border-orange-500/20">
                                            {result.compile_output.startsWith("data:") || result.compile_output.length < 100 ? result.compile_output : atob(result.compile_output)}
                                        </pre>
                                    </div>
                                )}

                                {/* Show placeholder for processing states with no output yet */}
                                {isProcessing && !result.stdout && !result.stderr && !result.compile_output && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 bg-muted/20 dark:bg-muted/10 rounded-md border border-border">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Waiting for output...</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
}
