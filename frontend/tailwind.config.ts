import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-text-primary)",
        border: {
          DEFAULT: "var(--color-border)",
          strong: "var(--color-border-strong)",
        },
        input: "var(--color-border)",
        ring: "var(--color-focus-ring)",
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          pressed: "var(--color-primary-pressed)",
          foreground: "var(--color-on-primary)",
        },
        secondary: {
          DEFAULT: "var(--color-surface)",
          foreground: "var(--color-text-primary)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          raised: "var(--color-surface-raised)",
        },
        muted: {
          DEFAULT: "var(--color-surface)",
          foreground: "var(--color-text-secondary)",
        },
        card: {
          DEFAULT: "var(--color-surface-raised)",
          foreground: "var(--color-text-primary)",
        },
        destructive: {
          DEFAULT: "var(--color-error)",
          foreground: "var(--color-on-primary)",
        },
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      fontFamily: {
        heading: ["Neue Haas Grotesk Display", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        sans: ["Inter Variable", "Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        none: "none",
        sm: "0 1px 2px rgba(0, 0, 0, 0.04)",
        md: "0 8px 24px rgba(0, 0, 0, 0.08)",
        lg: "0 16px 40px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [animate],
};

export default config;
