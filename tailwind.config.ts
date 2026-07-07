import type { Config } from "tailwindcss";

// Palette carried over from the original MaysterPRO HTML prototype.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#1F4E78",
          med: "#2E75B6",
          light: "#DDEBF7",
          green: "#E2EFDA",
          orange: "#FCE4D6",
          yellow: "#FFF2CC",
          line: "#dfe6ee",
          txt: "#1f2733",
          muted: "#8a96a3",
          danger: "#d64545",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,.05)",
        header: "0 2px 8px rgba(0,0,0,.15)",
      },
    },
  },
  plugins: [],
};

export default config;
