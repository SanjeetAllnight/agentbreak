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
      }
    },
  },
  plugins: [],
}
