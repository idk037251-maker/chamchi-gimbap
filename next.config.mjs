/** @type {import('next').NextConfig} */
const isGithubPages = process.env.DEPLOY_TARGET === "gh-pages";

const nextConfig = {
  output: "export",
  basePath: isGithubPages ? "/kakaocord-live" : "",
  assetPrefix: isGithubPages ? "/kakaocord-live/" : undefined,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
};

export default nextConfig;
