import { useAppConfiguration } from "@/frontend/hooks/configuration/configuration.store";

import { hexToOklch } from "../lib/colors/conversion";
import { usePortalThemes } from "./portal";

export const useAppTheme = () => {
  const themeColor = useAppConfiguration("theme_color");

  usePortalThemes();

  const { l, c, h } = hexToOklch(themeColor.data.primary);

  document.documentElement.style.setProperty(
    "--app-primary",
    `${l}% ${c} ${h}`
  );
};
