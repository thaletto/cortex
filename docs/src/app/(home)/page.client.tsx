"use client";
import { useTheme } from "fumadocs-ui/provider/base";
import dynamic from "next/dynamic";

const MeshGradient = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.MeshGradient),
  {
    ssr: false,
  },
);

export function Hero() {
  const { resolvedTheme } = useTheme();
  return (
    <>
      <MeshGradient
        className="absolute inset-0 animate-fdanimate-fd-fade-in duration-800"
        colors={
          resolvedTheme === "dark"
            ? ["#1F6B10", "#5A1A03", "#2A1A0000"]
            : ["#E8E87A", "#F5C49A", "#E8C8A010"]
        }
        speed={0.5}
        minPixelRatio={1}
        maxPixelCount={1920 * 1080}
      />
    </>
  );
}
