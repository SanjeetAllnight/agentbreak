/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agentbreak: {
          dark: '#0f172a',    // slate-900
          darker: '#020617',  // slate-950
          panel: '#1e293b',   // slate-800
          primary: '#3b82f6', // blue-500
          s0: '#10b981',      // emerald-500
          s1: '#3b82f6',      // blue-500
          s2: '#eab308',      // yellow-500
          s3: '#f97316',      // orange-500
          s4: '#ef4444',      // red-500
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -5px rgba(59, 130, 246, 0.5)',
        'glow-s0': '0 0 20px -5px rgba(16, 185, 129, 0.5)',
        'glow-s1': '0 0 20px -5px rgba(59, 130, 246, 0.5)',
        'glow-s2': '0 0 20px -5px rgba(234, 179, 8, 0.5)',
        'glow-s3': '0 0 20px -5px rgba(249, 115, 22, 0.5)',
        'glow-s4': '0 0 20px -5px rgba(239, 68, 68, 0.5)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '.7', filter: 'brightness(1.2)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
