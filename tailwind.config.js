const { nextui } = require('@nextui-org/react');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // prefix: 'raa-',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx,html}',
    // make sure it's pointing to the ROOT node_module
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [nextui()],
};
