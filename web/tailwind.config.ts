import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        heebo: ["var(--font-heebo)", "system-ui", "sans-serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        bg: {
          DEFAULT: "#0b0d10",
          raised: "#13161b",
          muted: "#1a1e25",
        },
        border: {
          DEFAULT: "#262b33",
        },
        fg: {
          DEFAULT: "#e6e8ec",
          muted: "#9aa3ad",
          subtle: "#697079",
        },
        accent: {
          DEFAULT: "#5b8cff",
          strong: "#7aa3ff",
        },
        success: "#26d07c",
        danger: "#ff5d5d",
      },
    },
  },
  plugins: [],
};

export default config;
