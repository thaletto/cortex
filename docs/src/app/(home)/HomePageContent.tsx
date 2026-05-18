"use client";

import Link from "next/link";
import Image from "next/image";
import { Cards, Card } from "fumadocs-ui/components/card";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { ArrowRight, Database, Zap, Layers, Cpu, Lock } from "lucide-react";

function GitHubIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const features = [
  {
    icon: Database,
    title: "Vector Storage",
    description: "Store and retrieve embeddings with type-safe operations built on ZVec."
  },
  {
    icon: Layers,
    title: "Explicit Memory",
    description: "Developer-controlled context management with full visibility into memory operations."
  },
  {
    icon: Zap,
    title: "Effect Native",
    description: "Built entirely with Effect for robust error handling and composable workflows."
  },
  {
    icon: Lock,
    title: "Type-Safe",
    description: "Full TypeScript support with generics for embedding types and search results."
  },
  {
    icon: Cpu,
    title: "Pluggable Backend",
    description: "Swap storage implementations without changing your application logic."
  },
  {
    icon: ArrowRight,
    title: "Production Ready",
    description: "Battle-tested patterns for AI applications with proven reliability."
  }
];

const codeExample = `import { VectorStore, VectorStoreLive } from "@thaletto/cortex";

const program = Effect.gen(function* () {
  const store = yield* VectorStore;
  
  // Your embedding from an embedding model
  const embedding = yield* getEmbedding("User prefers TypeScript");
  
  // Store a vector with metadata
  yield* store.store("doc-1", embedding, {
    content: "User prefers TypeScript",
    category: "preferences",
  });

  // Search for similar vectors
  const results = yield* store.search(embedding, {
    limit: 5,
  });
});

Effect.runPromise(program.pipe(Effect.provide(VectorStoreLive)));`;

export default function HomePageContent() {
  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-4 py-12 gap-16">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center gap-6 max-w-3xl">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
          Vector Storage for AI Applications
        </h1>

        <p className="text-lg sm:text-xl text-white/70 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out" style={{ animationDelay: "50ms", animationFillMode: "backwards" }}>
          Developer-controlled context memory layer for Effect applications.
          Type-safe, pluggable, and designed for explicit memory management.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out" style={{ animationDelay: "100ms", animationFillMode: "backwards" }}>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black px-6 py-2.5 font-medium transition-transform duration-160 ease-out hover:scale-[1.02] active:scale-[0.97]"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="https://github.com/thaletto/cortex"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 text-white px-6 py-2.5 font-medium transition-colors duration-200 hover:bg-white/10"
          >
            <GitHubIcon size={18} />
            GitHub
          </Link>
        </div>
      </section>

      {/* Code Example */}
      <section className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out" style={{ animationDelay: "150ms", animationFillMode: "backwards" }}>
        <DynamicCodeBlock lang="typescript" code={codeExample} />
      </section>

      {/* Footer */}
      <footer className="flex flex-wrap justify-center gap-4 text-sm animate-in fade-in duration-300 ease-out" style={{ animationDelay: "200ms", animationFillMode: "backwards" }}>
        <span className="text-white/50">
          Made with ❤️{" "}
          <Link
            href="https://thaletto.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white/90 transition-colors"
          >
            Laxman K R
          </Link>
        </span>
      </footer>
    </div>
  );
}