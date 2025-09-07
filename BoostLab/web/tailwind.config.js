/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // BoostLab Dark Theme Colors
        dark: {
          primary: '#121212',    // Primary background
          secondary: '#1F1F1F',  // Secondary background
          elevated: '#2C2C2C',   // Elevated surfaces
          border: '#404040',     // Borders and dividers
        },
        text: {
          primary: '#FFFFFF',    // Primary text
          secondary: '#B0B0B0',  // Secondary text
          muted: '#808080',      // Muted text
        },
        accent: {
          neon: '#39FF14',       // Neon green
          orange: '#FF6F00',     // Electric orange
          blue: '#00BFFF',       // Turbo blue
        },
        status: {
          success: '#00FF88',
          warning: '#FFB800',
          error: '#FF4444',
          info: '#00BFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseNeon: {
          '0%, 100%': { 
            boxShadow: '0 0 5px #39FF14, 0 0 10px #39FF14, 0 0 15px #39FF14',
            opacity: '1'
          },
          '50%': { 
            boxShadow: '0 0 10px #39FF14, 0 0 20px #39FF14, 0 0 30px #39FF14',
            opacity: '0.8'
          },
        },
        glow: {
          '0%': { 
            textShadow: '0 0 5px #39FF14, 0 0 10px #39FF14, 0 0 15px #39FF14',
          },
          '100%': { 
            textShadow: '0 0 10px #39FF14, 0 0 20px #39FF14, 0 0 30px #39FF14',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'neon-gradient': 'linear-gradient(45deg, #39FF14, #00BFFF, #FF6F00)',
        'dark-gradient': 'linear-gradient(135deg, #121212 0%, #1F1F1F 50%, #2C2C2C 100%)',
      },
      boxShadow: {
        'neon': '0 0 5px #39FF14, 0 0 10px #39FF14, 0 0 15px #39FF14',
        'neon-orange': '0 0 5px #FF6F00, 0 0 10px #FF6F00, 0 0 15px #FF6F00',
        'neon-blue': '0 0 5px #00BFFF, 0 0 10px #00BFFF, 0 0 15px #00BFFF',
        'dark-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'dark-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
