import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: {
            DEFAULT: "#064e3b",
            hover: "#04392b",
            light: "#0b513d",
            container: "#b0f0d6",
          },
          secondary: {
            DEFAULT: "#0891b2",
            hover: "#0e7490",
            light: "#06b6d4",
            container: "#76dcff",
          },
        },
        surface: {
          DEFAULT: "#f8f9ff",
          dim: "#ccdbf4",
          bright: "#f8f9ff",
          lowest: "#ffffff",
          low: "#eff4ff",
          container: "#e6eeff",
          high: "#dde9ff",
          highest: "#d5e3fd",
          variant: "#d5e3fd",
        },
        on: {
          surface: {
            DEFAULT: "#0d1c2f",
            variant: "#404944",
          },
          primary: "#ffffff",
          secondary: "#ffffff",
        },
        slate: {
          neutral: "#334155",
        },
        status: {
          success: {
            DEFAULT: "#16a34a",
            bg: "rgba(22, 163, 74, 0.1)",
          },
          warning: {
            DEFAULT: "#d97706",
            bg: "rgba(217, 119, 6, 0.1)",
          },
          error: {
            DEFAULT: "#ba1a1a",
            bg: "rgba(186, 26, 26, 0.1)",
          },
          info: {
            DEFAULT: "#0284c7",
            bg: "rgba(2, 132, 199, 0.1)",
          },
        },
      },
      fontFamily: {
        heading: ["var(--font-plus-jakarta-sans)", "Plus Jakarta Sans", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        sm: "4px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },
      boxShadow: {
        "stitch-card": "0px 4px 12px rgba(13, 28, 47, 0.05)",
        "stitch-modal": "0px 12px 24px rgba(13, 28, 47, 0.10)",
        "stitch-inner": "inset 0 0 0 1px rgba(255, 255, 255, 0.15)",
      },
      maxWidth: {
        "stitch-container": "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
