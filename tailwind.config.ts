import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tea: {
          50: "#f3f8f4",
          100: "#e3efe5",
          200: "#c7dfcd",
          300: "#9ec5a8",
          400: "#6fa47e",
          500: "#4d875d",
          600: "#3b6d49",
          700: "#30573b",
          800: "#294632",
          900: "#223b2b",
          950: "#0f2016",
        },
        kenya: {
          red: "#990000",
          green: "#006600",
          black: "#111111",
        }
      },
    },
  },
  plugins: [],
};
export default config;
