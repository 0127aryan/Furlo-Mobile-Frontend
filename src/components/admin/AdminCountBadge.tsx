import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { adminColors } from '@/constants/adminTheme';
import { AppFonts } from '@/constants/theme';

type Props = {
  count: number;
  color?: string;
};

export function AdminCountBadge({ count, color = adminColors.redBadge }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (count <= 0) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.14, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => {
      anim.stop();
      pulse.setValue(1);
    };
  }, [count, pulse]);

  if (count <= 0) return null;

  return (
    <Animated.View style={[styles.badge, { backgroundColor: color, transform: [{ scale: pulse }] }]}>
      <Text style={styles.label}>{count > 99 ? '99+' : count}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 10,
    color: '#fff',
  },
});
