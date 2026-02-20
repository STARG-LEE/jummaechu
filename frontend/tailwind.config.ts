import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // design-reference §2 Color Palette
      colors: {
        primary: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
        },
        // Light mode tokens
        light: {
          base: '#FAFAF9',
          surface: '#FFFFFF',
          muted: '#F5F5F4',
          subtle: '#FFF7ED',
          border: '#E7E5E4',
          'text-primary': '#1C1917',
          'text-secondary': '#78716C',
          'text-disabled': '#D6D3D1',
        },
        // Dark mode tokens
        dark: {
          base: '#0C0A09',
          surface: '#1C1917',
          muted: '#292524',
          subtle: '#431407',
          border: '#44403C',
          'text-primary': '#FAFAF9',
          'text-secondary': '#A8A29E',
          'text-disabled': '#57534E',
        },
        success: '#22C55E',
        error: '#EF4444',
        warning: '#F59E0B',
      },
      // design-reference §3 Typography
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Apple SD Gothic Neo', 'sans-serif'],
      },
      fontSize: {
        'display': ['28px', { lineHeight: '1.2', fontWeight: '800' }],
        'heading1': ['24px', { lineHeight: '1.3', fontWeight: '700' }],
        'heading2': ['20px', { lineHeight: '1.3', fontWeight: '700' }],
        'heading3': ['17px', { lineHeight: '1.4', fontWeight: '600' }],
        'body1': ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        'body2': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      // design-reference §4 Border Radius
      borderRadius: {
        card: '16px',
        button: '12px',
        input: '10px',
        panel: '16px',
        badge: '6px',
      },
      // design-reference §9 Breakpoints
      screens: {
        mobile: { max: '767px' },
        tablet: { min: '768px', max: '1023px' },
        desktop: { min: '1024px' },
      },
      maxWidth: {
        mobile: '390px',
        app: '480px',
        content: '1280px',
      },
    },
  },
  plugins: [],
}

export default config
