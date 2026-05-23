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
            ? ["#39BE1C", "#9C2F05", "#7A2A0000"]
            : ["#FCFC51", "#FFA057", "#7A2A0020"]
        }
        speed={0.5}
        minPixelRatio={1}
        maxPixelCount={1920 * 1080}
      />
    </>
  );
}
