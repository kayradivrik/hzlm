/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif', 'Georgia', 'serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        'app-bg': 'var(--bg-color)',
        'app-card': 'var(--card-bg)',
        'app-border': 'var(--card-border)',
        'app-accent': 'var(--accent-color)',
        'app-text': 'var(--text-primary)',
        'app-muted': 'var(--text-muted)',
      },
      boxShadow: {
        'glass': 'var(--nav-shadow)',
        'glow': '0 0 20px var(--accent-glow)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
