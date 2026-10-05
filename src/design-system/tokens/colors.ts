// Primitive Palette
export const primitives = {
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },
  primary: {
    50: '#FFF8F6',
    100: '#FFF0EC',
    200: '#FFDCD4',
    300: '#FFA793',
    400: '#FF7657',
    500: '#FF5430', // Brand Orange
    600: '#ED6140',
    700: '#C73818',
    800: '#9B2A12',
    900: '#752210',
  },
  success: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  danger: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },
  info: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
  },
  indigo: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
  }
};

// Semantic Tokens (Light Theme default)
export const semanticColors = {
  // Backgrounds
  bgCanvas: primitives.neutral[50],
  bgSurface: '#FFFFFF',
  bgSubtle: primitives.neutral[100],
  bgHover: primitives.neutral[100],
  bgActive: primitives.neutral[200],

  // Text
  textPrimary: primitives.neutral[900],
  textSecondary: primitives.neutral[600],
  textMuted: primitives.neutral[400],
  textInverse: '#FFFFFF',

  // Borders
  borderDefault: primitives.neutral[200],
  borderSubtle: primitives.neutral[100],
  borderStrong: primitives.neutral[300],
  borderFocus: primitives.primary[500],

  // Brand / Action Primary
  actionPrimaryBg: primitives.primary[500],
  actionPrimaryHover: primitives.primary[600],
  actionPrimaryActive: primitives.primary[700],
  actionPrimaryText: '#FFFFFF',
  actionPrimarySubtleBg: primitives.primary[100],
  actionPrimarySubtleText: primitives.primary[600],

  // Action Danger
  actionDangerBg: primitives.danger[600],
  actionDangerHover: primitives.danger[700],
  actionDangerText: '#FFFFFF',
  actionDangerSubtleBg: primitives.danger[50],
  actionDangerSubtleText: primitives.danger[700],

  // Feedback / Status
  statusSuccessBg: primitives.success[50],
  statusSuccessText: primitives.success[700],
  statusSuccessBorder: primitives.success[200],

  statusWarningBg: primitives.warning[50],
  statusWarningText: primitives.warning[700],
  statusWarningBorder: primitives.warning[200],

  statusDangerBg: primitives.danger[50],
  statusDangerText: primitives.danger[700],
  statusDangerBorder: primitives.danger[200],

  statusInfoBg: primitives.info[50],
  statusInfoText: primitives.info[700],
  statusInfoBorder: primitives.info[200],
};
