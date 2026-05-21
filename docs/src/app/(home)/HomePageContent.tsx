"use client";

import Link from "next/link";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import TextType from "@/components/TextType";
import ShinyText from "@/components/ShinyText";

const codeExample = `bun add @cortex/cortex`;

export default function HomePageContent() {
  const easeOut = "cubic-bezier(0.23, 1, 0.32, 1)";

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-4 min-h-[calc(100vh-80px)]">
      <div className="flex-1 flex flex-col items-center justify-center py-12 gap-12 w-full">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6 max-w-4xl">
          <h1
            className="text-4xl sm:text-6xl font-bold tracking-tight text-white animate-in fade-in slide-in-from-bottom-4 duration-400"
            style={{ animationTimingFunction: easeOut }}
          >
            <TextType text="The ORM for vector databases" loop={false} />
          </h1>

          <div
            className="text-xl sm:text-3xl font-medium leading-tight max-w-3xl text-white/60 animate-in fade-in slide-in-from-bottom-4 duration-400"
            style={{
              animationDelay: "80ms",
              animationFillMode: "backwards",
              animationTimingFunction: easeOut
            }}
          >
            <ShinyText
              text="Built natively for Effect"
              disabled={false}
              speed={3}
              color="rgba(255, 255, 255, 0.55)"
              shineColor="white"
            />
          </div>
        </section>

        <div
          className="animate-in fade-in slide-in-from-bottom-4 duration-400"
          style={{
            animationDelay: "320ms",
            animationFillMode: "backwards",
            animationTimingFunction: easeOut
          }}
        >
          <Link
            href="/docs"
            className="inline-flex items-center justify-center px-7 py-2.5 text-base font-medium text-black bg-white rounded-lg transition-[transform,background-color] duration-200 hover:scale-[1.02] active:scale-[0.96] shadow-xl shadow-white/5"
            style={{ transitionTimingFunction: easeOut }}
          >
            Start building
          </Link>
        </div>

        {/* Code Example */}
        <section
          className="w-full max-w-xs sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-400"
          style={{
            animationDelay: "240ms",
            animationFillMode: "backwards",
            animationTimingFunction: easeOut
          }}
        >
          <DynamicCodeBlock lang="bash" code={codeExample} />
        </section>
      </div>

      {/* Footer */}
      <footer
        className="py-10 animate-in fade-in duration-700"
        style={{
          animationDelay: "400ms",
          animationFillMode: "backwards",
          animationTimingFunction: easeOut
        }}
      >
        <span className="text-xs font-medium text-white/20 tracking-widest uppercase">
          Crafted by{" "}
          <Link
            href="https://thaletto.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/30 hover:text-white/60 transition-colors underline decoration-white/5 underline-offset-8"
          >
            Laxman K R
          </Link>
        </span>
      </footer>
    </div>
  );
}