import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        reactor: {
          bg: "#090B10",
          card: "#11151D",
          cardElevated: "#151B25",
          primary: "#61E8FF",
          secondary: "#8CF7FF",
          accent: "#DDFEFF",
          danger: "#FF4D5A",
          success: "#4AFFB4",
          muted: "#7F91A7",
          warning: "#FFD166",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        bloom: "0 0 35px rgba(97, 232, 255, 0.22), 0 0 80px rgba(97, 232, 255, 0.12)",
        "bloom-strong": "0 0 50px rgba(97, 232, 255, 0.36), 0 0 120px rgba(140, 247, 255, 0.2)",
        danger: "0 0 35px rgba(255, 77, 90, 0.24)",
      },
      backgroundImage: {
        "reactor-radial":
          "radial-gradient(circle at 50% 0%, rgba(97,232,255,0.16), transparent 36%), radial-gradient(circle at 80% 20%, rgba(221,254,255,0.08), transparent 24%)",
        "panel-sheen":
          "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02) 35%, rgba(97,232,255,0.08))",
        "scan-grid":
          "linear-gradient(rgba(97,232,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(97,232,255,0.045) 1px, transparent 1px)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 50%" },
          "100%": { backgroundPosition: "-200% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -8px, 0)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        shimmer: "shimmer 8s linear infinite",
        float: "float 7s ease-in-out infinite",
        scan: "scan 5s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
