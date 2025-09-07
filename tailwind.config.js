/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-green': '#39ff14',
        'dark-bg': '#1a1a1a',
        'darker-bg': '#0f0f0f',
        'message-sent': '#2a2a2a',
        'message-received': '#1a1a1a',
        'sidebar-bg': '#111111',
        'chat-bg': '#000000',
        'input-bg': '#1f1f1f',
        'border-dark': '#333333',
        'text-primary': '#ffffff',
        'text-secondary': '#b3b3b3',
        'text-muted': '#666666',
        'online': '#39ff14',
        'offline': '#666666'
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing': 'typing 1.4s infinite ease-in-out',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 5px #39ff14, 0 0 10px #39ff14, 0 0 15px #39ff14'
          },
          '50%': {
            opacity: '.8',
            boxShadow: '0 0 2px #39ff14, 0 0 5px #39ff14, 0 0 8px #39ff14'
          }
        },
        'typing': {
          '0%, 60%, 100%': {
            transform: 'translateY(0)'
          },
          '30%': {
            transform: 'translateY(-10px)'
          }
        }
      }
    },
  },
  plugins: [],
}

