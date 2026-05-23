import type { Metadata } from "next";
import { Hero } from "./page.client";
import { cva } from "class-variance-authority";
import Link from "next/link";
import { cn } from "@/lib/cn";
import Github from "@/components/icons/Github";
import TextType from "@/components/TextType";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Tabs, Tab } from "fumadocs-ui/components/tabs";
import Effect from "@/components/icons/Effect";

export const metadata: Metadata = {
  title: "Cortex",
  openGraph: {
    title: "Cortex - Vector Storage for AI Applications",
    description:
      "Developer-controlled context memory layer for Effect applications. Vector storage for AI/LLM applications, built with Effect and ZVec.",
    type: "website",
  },
};

const buttonVariants = cva(
  "inline-flex justify-center px-5 py-3 rounded-full font-medium tracking-tight transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export default function HomePage() {
  const packageManagers = [
    { name: "npm", cmd: "npm install @cortex/cortex" },
    { name: "pnpm", cmd: "pnpm add @cortex/cortex" },
    { name: "bun", cmd: "bun add @cortex/cortex" },
  ];
  return (
    <main className="text-foreground h-[calc(100vh-56px)]">
      <div className="relative flex overflow-hidden w-full h-full bg-background">
        <Hero />

        <div className="flex flex-col z-2 size-full p-6 md:p-12 pt-12 md:pt-24 items-center">
          <TextType
            text="The ORM for Vector Databases."
            className="text-3xl sm:text-4xl xl:text-5xl mt-8 leading-tight text-center font-medium mb-8 md:mb-12"
            loop={false}
          />
          <div
            className="flex flex-row items-center font-medium gap-4 mb-8 md:mb-12"
            style={{ animation: "jump-in 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) both" }}
          >
            <style>{`
              @keyframes jump-in {
                0%   { transform: translateY(0);     opacity: 0; }
                30%  { transform: translateY(-32px); opacity: 1; }
                55%  { transform: translateY(8px);   }
                75%  { transform: translateY(-14px); }
                90%  { transform: translateY(4px);   }
                100% { transform: translateY(0);     }
              }
            `}</style>
            <Effect />
            <p className="text-xl sm:text-2xl xl:text-3xl">Effect Native</p>
          </div>
          <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 flex-wrap w-fit">
            <Link
              href="/docs"
              className={cn(buttonVariants(), "text-sm sm:text-base")}
            >
              Getting Started
            </Link>
            <a
              href="https://github.com/thaletto/cortex"
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "text-sm sm:text-base",
              )}
            >
              <Github wordmark />
            </a>
          </div>
          <div className="w-full max-w-sm sm:min-w-100 mt-6 md:mt-8">
            <Tabs items={["npm", "pnpm", "bun"]} className="w-full">
              {packageManagers.map(({ name, cmd }) => (
                <Tab key={name} value={name}>
                  <DynamicCodeBlock code={cmd} lang="bash" codeblock={{ className: "text-left" }} />
                </Tab>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}
