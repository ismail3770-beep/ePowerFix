/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  // NOTE: nativewind v2 uses 'nativewind/preset' but it's not always resolvable
  // in monorepo setups. If you hit "Cannot find module 'nativewind/preset'",
  // remove the presets line entirely — NativeWind still works without it
  // because the babel plugin handles the className → style conversion.
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        dark: {
          DEFAULT: '#0f172a',
          50: '#f8fafc',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
