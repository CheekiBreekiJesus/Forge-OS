import type { ReactNode } from "react";

export function generateStaticParams() {
  return [{ locale: "pt-PT" }, { locale: "en" }];
}

export default function QuotationsLayout({ children }: { children: ReactNode }) {
  return children;
}
