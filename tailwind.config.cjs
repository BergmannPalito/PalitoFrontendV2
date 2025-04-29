/** @type {import('tailwindcss').Config} */

import defaultTheme from 'tailwindcss/defaultTheme';


module.exports = {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
      extend: {
        colors: {
          emerald: { DEFAULT: '#09BC8A' },   // brand colour
        },
        fontFamily: {
          sans: ['Inter', ...defaultTheme.fontFamily.sans],
        },
      },
      },
    plugins: [],
};
