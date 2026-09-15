import { FlatList, Pressable, StyleSheet, Text } from 'react-native';

import { AppFonts, palette } from '@/constants/theme';
import type { NotificationCategory } from '@/types/api';

const FILTERS: { id: NotificationCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '' },
  { id: 'treats', label: 'Treats & Likes', icon: '🐾' },
  { id: 'comments', label: 'Comments & Answers', icon: '💬' },
  { id: 'followers', label: 'Followers & Wags', icon: '🐕' },
  { id: 'qa', label: 'Q&A', icon: '⭐' },
];

type Props = {
  active: NotificationCategory;
  onChange: (category: NotificationCategory) => void;
};

export function CategoryFilterPills({ active, onChange }: Props) {
  return (
    <FlatList
      horizontal
      data={FILTERS}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      style={styles.list}
      contentContainerStyle={styles.row}
      renderItem={({ item: filter }) => {
        const isActive = active === filter.id;
        return (
          <Pressable
            onPress={() => onChange(filter.id)}
            style={({ pressed }) => [
              styles.pill,
              isActive ? styles.pillActive : styles.pillInactive,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {filter.label}
              {filter.icon ? ` ${filter.icon}` : ''}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 0, flexShrink: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  pill: {
    flexShrink: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: palette.amber,
    shadowColor: palette.amber,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  pillInactive: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.cardLine,
  },
  label: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    color: palette.evergreen,
    includeFontPadding: false,
  },
  labelActive: { color: '#fff' },
});
