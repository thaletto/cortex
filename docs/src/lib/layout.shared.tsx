import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, gitConfig } from "./shared";
import Image from "next/image";
import Npm from "@/components/icons/Npm";
import { HugeiconsIcon } from "@hugeicons/react";
import { NeuralNetworkIcon } from "@hugeicons/core-free-icons";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <HugeiconsIcon icon={NeuralNetworkIcon} size={32}/>
          <p className="text-2xl">Cortex</p>
        </>
      ),
      transparentMode: "always",
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        type: "icon",
        label: "npm",
        icon: <Npm />,
        text: "npm",
        url: `https://www.npmjs.com/package/@${gitConfig.user}/${gitConfig.repo}`,
      },
    ],
    themeSwitch: {
      enabled: true,
    },
  };
}
