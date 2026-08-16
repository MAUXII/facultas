import path from "node:path";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";

const requestConfig = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "src/i18n/request.ts"
);

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["next-intl"],
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "next-intl/config": requestConfig,
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/rooms", destination: "/communities", permanent: true },
      { source: "/rooms/:id", destination: "/communities/:id", permanent: true },
      { source: "/criar", destination: "/create", permanent: true },
      { source: "/descobrir", destination: "/discover", permanent: true },
      { source: "/calendario", destination: "/calendar", permanent: true },
      { source: "/perfil", destination: "/profile", permanent: true },
      { source: "/auth/cadastro", destination: "/auth/signup", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
