/** @type {import('next').NextConfig} */
const isGithubPages = process.env.DEPLOY_TARGET === "gh-pages";

const nextConfig = {
  output: "export",
  basePath: isGithubPages ? "/chamchi-gimbap" : "",
  assetPrefix: isGithubPages ? "/chamchi-gimbap/" : undefined,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
