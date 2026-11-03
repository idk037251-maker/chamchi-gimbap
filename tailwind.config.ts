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
        mandarin: {
          50: "#fdfbf7",
          100: "#fbf6ec",
          200: "#f6eccf",
          300: "#f0dba5",
          400: "#e9c372",
          500: "#f5c842",
          600: "#e5b834",
          700: "#bf9320",
          800: "#98721c",
          900: "#7c5c1b",
          darkText: "#1e1b13",
        },
        slateTheme: {
          bg: "#1e1f22",
          sidebar: "#2b2d31",
          chat: "#313338",
          hover: "#35373c",
          input: "#383a40",
          accent: "#4f46e5",
          accentHover: "#4338ca",
          green: "#23a55a",
          red: "#da373c",
        },
      },
    },
  },
  plugins: [],
};
export default config;
