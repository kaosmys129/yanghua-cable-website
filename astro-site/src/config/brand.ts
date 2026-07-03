/**
 * ─────────────────────────────────────────────────────────────────────────────
 * BRAND CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Single file to edit when adapting the theme for a new client.
 *
 * Colors flow into  → src/styles/theme.css  (CSS custom properties)
 * Fonts flow into   → src/layouts/BaseLayout.astro (stylesheet link)
 * Meta flows into   → src/layouts/BaseLayout.astro
 *
 * Color format: use hex (#1a1a2e) or CSS color values.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const brand = {
  // ── Site Identity ──────────────────────────────────────────────────────────
  name: 'Yanghua Cable',
  tagline: 'Flexible busbar and cable solutions for modern electrification.',
  description:
    'Leading manufacturer of flexible busbars and cable solutions for industrial applications.',
  url: 'https://www.yhflexiblebusbar.com',
  locale: 'en_US',

  // ── Fonts ──────────────────────────────────────────────────────────────────
  // To swap fonts: change the `name` values here AND update BaseLayout's
  // stylesheet link to match.
  fonts: {
    body: 'Inter',
    display: 'Oswald',
  },

  // ── Colour Palette ─────────────────────────────────────────────────────────
  // These values are written to CSS custom properties in theme.css.
  // Tailwind v4 @theme picks them up automatically.
  colors: {
    primary:      '#212529',
    primaryLight: '#343a40',
    primaryFg:    '#ffffff',

    accent:       '#fdb827',
    accentFg:     '#212529',

    background:   '#ffffff',
    surface:      '#f8f9fa',
    border:       '#e9ecef',

    text:         '#212529',
    textMuted:    '#6c757d',

    dark:         '#212529',
    darkSurface:  '#343a40',
  },

  // ── Border radius ──────────────────────────────────────────────────────────
  radius: {
    sm:   '0.375rem',
    md:   '0.625rem',
    lg:   '1rem',
    full: '9999px',
  },
} as const;

export type Brand = typeof brand;
