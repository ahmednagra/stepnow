import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary palette — design-direction.md §3
        ink: "#0A0A0A", // primary dark
        cream: "#F8F6F1", // off-white background
        elevation: "#1A1A1A", // slight elevation from pure black
        // Accent (gold — Option A)
        gold: {
          DEFAULT: "#B8935A",
          light: "#C9A961",
          dark: "#9A7848",
        },
        // Neutrals
        mute: "#5A5A5A",
        line: "#D8D5CE",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Design-direction.md §4 scale
        "hero-lg": ["5rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        hero: ["4rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        section: ["3rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        sub: ["1.75rem", { lineHeight: "1.2" }],
        "body-lg": ["1.125rem", { lineHeight: "1.7" }],
        "label-sm": ["0.8125rem", { lineHeight: "1.2", letterSpacing: "0.08em" }],
      },
      spacing: {
        section: "6rem", // 96px — minimum section padding
        "section-mobile": "4rem",
      },
      maxWidth: {
        container: "80rem", // 1280px
        prose: "45rem", // 720px for body text
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
    },
  },
  plugins: [],
};

export default config;
