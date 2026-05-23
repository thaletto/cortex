"use client";
import { useTheme } from "fumadocs-ui/provider/base";
import dynamic from "next/dynamic";

const GrainGradient = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.GrainGradient),
  {
    ssr: false,
  },
);

const Dithering = dynamic(
  () => import("@paper-design/shaders-react").then((mod) => mod.Dithering),
  {
    ssr: false,
  },
);

export function Hero() {
  const { resolvedTheme } = useTheme();
  return (
    <>
      <GrainGradient
        className="absolute inset-0 animate-fdanimate-fd-fade-in duration-800"
        colors={
          resolvedTheme === "dark"
            ? ["#39BE1C", "#9C2F05", "#7A2A0000"]
            : ["#FCFC51", "#FFA057", "#7A2A0020"]
        }
        colorBack="#00000000"
        softness={1}
        intensity={0.9}
        noise={0.5}
        speed={1}
        shape="corners"
        minPixelRatio={1}
        maxPixelCount={1920 * 1080}
      />
      <Dithering
        width={360}
        height={360}
        colorBack="#00000000"
        colorFront={resolvedTheme === "dark" ? "#DF3F00" : "#FA8023"}
        shape="sphere"
        type="4x4"
        scale={0.5}
        size={3}
        speed={1}
        frame={5000 * 120}
        minPixelRatio={1}
        className="absolute animate-fd-fade-in duration-400 max-lg:bottom-[-10%] max-lg:-left-50 lg:bottom-[-5%] lg:right-0"
      />
    </>
  );
}
