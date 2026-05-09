import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "Hiragino Sans",
          "Hiragino Kaku Gothic ProN",
          "Noto Sans JP",
          "system-ui",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 和モダンカラーパレット
        ai: {
          50: "#eef4ff",
          100: "#dae6ff",
          200: "#bdd2ff",
          300: "#90b3ff",
          400: "#5e89ff",
          500: "#3a64ff", // 藍
          600: "#274af0",
          700: "#1f3ad6",
          800: "#1f31ad",
          900: "#1f2f87",
        },
        akane: {
          50: "#fff1f1",
          100: "#ffe0e0",
          200: "#ffc6c6",
          300: "#ff9f9f",
          400: "#ff6868",
          500: "#f93b3b",
          600: "#e51d1d", // 茜
          700: "#c11414",
          800: "#a01515",
          900: "#841717",
        },
        wakaba: {
          50: "#f1fbf2",
          100: "#defae0",
          200: "#bff4c4",
          300: "#8ee99a",
          400: "#52d364", // 若草
          500: "#28b53d",
          600: "#1c952e",
          700: "#1a7628",
          800: "#185d24",
          900: "#164d20",
        },
        sumi: {
          50: "#f5f6f7",
          100: "#e6e8ea",
          200: "#cdd0d3",
          300: "#a7adb3",
          400: "#7c848d",
          500: "#5e6770",
          600: "#4a5158",
          700: "#3e4348",
          800: "#34383d",
          900: "#1c1f23", // 墨
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFeatureSettings: {
        tnum: '"tnum"',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.18s ease-out",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
