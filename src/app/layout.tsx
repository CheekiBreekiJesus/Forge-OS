import type { Metadata } from "next";
import "./globals.css";
import { ThemeScriptInjector } from "@/theme/theme-script-injector";

export const metadata: Metadata = {
  title: "ForgeOS",
  description: "Industrial operating system for manufacturing teams."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeScriptInjector />
        {children}
      </body>
    </html>
  );
}
