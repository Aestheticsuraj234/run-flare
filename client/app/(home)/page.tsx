import Link from 'next/link';
import { LiveDemo } from '@/components/landing/live-demo';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-20 sm:py-24 text-center space-y-8">
        <div className="space-y-4 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
              Secure, Scalable Code Execution Engine
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Execute code in multiple languages with real-time updates and isolated sandboxing.
            Built for developers, by developers.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/docs"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all"
          >
            Get Started
          </Link>
          <Link
            href="https://github.com/Aestheticsuraj234/run-flare"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-input bg-background px-8 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-all"
          >
            GitHub
          </Link>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="w-full px-4 py-12 sm:py-16 bg-muted/30 dark:bg-muted/10 border-y border-border">
        <div className="container mx-auto space-y-8 max-w-7xl">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">Experience it Live</h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Run code directly in your browser. Test our robust API with real-time feedback.
            </p>
          </div>
          <div className="w-full">
            <LiveDemo />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Feature 1 */}
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m18 16 4-4-4-4" />
                <path d="m6 8-4 4 4 4" />
                <path d="m14.5 4-5 16" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Multi-language Support</h3>
            <p className="text-muted-foreground text-sm">
              Run code in JavaScript, TypeScript, Python, Java, C++, and more with zero configuration.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Real-time Updates</h3>
            <p className="text-muted-foreground text-sm">
              Receive instant feedback on execution status and output via our robust WebSocket API.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="p-3 rounded-full bg-primary/10 dark:bg-primary/20 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Secure Sandboxing</h3>
            <p className="text-muted-foreground text-sm">
              Every execution runs in a strictly isolated environment, ensuring safety and preventing abuse.
            </p>
          </div>
        </div>
      </section>

      {/* Footer spacing */}
      <div className="flex-1" />
    </div>
  );
}