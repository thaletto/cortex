"use client";
import { Dithering } from "@paper-design/shaders-react";
import { useTheme } from "fumadocs-ui/provider/base";
import dynamic from "next/dynamic";

const GrainGradient = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.Dithering),
  {
    ssr: false,
  },
);

export function Hero() {
  const { resolvedTheme } = useTheme();
  return (
    <>
      <Dithering
        className="absolute inset-0 animate-fd-fade-in duration-800"
        colorBack={resolvedTheme === "dark" ? "#000" : "#FFF"}
        colorFront="#5C8AFF"
        shape="wave"
        type="4x4"
        size={1.8}
        speed={0.54}
        scale={0.36}
        offsetX={-0.26}
        offsetY={0.24}
      />
    </>
  );
}
