"use client";

import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Play, Layers, Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// Languages matching your backend
export const LANGUAGES = [
    { id: 1, name: "JavaScript (Node.js 20)", monaco: "javascript" },
    { id: 2, name: "TypeScript (5.3)", monaco: "typescript" },
    { id: 3, name: "Python (3.11)", monaco: "python" },
    { id: 4, name: "Java (OpenJDK 17)", monaco: "java" },
    { id: 5, name: "C++ (GCC 11)", monaco: "cpp" },
];

interface SubmissionControlsProps {
    languageId: number;
    setLanguageId: (id: number) => void;
    isRunning: boolean;
    onRun: (mode: "polling" | "websocket" | "batch-polling" | "batch-websocket") => void;
    submissionMode: "single" | "batch";
    setSubmissionMode: (mode: "single" | "batch") => void;
}

export default function SubmissionControls({
    languageId,
    setLanguageId,
    isRunning,
    onRun,
    submissionMode,
    setSubmissionMode,
}: SubmissionControlsProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b bg-muted/30">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Language:</span>
                    <Select
                        value={String(languageId)}
                        onValueChange={(value) => setLanguageId(Number(value))}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map((lang) => (
                                <SelectItem key={lang.id} value={String(lang.id)}>
                                    {lang.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center border rounded-md overflow-hidden bg-background">
                    <button
                        onClick={() => setSubmissionMode("single")}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium transition-colors",
                            submissionMode === "single"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-muted-foreground"
                        )}
                    >
                        Single
                    </button>
                    <div className="w-[1px] h-full bg-border" />
                    <button
                        onClick={() => setSubmissionMode("batch")}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium transition-colors",
                            submissionMode === "batch"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted text-muted-foreground"
                        )}
                    >
                        Batch
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {submissionMode === "single" ? (
                    <>
                        <Button
                            size="sm"
                            onClick={() => onRun("polling")}
                            disabled={isRunning}
                            className="gap-2"
                            variant="outline"
                        >
                            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            Run (Poll)
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => onRun("websocket")}
                            disabled={isRunning}
                            className="gap-2"
                        >
                            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                            Run (WS)
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            size="sm"
                            onClick={() => onRun("batch-polling")}
                            disabled={isRunning}
                            className="gap-2"
                            variant="outline"
                        >
                            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                            Batch (Poll)
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => onRun("batch-websocket")}
                            disabled={isRunning}
                            className="gap-2"
                        >
                            {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                            Batch (WS)
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}