/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bdoBlue: "#003087",
        bdoDarkBlue: "#001F5A",
        bdoRed: "#CC0000",
        bdoBg: "#F4F6F9",
        bdoText: "#1A1A2E",
        bdoBorder: "#DDE2EA",
      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
}
