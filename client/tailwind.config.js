/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
      light: {
        primary: {
          50: "#EBF4FF",
          100: "#C3DAFE",
          200: "#A3BFFA",
          300: "#7F9CF5",
          400: "#667EEA",
          500: "#5A67D8",
          600: "#4C51BF",
          700: "#434190",
          800: "#37306B",
          900: "#2D2A56",
        },
        secondary: {
          50: "#F3E8FF",
          100: "#E2D1FE",
          200: "#C4B5FD",
          300: "#A78BFA",
          400: "#8B5CF6",
          500: "#7C3AED",
          600: "#6D28D9",
          700: "#5B21B6",
          800: "#4C1D95",
          900: "#3C1970",
        },
        accent: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
        danger: {
          50: "#FFF0F3",
          100: "#FFE0E7",
          200: "#FFC1CC",
          300: "#FF99A9",
          400: "#FF6A82",
          500: "#F43F5E",
          600: "#E11D48",
          700: "#C2042D",
          800: "#A3001F",
          900: "#7E001A",
        },

        background: {
          50: "#FAF9F6",
          100: "#F0EFEB",
          200: "#E6E5E1",
          300: "#D9D8D4",
          400: "#B0AFA8",
        },
        text: {
          primary: {
            50: "#FAF9F6",
            100: "#E6E5E1",
            200: "#D9D8D4",
            300: "#A3A29E",
            400: "#787774",
            500: "#2F2E2B",
          },
          secondary: {
            50: "#F0EFEB",
            100: "#D9D8D4",
            200: "#A3A29E",
            300: "#787774",
            400: "#4F4E4B",
          },
        },
      },
      dark: {
        primary: {
          50: "#C3DAFE",
          100: "#A3BFFA",
          200: "#7F9CF5",
          300: "#667EEA",
          400: "#5A67D8",
          500: "#4C51BF",
          600: "#434190",
          700: "#37306B",
          800: "#2D2A56",
          900: "#232043",
        },
        secondary: {
          50: "#E2D1FE",
          100: "#C4B5FD",
          200: "#A78BFA",
          300: "#8B5CF6",
          400: "#7C3AED",
          500: "#6D28D9",
          600: "#5B21B6",
          700: "#4C1D95",
          800: "#3C1970",
          900: "#2F1557",
        },
        accent: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
        danger: {
          50: "#FFF0F3",
          100: "#FFE0E7",
          200: "#FFC1CC",
          300: "#FF99A9",
          400: "#FF6A82",
          500: "#F43F5E",
          600: "#E11D48",
          700: "#C2042D",
          800: "#A3001F",
          900: "#7E001A",
        },
        background: {
          50: "#4A5568",
          100: "#2D3748",
          200: "#1A202C",
          300: "#171923",
          400: "#0F121A",
        },
        text: {
          primary: {
            50: "#F7FAFC",
            100: "#E2E8F0",
            200: "#CBD5E0",
            300: "#A0AEC0",
            400: "#718096",
          },
          secondary: {
            50: "#CBD5E0",
            100: "#A0AEC0",
            200: "#718096",
            300: "#4A5568",
            400: "#2D3748",
          },
        },
      },
    },
      spacing: {
        form: "1.5rem", // For form padding (p-6)
        card: "1rem", // For card padding (p-4)
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
      },
      writingMode: {
        "vertical-lr": "vertical-lr",
        "vertical-rl": "vertical-rl",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".writing-vertical-lr": {
          writingMode: "vertical-lr",
        },
        ".writing-vertical-rl": {
          writingMode: "vertical-rl",
        },
      });
    },
  ],
};
