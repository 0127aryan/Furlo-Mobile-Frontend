import { StyleSheet } from 'react-native';

import { AppFonts, palette } from '@/constants/theme';

export const infoPageStyles = StyleSheet.create({
  eyebrow: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
    color: palette.brown,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  meta: { fontFamily: AppFonts.body, fontSize: 13, color: palette.faded },
  intro: {
    backgroundColor: '#FFFBF7',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 16,
  },
  introText: { fontFamily: AppFonts.body, fontSize: 15, lineHeight: 22, color: palette.muted },
  introStrong: { fontFamily: AppFonts.bodySemi, color: palette.ink },
  sectionTitle: { fontFamily: AppFonts.heading, fontSize: 18, color: palette.evergreenSoft, marginTop: 8 },
  body: { fontFamily: AppFonts.body, fontSize: 14, lineHeight: 21, color: palette.muted },
  bodyStrong: { fontFamily: AppFonts.bodySemi, color: palette.ink },
});
