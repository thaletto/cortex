import { RootProvider } from "fumadocs-ui/provider/next";
import "./global.css";
import { Geist, Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";

const spaceGrotesk = Space_Grotesk({subsets:['latin'],variable:'--font-sans'});

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn( spaceGrotesk.className, "font-sans", spaceGrotesk.variable)}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
