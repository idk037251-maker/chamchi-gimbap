import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: "#1e1f22",
          sidebar: "#2b2d31",
          chat: "#313338",
          hover: "#35373c",
          input: "#383a40",
          blurple: "#5865F2",
          blurpleHover: "#4752C4",
          green: "#23a55a",
          red: "#da373c",
        },
        kakao: {
          yellow: "#FEE500",
          yellowHover: "#FADA0A",
          brown: "#3C1E1E",
          sky: "#B2C7DA",
        },
      },
    },
  },
  plugins: [],
};
export default config;
