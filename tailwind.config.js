import tailwindAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    screens: {
      // xs: 360px - ADICIONADO para Samsung A23 e telas muito estreitas
      xs: "360px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
      },
      colors: {
        // ✅ Design tokens para hierarquia de texto
        text: {
          primary: {
            light: "#111827", // gray-900 (modo claro)
            DEFAULT: "#111827",
            dark: "#FFFFFF", // white (modo escuro)
          },
          secondary: {
            light: "#374151", // gray-700
            DEFAULT: "#374151",
            dark: "#E5E7EB", // gray-200
          },
          tertiary: {
            light: "#6B7280", // gray-500
            DEFAULT: "#6B7280",
            dark: "#9CA3AF", // gray-400
          },
          disabled: {
            light: "#9CA3AF", // gray-400
            DEFAULT: "#9CA3AF",
            dark: "#4B5563", // gray-600
          },
        },
      },
      spacing: {
        18: "4.5rem", // 72px
        88: "22rem", // 352px
      },
    },
  },
  plugins: [tailwindAnimate],
};
