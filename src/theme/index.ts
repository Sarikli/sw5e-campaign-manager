/** Original dark sci-fi palette: navy/charcoal surfaces, restrained cyan + amber accents. */
export const colors = {
  background: '#0B1018',
  surface: '#131B27',
  surfaceRaised: '#1B2536',
  border: '#2A3648',
  metal: '#8A97AB',
  text: '#E6ECF5',
  textMuted: '#93A0B5',
  cyan: '#3CC8E0',
  amber: '#E5A93C',
  danger: '#E0605A',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 6, md: 12, lg: 18 } as const;
export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
};
/** Minimum touch target (points). */
export const TOUCH_TARGET = 48;
