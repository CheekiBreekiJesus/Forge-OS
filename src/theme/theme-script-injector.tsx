"use client";

import { useServerInsertedHTML } from "next/navigation";
import { themeInitScript } from "./theme-script";

export function ThemeScriptInjector() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
  ));
  return null;
}
