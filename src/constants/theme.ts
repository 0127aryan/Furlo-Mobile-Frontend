import { Platform } from 'react-native';

/** Live Furlo-Frontend tokens */
export const palette = {
  amber: '#E8843A',
  forest: '#2D4A3E',
  cream: '#fef9f3',
  creamWarm: '#f8f1e8',
  card: '#fef9f3',
  charcoal: '#1c2329',
  ink: '#1d1b18',
  muted: '#554338',
  mutedGreen: '#476558',
  faded: '#887366',
  border: '#dbc1b3',
  brown: '#974900',
  tabTrack: '#f8f3ed',
  darkBg: '#1C2329',
  darkCard: '#242B33',
} as const;

export const Colors = {
  light: {
    text: palette.charcoal,
    background: palette.cream,
    backgroundElement: palette.card,
    backgroundSelected: palette.border,
    textSecondary: palette.muted,
    primary: palette.amber,
    success: palette.forest,
    card: palette.card,
    border: palette.border,
    brown: palette.brown,
    ink: palette.ink,
    faded: palette.faded,
    mutedGreen: palette.mutedGreen,
  },
  dark: {
    text: palette.cream,
    background: palette.darkBg,
    backgroundElement: palette.darkCard,
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: palette.amber,
    success: palette.forest,
    card: palette.darkCard,
    border: '#2E3135',
    brown: palette.amber,
    ink: palette.cream,
    faded: '#B0B4BA',
    mutedGreen: '#adcebe',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Loaded from assets/fonts in the root layout */
export const AppFonts = {
  heading: 'Outfit_700Bold',
  headingSemi: 'Outfit_600SemiBold',
  headingRegular: 'Outfit_400Regular',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemi: 'PlusJakartaSans_600SemiBold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Doc 4: 44px minimum tap target */
export const TapTarget = 44;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
