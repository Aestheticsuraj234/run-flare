
"use client";

import { forwardRef, useEffect, useState } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/themes/prism-tomorrow.css"; // Dark theme by default, we'll override or toggle
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: string;
    className?: string;
}

export const CodeEditor = forwardRef<HTMLDivElement, CodeEditorProps>(
    ({ className, value, onChange, language = "javascript", ...props }, ref) => {
        const { theme } = useTheme();
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
            setMounted(true);
        }, []);

        const highlight = (code: string) => {
            if (!mounted) return code;

            let grammar = Prism.languages.javascript;
            if (language === "python") grammar = Prism.languages.python;
            if (language === "java") grammar = Prism.languages.java;
            if (language === "cpp" || language === "c") grammar = Prism.languages.cpp;

            return Prism.highlight(code, grammar, language);
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "relative font-mono text-sm h-full w-full border rounded-md overflow-hidden",
                    // Light mode styles
                    "bg-white text-gray-900",
                    // Dark mode styles
                    "dark:bg-[#1e1e1e] dark:text-gray-100",
                    className
                )}
            >
                <style jsx global>{`
    /* Custom scrollbar for the editor */
    .textarea - editor textarea {
    outline: none!important;
}

/* Syntax highlighting overrides for better theme integration */
code[class*= "language-"],
    pre[class*= "language-"] {
    text - shadow: none!important;
    font - family: inherit!important;
}

          /* Light mode overrides if needed, but prism-tomorrow is dark. 
             We might want a light theme for light mode. 
             For now, let's stick to a dark editor as it's often preferred for code, 
             OR we can dynamically load styles. 
             Let's use a dark editor for both for consistency/premium feel, 
             or invert colors. 
             Actually, let's try to adapt. */
             
          ${theme === 'light' ? `
            /* Force some light mode colors if we want light editor in light mode */
            /* But prism-tomorrow is dark. Let's keep it dark for "Pro" feel or 
               add a light theme import conditionally. 
               For simplicity in this step, I'll keep the dark theme for the code editor 
               as it contrasts well, but I'll ensure the container matches. */
          ` : ''
                    }
`}</style>

                <div className="absolute inset-0 overflow-auto custom-scrollbar">
                    <Editor
                        value={value}
                        onValueChange={onChange}
                        highlight={highlight}
                        padding={16}
                        className="font-mono min-h-full"
                        textareaClassName="focus:outline-none"
                        style={{
                            fontFamily: '"Fira Code", "Fira Mono", monospace',
                            fontSize: 14,
                            backgroundColor: "transparent",
                            minHeight: "100%",
                        }}
                        {...props}
                    />
                </div>
            </div>
        );
    }
);

CodeEditor.displayName = "CodeEditor";
