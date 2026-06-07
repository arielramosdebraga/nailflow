/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#EC4899',
        secondary: '#A855F7',
        accent: '#F59E0B',
        success: '#10B981',
        error: '#EF4444',
        muted: '#6B7280',
      },
    },
  },
  plugins: [],
};
