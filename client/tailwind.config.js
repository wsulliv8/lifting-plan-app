/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        light: {
          primary: {
            50: "#EFF6FF",
            100: "#DBEAFE",
            200: "#BFDBFE",
            300: "#93C5FD",
            400: "#60A5FA",
            500: "#3B82F6",
            600: "#2563EB",
            700: "#1E3A8A",
            800: "#1E40AF",
            900: "#1E3A8A",
          },
          secondary: {
            50: "#F0F9FF",
            100: "#E0F2FE",
            200: "#BAE6FD",
            300: "#7DD3FC",
            400: "#38BDF8",
            500: "#3B82F6",
            600: "#0284C7",
            700: "#0369A1",
            800: "#075985",
            900: "#0C4A6E",
          },
          accent: {
            50: "#FFFBEB",
            100: "#FEF3C7",
            200: "#FDE68A",
            300: "#FCD34D",
            400: "#FBBF24",
            500: "#F59E0B",
            600: "#D97706",
            700: "#B45309",
            800: "#92400E",
            900: "#78350F",
          },
          danger: {
            50: "#FEF2F2",
            100: "#FEE2E2",
            200: "#FECACA",
            300: "#FCA5A5",
            400: "#F87171",
            500: "#EF4444",
            600: "#DC2626",
            700: "#B91C1C",
            800: "#991B1B",
            900: "#7F1D1D",
          },
          background: {
            50: "#FFFFFF",
            100: "#F9FAFB",
            200: "#F3F4F6",
            300: "#E5E7EB",
            400: "#D1D5DB",
          },
          text: {
            primary: {
              50: "#F9FAFB",
              100: "#E5E7EB",
              200: "#D1D5DB",
              300: "#9CA3AF",
              400: "#6B7280",
              500: "#111827",
            },
            secondary: {
              50: "#F3F4F6",
              100: "#D1D5DB",
              200: "#9CA3AF",
              300: "#6B7280",
              400: "#4B5563",
            },
          },
        },
        dark: {
          primary: {
            50: "#EFF6FF",
            100: "#DBEAFE",
            200: "#BFDBFE",
            300: "#93C5FD",
            400: "#60A5FA",
            500: "#1E40AF",
            600: "#1E3A8A",
            700: "#1E3A8A",
            800: "#1E3A8A",
            900: "#1E3A8A",
          },
          secondary: {
            50: "#F0F9FF",
            100: "#E0F2FE",
            200: "#BAE6FD",
            300: "#7DD3FC",
            400: "#60A5FA",
            500: "#38BDF8",
            600: "#0284C7",
            700: "#0369A1",
            800: "#075985",
            900: "#0C4A6E",
          },
          accent: {
            50: "#FFFBEB",
            100: "#FEF3C7",
            200: "#FDE68A",
            300: "#FCD34D",
            400: "#FBBF24",
            500: "#F59E0B",
            600: "#D97706",
            700: "#B45309",
            800: "#92400E",
            900: "#78350F",
          },
          danger: {
            50: "#FEF2F2",
            100: "#FEE2E2",
            200: "#FECACA",
            300: "#FCA5A5",
            400: "#F87171",
            500: "#EF4444",
            600: "#DC2626",
            700: "#B91C1C",
            800: "#991B1B",
            900: "#7F1D1D",
          },
          background: {
            50: "#4B5563",
            100: "#374151",
            200: "#1F2937",
            300: "#111827",
            400: "#0D1219",
          },
          text: {
            primary: {
              50: "#FFFFFF",
              100: "#F3F4F6",
              200: "#E5E7EB",
              300: "#D1D5DB",
              400: "#9CA3AF",
            },
            secondary: {
              50: "#F3F4F6",
              100: "#D1D5DB",
              200: "#9CA3AF",
              300: "#6B7280",
              400: "#4B5563",
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
