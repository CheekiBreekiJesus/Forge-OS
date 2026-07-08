import type { Metadata } from "next";
import "./globals.css";
import { ThemeInitScript } from "@/theme/theme-script";

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
    <html lang="pt-PT" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
