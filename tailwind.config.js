/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0A0A',
          surface: '#141414',
          card: '#1A1A1A',
          elevated: '#222222',
        },
        primary: {
          DEFAULT: '#00D67E',
          hover: '#00BF6F',
          muted: 'rgba(0, 214, 126, 0.12)',
        },
        cta: {
          DEFAULT: '#F59E0B',
          hover: '#D97706',
        },
        smart: {
          DEFAULT: '#EC4899',
          hover: '#DB2777',
        },
        border: {
          DEFAULT: '#2A2A2A',
          subtle: '#1F1F1F',
        },
        text: {
          DEFAULT: '#F5F5F5',
          muted: '#A1A1AA',
          dim: '#71717A',
        },
        danger: '#EF4444',
        success: '#10B981',
      },
      fontFamily: {
        sans: ['Heebo', 'Rubik', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-slow': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-rtl')],
};
