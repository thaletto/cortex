import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { appName, gitConfig } from "./shared";
import Image from "next/image";
import Npm from "@/components/icons/Npm";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <p className="text-2xl">Cortex</p>
        </>
      ),
      transparentMode: 'top',
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
    }
  };
}
