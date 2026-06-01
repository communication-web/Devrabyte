/**
 * House of Jade mobile design tokens.
 * Powered by Devrabyte — the web dashboard uses the same brand.
 */

export const Colors = {
  // House of Jade brand
  brand: {
    deep:   '#1A0533',   // deep purple — primary backgrounds
    mid:    '#6D28D9',   // vibrant purple — buttons, accents
    light:  '#A855F7',   // light purple — highlights
    pale:   '#F3E8FF',   // lavender tint — card backgrounds
    tint:   '#EDE9FE',   // softer tint — alternate rows
    gold:   '#C9A84C',   // luxury gold — labels, highlights
  },
  // Semantic
  text: {
    primary:   '#0F0A1A',
    secondary: '#2D2640',
    muted:     '#6B7280',
    inverse:   '#FFFFFF',
    gold:      '#C9A84C',
  },
  bg: {
    base:    '#FFFFFF',
    surface: '#FDFBFF',
    card:    '#FAF8FF',
    input:   '#F5F0FF',
  },
  border:  '#E5E7EB',
  borderAccent: '#A855F7',
  // Status
  success: '#059669',
  warning: '#D97706',
  danger:  '#DC2626',
  info:    '#2563EB',
  // Status backgrounds (light)
  successBg: '#ECFDF5',
  warningBg: '#FFFBEB',
  dangerBg:  '#FEF2F2',
  infoBg:    '#EFF6FF',
};

export const Typography = {
  display: 'Georgia',   // serif for headings
  body:    'System',    // system font for body
  mono:    'monospace',
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Radius = {
  sm:   6,
  md:   10,
  lg:   16,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#1A0533',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A0533',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
};

// Priority → colour mapping (same as web)
export function priorityColor(p: string) {
  if (p === 'URGENT') return Colors.danger;
  if (p === 'HIGH')   return Colors.warning;
  if (p === 'MEDIUM') return Colors.info;
  return Colors.text.muted;
}

// Status → badge colour
export function statusColor(s: string): { bg: string; text: string } {
  if (s === 'DONE')        return { bg: Colors.successBg, text: Colors.success };
  if (s === 'BLOCKED')     return { bg: Colors.warningBg, text: Colors.warning };
  if (s === 'IN_PROGRESS') return { bg: Colors.infoBg,    text: Colors.info };
  if (s === 'CANCELED')    return { bg: Colors.bg.input,  text: Colors.text.muted };
  return { bg: Colors.bg.surface, text: Colors.text.secondary };
}

export function severityColor(s: string): { bg: string; text: string } {
  if (s === 'CRITICAL') return { bg: Colors.dangerBg,  text: Colors.danger };
  if (s === 'WARNING')  return { bg: Colors.warningBg, text: Colors.warning };
  return { bg: Colors.infoBg, text: Colors.info };
}
