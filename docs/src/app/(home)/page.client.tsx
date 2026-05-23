"use client";
import { useTheme } from "fumadocs-ui/provider/base";
import dynamic from "next/dynamic";

const GrainGradient = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.GrainGradient),
  {
    ssr: false,
  },
);

export function Hero() {
  const { resolvedTheme } = useTheme();
  return (
    <>
      <GrainGradient
        className="absolute inset-0 animate-fd-fade-in duration-800"
        colors={
          resolvedTheme === "dark"
            ? ["#39BE1C", "#9c2f05", "#7A2A0000"]
            : ["#fcfc51", "#ffa057", "#7A2A0020"]
        }
        colorBack="#00000000"
        softness={2}
        intensity={0.4}
        noise={0.2}
        speed={1}
        shape="wave"
        minPixelRatio={1}
        maxPixelCount={1920 * 1080}
      />
    </>
  );
}
