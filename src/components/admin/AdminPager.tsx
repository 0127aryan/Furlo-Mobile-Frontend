import { Pressable, StyleSheet, Text, View } from 'react-native';

import { adminColors } from '@/constants/adminTheme';
import { AppFonts, TapTarget } from '@/constants/theme';
import { PAGE_SIZE, pageCount } from '@/lib/pagination';

type Props = {
  page: number;
  totalCount: number;
  limit?: number;
  loading?: boolean;
  onPage: (page: number) => void;
};

export function AdminPager({ page, totalCount, limit = PAGE_SIZE, loading, onPage }: Props) {
  const pages = pageCount(totalCount, limit);
  if (totalCount <= 0) return null;

  const prevDisabled = page <= 1 || Boolean(loading);
  const nextDisabled = page >= pages || Boolean(loading);

  return (
    <View style={styles.wrap}>
      <Text style={styles.meta}>
        Page {page} of {pages} · {totalCount} total
      </Text>
      <View style={styles.btns}>
        <Pressable
          disabled={prevDisabled}
          onPress={() => onPage(page - 1)}
          style={[styles.btn, prevDisabled && styles.btnOff]}
          accessibilityLabel="Previous page">
          <Text style={styles.btnLabel}>Prev</Text>
        </Pressable>
        <Pressable
          disabled={nextDisabled}
          onPress={() => onPage(page + 1)}
          style={[styles.btn, nextDisabled && styles.btnOff]}
          accessibilityLabel="Next page">
          <Text style={styles.btnLabel}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 8,
  },
  meta: { flex: 1, fontFamily: AppFonts.body, fontSize: 12, color: adminColors.muted },
  btns: { flexDirection: 'row', gap: 8 },
  btn: {
    minWidth: 64,
    minHeight: TapTarget - 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.line,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOff: { opacity: 0.4 },
  btnLabel: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: adminColors.evergreen },
});
