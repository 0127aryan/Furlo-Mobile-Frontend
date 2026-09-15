import { Pressable, StyleSheet, View } from 'react-native';

import { palette } from '@/constants/theme';

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

export function NotificationToggle({ value, onValueChange, disabled }: Props) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={[styles.track, value ? styles.trackOn : styles.trackOff, disabled && styles.disabled]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}>
      <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 32,
    borderRadius: 999,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  trackOn: { backgroundColor: palette.amber },
  trackOff: { backgroundColor: '#C1C8C3' },
  disabled: { opacity: 0.5 },
  thumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  thumbOn: { alignSelf: 'flex-end' },
  thumbOff: { alignSelf: 'flex-start' },
});
