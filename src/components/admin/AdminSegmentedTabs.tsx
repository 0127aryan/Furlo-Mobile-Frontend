import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdminCountBadge } from '@/components/admin/AdminCountBadge';
import { adminColors } from '@/constants/adminTheme';
import { AppFonts } from '@/constants/theme';

export type AdminTab<T extends string> = {
  id: T;
  label: string;
  count?: number;
};

type Props<T extends string> = {
  tabs: AdminTab<T>[];
  value: T;
  onChange: (id: T) => void;
};

export function AdminSegmentedTabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.tab, active && styles.tabActive]}>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            {typeof tab.count === 'number' && tab.count > 0 ? (
              <View style={{ marginLeft: 6 }}>
                <AdminCountBadge
                  count={tab.count}
                  color={active ? adminColors.redBadge : '#C9C2B8'}
                />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: adminColors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tabActive: { backgroundColor: adminColors.evergreenSoft },
  label: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: adminColors.muted },
  labelActive: { color: '#fff' },
});
