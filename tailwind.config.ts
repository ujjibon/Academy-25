import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'Inter',
          'SF Pro Text',
          'system-ui',
          'sans-serif',
        ],
        body: [
          'var(--font-inter)',
          'Inter',
          'SF Pro Text',
          'system-ui',
          'sans-serif',
        ],
        headline: [
          'var(--font-inter)',
          'Inter',
          'SF Pro Display',
          'system-ui',
          'sans-serif',
        ],
        heading: [
          'var(--font-inter)',
          'Inter',
          'SF Pro Display',
          'system-ui',
          'sans-serif',
        ],
        display: [
          'var(--font-instrument)',
          'Instrument Serif',
          'Times New Roman',
          'serif',
        ],
        mono: [
          'var(--font-jetbrains)',
          'JetBrains Mono',
          'Geist Mono',
          'ui-monospace',
          'monospace',
        ],
        'dashboard-title': [
          'var(--font-manrope)',
          'Manrope',
          'Inter',
          'SF Pro Display',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        'background-elevated': 'rgb(var(--background-elevated) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        chart: {
          '1': 'rgb(var(--chart-1) / <alpha-value>)',
          '2': 'rgb(var(--chart-2) / <alpha-value>)',
          '3': 'rgb(var(--chart-3) / <alpha-value>)',
          '4': 'rgb(var(--chart-4) / <alpha-value>)',
          '5': 'rgb(var(--chart-5) / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'rgb(var(--sidebar) / <alpha-value>)',
          foreground: 'rgb(var(--sidebar-foreground) / <alpha-value>)',
          primary: 'rgb(var(--sidebar-primary) / <alpha-value>)',
          'primary-foreground':
            'rgb(var(--sidebar-primary-foreground) / <alpha-value>)',
          accent: 'rgb(var(--sidebar-accent) / <alpha-value>)',
          'accent-foreground':
            'rgb(var(--sidebar-accent-foreground) / <alpha-value>)',
          border: 'rgb(var(--sidebar-border) / <alpha-value>)',
          ring: 'rgb(var(--sidebar-ring) / <alpha-value>)',
        },
        chalk: 'rgb(var(--chalk) / <alpha-value>)',
        'chalk-soft': 'rgb(var(--chalk-soft) / <alpha-value>)',
        slate: 'rgb(var(--slate) / <alpha-value>)',
        'slate-dark': 'rgb(var(--slate-dark) / <alpha-value>)',
        midnight: 'rgb(var(--midnight) / <alpha-value>)',
        'midnight-light': 'rgb(var(--midnight-light) / <alpha-value>)',
        royal: 'rgb(var(--royal) / <alpha-value>)',
        'royal-light': 'rgb(var(--royal-light) / <alpha-value>)',
        flare: 'rgb(var(--flare) / <alpha-value>)',
        'flare-light': 'rgb(var(--flare-light) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        xl: 'calc(var(--radius) + 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {height: '0'},
          to: {height: 'var(--radix-accordion-content-height)'},
        },
        'accordion-up': {
          from: {height: 'var(--radix-accordion-content-height)'},
          to: {height: '0'},
        },
        'fade-in': {
          from: {opacity: '0'},
          to: {opacity: '1'},
        },
        'fade-in-up': {
          from: {opacity: '0', transform: 'translateY(24px)'},
          to: {opacity: '1', transform: 'translateY(0)'},
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.6s ease-out both',
        'fade-in-up': 'fade-in-up 0.7s cubic-bezier(0.21, 0.6, 0.35, 1) both',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;
