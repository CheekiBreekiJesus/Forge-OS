import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@forgeos/ui", "@forgeos/i18n", "@forgeos/shared"],
};

export default withNextIntl(nextConfig);
