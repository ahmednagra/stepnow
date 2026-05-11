import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base palette — refined for premium feel
        ink: "#000000", // pure black for hero backgrounds (was #0A0A0A)
        charcoal: "#0F1115", // slightly lifted from ink for nested surfaces
        elevation: "#1A1A1A", // existing — kept for backwards compat
        cream: "#F5F2EC", // very slightly warmer + deeper (was #F8F6F1)
        paper: "#FAFAF7", // lighter alternate for nested light surfaces

        // Accent — desaturated and shifted slightly cooler
        gold: {
          DEFAULT: "#A8865A", // was #B8935A — desaturated
          light: "#C2A675",
          dark: "#86683F",
        },

        // Neutrals
        mute: "#5A5A5A",
        "mute-soft": "#7A7A7A", // for less-emphasized supporting text
        line: "#D8D5CE",
        "line-soft": "#E5E2DB",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        // Display scale — tightened and bumped up for premium hierarchy
        "display-xl": ["6.5rem", { lineHeight: "0.95", letterSpacing: "-0.035em" }],
        "display-lg": ["5rem", { lineHeight: "1.0", letterSpacing: "-0.03em" }],
        "display-md": ["3.75rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }],

        // Existing scale — kept; some retuned
        "hero-lg": ["5rem", { lineHeight: "1.0", letterSpacing: "-0.03em" }],
        hero: ["4rem", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        section: ["3rem", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        sub: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "body-lg": ["1.1875rem", { lineHeight: "1.65" }], // 19px
        body: ["1rem", { lineHeight: "1.7" }],
        "label-sm": ["0.75rem", { lineHeight: "1.2", letterSpacing: "0.16em" }], // tighter, more spaced
      },
      spacing: {
        // Larger section padding for premium feel
        section: "8rem", // 128px (was 96px)
        "section-mobile": "5rem",
        "section-lg": "10rem",
      },
      maxWidth: {
        container: "82rem", // 1312px (slightly wider for premium feel)
        prose: "44rem", // 704px
        narrow: "36rem",
      },
      transitionDuration: {
        fast: "150ms",
        base: "250ms", // slowed slightly (was 200ms) — feels more deliberate
        slow: "400ms",
        slower: "600ms",
      },
      transitionTimingFunction: {
        // Premium ease curves
        "ease-premium": "cubic-bezier(0.32, 0.72, 0, 1)",
        "ease-out-premium": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      animation: {
        "fade-up": "fadeUp 700ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fadeIn 500ms cubic-bezier(0.16, 1, 0.3, 1) both",
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
      },
      letterSpacing: {
        wordmark: "0.22em", // for all-caps Inter wordmark
        "label-wide": "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
