import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { AppFonts, palette } from '@/constants/theme';

type Props = {
  caption?: string;
};

export function FurloLoadingScreen({ caption = 'Preparing experience' }: Props) {
  const [progress, setProgress] = useState(0);
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 280,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(400),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
    // Dots are stable Animated.Values from refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let width = 0;
    const interval = setInterval(() => {
      if (width >= 100) {
        clearInterval(interval);
        return;
      }
      const remaining = 100 - width;
      const increment = Math.random() * Math.min(remaining * 0.35, 14) + 1;
      width = Math.min(width + increment, 100);
      setProgress(Math.floor(width));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.screen} accessibilityLabel="Loading Furlo">
      <View style={styles.center}>
        <Text style={styles.wordmark}>furlo</Text>
        <Text style={styles.tagline}>Where Pets Belong</Text>
        <View style={styles.dots}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                  transform: [
                    {
                      translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressLabels}>
          <Text style={styles.caption}>{caption}</Text>
          <Text style={styles.percent}>{progress}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDF8F2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  center: { alignItems: 'center' },
  wordmark: {
    fontFamily: AppFonts.heading,
    color: palette.amber,
    fontSize: 56,
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    fontFamily: AppFonts.body,
    color: '#5C6370',
    fontSize: 12,
    opacity: 0.75,
    marginBottom: 40,
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.amber,
  },
  progressWrap: {
    position: 'absolute',
    bottom: 48,
    width: '100%',
    maxWidth: 280,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  caption: {
    fontFamily: AppFonts.body,
    color: '#5C6370',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    opacity: 0.55,
  },
  percent: {
    fontFamily: AppFonts.body,
    color: '#5C6370',
    fontSize: 9,
    opacity: 0.55,
  },
  track: {
    height: 1,
    width: '100%',
    backgroundColor: '#EDE8E1',
    borderRadius: 99,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: palette.amber,
    borderRadius: 99,
  },
});
