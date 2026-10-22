import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Loads i18n/request.ts (P7-04)
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default withNextIntl(nextConfig);
