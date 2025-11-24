import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-var(--fd-nav-height))]">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 px-4 py-24 text-center space-y-8">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight bg-linear-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
            Secure, Scalable Code Execution Engine
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Execute code in multiple languages with real-time updates and isolated sandboxing.
            Built for developers, by developers.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/docs"
            className="inline-flex h-10 items-center border justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Get Started
          </Link>
          <Link
            href="https://github.com/Aestheticsuraj234/run-flare"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            GitHub
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 border-t bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-lg bg-card border shadow-sm">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code-2"><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></svg>
            </div>
            <h3 className="text-xl font-semibold">Multi-language Support</h3>
            <p className="text-muted-foreground">
              Run code in JavaScript, TypeScript, Python, Java, C++, and more with zero configuration.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-lg bg-card border shadow-sm">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></svg>
            </div>
            <h3 className="text-xl font-semibold">Real-time Updates</h3>
            <p className="text-muted-foreground">
              Receive instant feedback on execution status and output via our robust WebSocket API.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 p-6 rounded-lg bg-card border shadow-sm">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
            </div>
            <h3 className="text-xl font-semibold">Secure Sandboxing</h3>
            <p className="text-muted-foreground">
              Every execution runs in a strictly isolated environment, ensuring safety and preventing abuse.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
