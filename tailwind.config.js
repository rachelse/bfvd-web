/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{vue,js,mjs}'],
    corePlugins: {
        // Preflight resets element defaults (headings, buttons, etc.) app-wide,
        // which would fight Vuetify's own styling everywhere, not just the
        // handful of places we actually want Tailwind utilities.
        preflight: false,
    },
    theme: {
        extend: {},
    },
    plugins: [
        require('tailwind-glassmorphism'),
    ],
}
