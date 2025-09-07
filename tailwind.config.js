/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ClassConnect Bright School Theme
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#4FC3F7', // Sky Blue - primary
          600: '#29b6f6',
          700: '#0288d1',
          800: '#0277bd',
          900: '#01579b',
        },
        accent: {
          yellow: '#FFEB3B', // Sunshine Yellow
          green: '#8BC34A',  // Grass Green
          orange: '#FF7043', // Coral Orange
        },
        neutral: {
          light: '#F5F5F5',  // Light Grey
          white: '#FFFFFF',   // White
          dark: '#263238',    // Chalkboard Dark
          text: '#333333',    // Dark Grey text
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Nunito', 'Roboto', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-gentle': 'bounce 2s infinite',
        'pulse-soft': 'pulse 3s infinite',
      }
    },
  },
  plugins: [],
}
