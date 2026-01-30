/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#3b82f6',
                    light: '#60a5fa',
                    dark: '#1d4ed8',
                },
                secondary: {
                    DEFAULT: '#10b981',
                    light: '#34d399',
                    dark: '#059669',
                },
                accent: {
                    DEFAULT: '#f59e0b',
                    light: '#fbbf24',
                    dark: '#d97706',
                },
                'bg-deep': '#050b18',
                'text-main': '#f8fafc',
                'text-muted': '#94a3b8',
            },
            fontFamily: {
                main: ['Plus Jakarta Sans', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
