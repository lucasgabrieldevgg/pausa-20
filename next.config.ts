import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CRA: raiz pinada — lockfile solto no diretório-pai fazia o Next inferir
  // a workspace errada e quebrar a resolução das fontes do next/font.
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
