// apps/frontend/tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base palette — refined for premium feel.
        ink: "#000000", // pure black for hero backgrounds.
        charcoal: "#0F1115", // slightly lifted from ink for nested surfaces.
        elevation: "#1A1A1A", // kept for backwards compat.
        cream: "#F5F2EC", // warm off-white.
        paper: "#FAFAF7", // lighter alternate for nested light surfaces.

        gold: {
          DEFAULT: "#A8865A",
          light: "#C2A675",
          dark: "#86683F",
          deep: "#6E5430", // AA-safe on cream for body text (audit C-5)
        },

        // Neutrals.
        mute: "#5A5A5A",
        "mute-soft": "#7A7A7A",
        "mute-strong": "#3A3A3A",
        line: "#D8D5CE",
        "line-soft": "#E5E2DB",
        "line-strong": "#C8C5BE",

        // Status (used sparingly — only forms + admin badges).
        danger: "#9A2A2A",
        success: "#2F7A4B",
        warn: "#B5651D",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Display scale.
        "display-xl": ["6.5rem", { lineHeight: "0.95", letterSpacing: "-0.035em" }],
        "display-lg": ["5rem", { lineHeight: "1.0", letterSpacing: "-0.03em" }],
        "display-md": ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }],

        "hero-lg": ["5rem", { lineHeight: "1.0", letterSpacing: "-0.03em" }],
        hero: ["4rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        section: ["3rem", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        sub: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "body-lg": ["1.1875rem", { lineHeight: "1.65" }],
        body: ["1rem", { lineHeight: "1.7" }],
        "label-sm": ["0.75rem", { lineHeight: "1.2", letterSpacing: "0.16em" }],
      },
      spacing: {
        section: "8rem",
        "section-mobile": "5rem",
        "section-lg": "10rem",
      },
      maxWidth: {
        container: "82rem",
        prose: "44rem",
        narrow: "36rem",
      },
      borderRadius: {
        pill: "9999px",
      },
      boxShadow: {
        // Premium, restrained — calibrated against a cream background.
        "premium-sm": "0 1px 2px 0 rgba(10, 10, 10, 0.04)",
        premium:
          "0 2px 4px -1px rgba(10, 10, 10, 0.04), 0 4px 12px -2px rgba(10, 10, 10, 0.06)",
        "premium-md":
          "0 4px 8px -2px rgba(10, 10, 10, 0.05), 0 8px 24px -4px rgba(10, 10, 10, 0.08)",
        "premium-lg":
          "0 8px 16px -4px rgba(10, 10, 10, 0.06), 0 16px 40px -8px rgba(10, 10, 10, 0.10)",
        // Dark-surface variant (hero CTA).
        "premium-dark":
          "0 2px 6px -1px rgba(0, 0, 0, 0.35), 0 8px 24px -4px rgba(0, 0, 0, 0.45)",
        // Inner ring used as hover treatment on cards instead of bg shift.
        "ring-ink": "inset 0 0 0 1px rgba(0, 0, 0, 0.10)",
        "ring-gold": "inset 0 0 0 1px rgba(168, 134, 90, 0.30)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "250ms",
        slow: "400ms",
        slower: "600ms",
      },
      transitionTimingFunction: {
        "ease-premium": "cubic-bezier(0.32, 0.72, 0, 1)",
        "ease-out-premium": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "fade-up": "fadeUp 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-up-slow":
          "fadeUp 900ms cubic-bezier(0.16, 1, 0.3, 1) both",
        // Restrained shake — used on form error (audit §11.3).
        nudge: "nudge 220ms cubic-bezier(0.32, 0.72, 0, 1) 1",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        nudge: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-3px)" },
          "75%": { transform: "translateX(3px)" },
        },
      },
      letterSpacing: {
        wordmark: "0.22em",
        "label-wide": "0.18em",
        "label-wider": "0.22em",
      },
    },
  },
  plugins: [],
};

export default config;
