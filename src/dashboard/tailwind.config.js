/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ph: {
          bg: "#101014",
          surface: "#15151a",
          raised: "#1a1a24",
          border: "#222228",
          borderSubtle: "#1c1c24",
          topbar: "#13131a",
          chartBar: "#222230",
          "text-primary": "#e8e8ec",
          "text-secondary": "#888890",
          "text-tertiary": "#55555e",
          "text-muted": "#44444e",
          "text-ghost": "#3a3a44",
          accent: "#6C3AED",
          "accent-light": "#A78BFA",
          "accent-bg": "rgba(108, 58, 237, 0.08)",
          "accent-border": "rgba(108, 58, 237, 0.19)",
          shield: { text: "#34D399", bg: "#0d2818", border: "#134e2a" },
          brain: { text: "#A78BFA", bg: "#1a1040", border: "#2d1b69" },
          sword: { text: "#F87171", bg: "#2a0f0f", border: "#5c1a1a" },
          autopilot: { text: "#60A5FA", bg: "#1a2332", border: "#1e3a5f" },
          success: "#34D399",
          warning: "#FBBF24",
          danger: "#F87171",
          info: "#60A5FA",
        },
      },
      fontFamily: {
        sans: [
          '"IBM Plex Sans"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease both",
        "slide-in": "slideIn 0.4s ease both",
      },
    },
  },
  plugins: [],
};
