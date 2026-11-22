import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  /* config options here */
  output: 'standalone',
  reactCompiler: true,
  experimental: {
    useTypeScriptCli: false,
  },
} satisfies NextConfig;

export default withNextIntl(nextConfig);
