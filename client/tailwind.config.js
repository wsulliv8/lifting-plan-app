/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6", // Matches bg-blue-500
        secondary: "#6B7280", // Matches text-gray-500
        background: "#F3F4F6", // Matches bg-gray-100
        error: "#EF4444", // Matches text-red-500
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
    },
  },
  plugins: [],
};
