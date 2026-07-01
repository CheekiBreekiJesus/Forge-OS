import type { Metadata } from "next";
import "./globals.css";

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
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {try {const key='forgeos:theme'; const mode=localStorage.getItem(key)||'dark'; const resolved=mode==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):mode; document.documentElement.dataset.theme=resolved==='light'?'light':'dark'; document.documentElement.dataset.themeMode=mode; document.documentElement.style.colorScheme=resolved==='light'?'light':'dark';} catch (_) {document.documentElement.dataset.theme='dark'; document.documentElement.dataset.themeMode='dark';}})();`
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
