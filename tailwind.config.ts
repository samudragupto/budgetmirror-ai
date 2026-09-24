import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B1F33",
          950: "#060F1D",
          900: "#0B1F33",
          800: "#12293F",
          700: "#1B3A55",
        },
        paper: {
          DEFAULT: "#F4EFE6",
          50: "#FAF7F0",
          100: "#F4EFE6",
          200: "#E9E1D2",
          300: "#D8CDB4",
        },
        signal: {
          DEFAULT: "#0F766E",
          50: "#EFFAF7",
          100: "#D7F0EA",
          600: "#0F766E",
          700: "#0D635D",
          900: "#134E4A",
        },
        coral: {
          DEFAULT: "#C45C26",
          50: "#FBF1E8",
          100: "#F5DFC9",
          600: "#C45C26",
          700: "#A34B1F",
        },
        gold: {
          DEFAULT: "#B98A2F",
          light: "#D9B36A",
        },
        slateink: "#334155",
      },
      fontFamily: {
        serif: ['"Newsreader"', '"Source Serif 4"', "Georgia", "serif"],
        sans: ['"IBM Plex Sans"', '"Geist"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        ledger: "0 1px 0 0 rgba(11, 31, 51, 0.12), 0 12px 32px -16px rgba(11, 31, 51, 0.25)",
        card: "0 1px 2px rgba(11, 31, 51, 0.08), 0 8px 24px -12px rgba(11, 31, 51, 0.18)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 200ms ease-out both",
        "fade-in": "fade-in 180ms ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
