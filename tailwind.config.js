const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{js,jsx,ts,tsx}'],
	theme: {
		extend: {
			fontFamily: {
				cal: ['var(--font-cal)', ...defaultTheme.fontFamily.sans],
			},
			fontSize: {
				xss: '11px',
				smm: '13px',
			},
			animation: {
				blink: 'blink 1.4s ease-in-out infinite both',
			},
			keyframes: {
				blink: {
					'0%, 100%': {opacity: '0.2'},
					'20%': {opacity: '1'},
				},
			},
		},
	},
	corePlugins: {
		preflight: true,
	},
}
