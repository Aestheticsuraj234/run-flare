"use client";

import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export interface TestCase {
    id: string;
    stdin: string;
    expected_output: string;
}

interface TestCaseManagerProps {
    testCases: TestCase[];
    setTestCases: (cases: TestCase[]) => void;
}

// Generate test cases for BFS graph problem
const generateGraphTestCases = (count: number): TestCase[] => {
    return Array.from({ length: count }, (_, i) => {
        const V = 5 + i;
        const E = V - 1;

        let edges = "";
        for (let j = 0; j < E; j++) {
            edges += `${j} ${j + 1}\n`;
        }

        return {
            id: crypto.randomUUID(),
            stdin: `${V} ${E}\n${edges}`,
            expected_output: `${E}`,
        };
    });
};

export function TestCaseManager({ testCases, setTestCases }: TestCaseManagerProps) {
    const addTestCase = () => {
        const newCase: TestCase = {
            id: crypto.randomUUID(),
            stdin: "",
            expected_output: "",
        };
        setTestCases([...testCases, newCase]);
    };

    const removeTestCase = (id: string) => {
        setTestCases(testCases.filter((tc) => tc.id !== id));
    };

    const updateTestCase = (id: string, field: "stdin" | "expected_output", value: string) => {
        setTestCases(
            testCases.map((tc) => (tc.id === id ? { ...tc, [field]: value } : tc))
        );
    };

    const generateBulkTestCases = (count: number) => {
        const newCases = generateGraphTestCases(count);
        setTestCases(newCases);
    };

    return (
        <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-card border-border shadow-sm">
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30 dark:bg-muted/10 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium text-sm">Test Cases</h3>
                    <div className="flex items-center gap-1">
                        {[1, 5, 10, 50, 100].map(count => (
                            <Button
                                key={count}
                                variant="outline"
                                size="sm"
                                onClick={() => generateBulkTestCases(count)}
                                className="h-7 px-2 text-[11px] font-medium"
                                title={`Generate ${count} test case${count > 1 ? 's' : ''}`}
                            >
                                {count}
                            </Button>
                        ))}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={addTestCase}
                    className="h-8 px-3 text-xs"
                >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Custom
                </Button>
            </div>

            {testCases.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center text-muted-foreground text-sm space-y-2">
                        <p>No test cases added yet.</p>
                        <div className="flex items-center justify-center gap-2 text-xs">
                            <Button
                                variant="link"
                                onClick={addTestCase}
                                className="h-auto p-0 text-primary"
                            >
                                Add custom
                            </Button>
                            <span>or use quick generate buttons above</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-4 p-4 min-w-min">
                        {testCases.map((tc, index) => (
                            <div
                                key={tc.id}
                                className="flex-shrink-0 w-[280px] space-y-2 p-3 rounded-lg border border-border bg-background/50 dark:bg-background/30 relative group hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Case #{index + 1}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeTestCase(tc.id)}
                                        title="Delete test case"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                <div className="grid gap-2">
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1.5">
                                            Input (stdin)
                                        </label>
                                        <textarea
                                            value={tc.stdin}
                                            onChange={(e) => updateTestCase(tc.id, "stdin", e.target.value)}
                                            className="w-full p-2 text-xs font-mono bg-muted/50 dark:bg-muted/20 rounded border border-border resize-y min-h-[60px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                                            placeholder="Enter input..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1.5">
                                            Expected Output
                                        </label>
                                        <textarea
                                            value={tc.expected_output}
                                            onChange={(e) => updateTestCase(tc.id, "expected_output", e.target.value)}
                                            className="w-full p-2 text-xs font-mono bg-muted/50 dark:bg-muted/20 rounded border border-border resize-y min-h-[60px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                                            placeholder="Enter expected output..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}