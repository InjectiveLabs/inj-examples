/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Injective Design System — Night Theme
      colors: {
        "inj-dark":     "#0D1B2E",   // Page background (darkest)
        "inj-midnight": "#182E4B",   // Card / surface background
        "inj-navy":     "#1E3558",   // Sub-card / elevated surface
        "inj-border":   "#2A4A6E",   // Borders
        "inj-ocean":    "#4D3DFF",   // Primary accent (blue-purple)
        "inj-snow":     "#EEEFFF",   // Primary text on dark
        "inj-muted":    "#8CA3BE",   // Secondary text
        "inj-lime":     "#CEFFC8",   // Highlight accent (use as badge/tag)
        "inj-green":    "#22C55E",   // Success (high contrast solid green)
        "inj-red":      "#EF4444",   // Error
        "inj-amber":    "#F59E0B",   // Warning
        "inj-sand":     "#D5C498",
        "inj-lemon":    "#E8FF5F",
        "inj-coral":    "#FFA36E",
        "inj-forest":   "#144E1A",
        "inj-eggplant": "#611447",
        "inj-cinnamon": "#7A4515",
        "inj-turquoise":"#026585",
      },
      fontFamily: {
        marist: ["ABC Marist", "Inter", "system-ui", "sans-serif"],
        whyte:  ["ABC Whyte",  "Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display":  ["3rem",   { lineHeight: "1.1", fontWeight: "700" }],
        "body-md":  ["1rem",   { lineHeight: "1.5", fontWeight: "400" }],
        "label-sm": ["0.75rem",{ lineHeight: "1.4", fontWeight: "400" }],
        "label-xs": ["0.65rem",{ lineHeight: "1.3", fontWeight: "400" }],
      },
      spacing: {
        "inj-sm": "8px",
        "inj-md": "16px",
        "inj-lg": "24px",
        "inj-xl": "32px",
      },
      borderRadius: {
        "inj-none": "0px",
        "inj-sm":   "4px",
        "inj-md":   "8px",
        "inj-lg":   "16px",
        "inj-full": "9999px",
      },
    },
  },
  plugins: [],
};
