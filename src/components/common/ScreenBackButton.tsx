import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { palette, TapTarget } from '@/constants/theme';

type Props = {
  fallbackHref?: Href;
  onPress?: () => void;
  style?: ViewStyle;
  color?: string;
};

export function ScreenBackButton({
  fallbackHref = '/feed',
  onPress,
  style,
  color = palette.evergreen,
}: Props) {
  const router = useRouter();

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={[styles.btn, style]}
      accessibilityRole="button"
      accessibilityLabel="Go back">
      <Ionicons name="arrow-back" size={22} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: TapTarget,
    height: TapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
