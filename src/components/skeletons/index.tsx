import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';
import { palette } from '@/constants/theme';

function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function PostCardSkeleton() {
  return (
    <Card>
      <View style={styles.row}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={styles.flex}>
          <Skeleton width="45%" height={14} />
          <Skeleton width="30%" height={10} style={{ marginTop: 8 }} />
        </View>
      </View>
      <Skeleton height={12} style={{ marginTop: 14 }} />
      <Skeleton width="88%" height={12} style={{ marginTop: 8 }} />
      <Skeleton width="62%" height={12} style={{ marginTop: 8 }} />
      <Skeleton height={160} borderRadius={16} style={{ marginTop: 14 }} />
      <View style={[styles.row, { marginTop: 14, gap: 16 }]}>
        <Skeleton width={64} height={12} />
        <Skeleton width={64} height={12} />
        <Skeleton width={64} height={12} />
      </View>
    </Card>
  );
}

export function FeedListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function NotificationRowSkeleton() {
  return (
    <View style={styles.notifRow}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.flex}>
        <Skeleton width="70%" height={13} />
        <Skeleton width="90%" height={11} style={{ marginTop: 8 }} />
        <Skeleton width="25%" height={10} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function NotificationListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <NotificationRowSkeleton key={i} />
      ))}
    </View>
  );
}

export function QuestionCardSkeleton() {
  return (
    <Card>
      <View style={styles.row}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={styles.flex}>
          <Skeleton width="50%" height={13} />
          <Skeleton width="35%" height={10} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton height={14} style={{ marginTop: 12 }} />
      <Skeleton width="78%" height={14} style={{ marginTop: 8 }} />
      <View style={[styles.row, { marginTop: 12, gap: 8 }]}>
        <Skeleton width={56} height={22} borderRadius={11} />
        <Skeleton width={72} height={22} borderRadius={11} />
      </View>
    </Card>
  );
}

export function QuestionListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <QuestionCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function PackCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <View style={[styles.packCard, featured && styles.packFeatured]}>
      <Skeleton height={featured ? 140 : 100} borderRadius={16} />
      <Skeleton width="65%" height={16} style={{ marginTop: 12 }} />
      <Skeleton width="40%" height={11} style={{ marginTop: 8 }} />
      <Skeleton width="30%" height={11} style={{ marginTop: 6 }} />
    </View>
  );
}

export function PackListSkeleton() {
  return (
    <View style={styles.list}>
      <PackCardSkeleton featured />
      <View style={styles.packGrid}>
        <View style={styles.packGridItem}>
          <PackCardSkeleton />
        </View>
        <View style={styles.packGridItem}>
          <PackCardSkeleton />
        </View>
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.list}>
      <View style={styles.profileHeader}>
        <Skeleton width={88} height={88} borderRadius={44} />
        <Skeleton width="55%" height={20} style={{ marginTop: 16 }} />
        <Skeleton width="40%" height={12} style={{ marginTop: 10 }} />
        <View style={[styles.row, { marginTop: 16, gap: 20, justifyContent: 'center' }]}>
          <Skeleton width={48} height={36} borderRadius={8} />
          <Skeleton width={48} height={36} borderRadius={8} />
          <Skeleton width={48} height={36} borderRadius={8} />
        </View>
      </View>
      <View style={[styles.row, { gap: 8, paddingHorizontal: 4 }]}>
        <Skeleton width="30%" height={36} borderRadius={18} />
        <Skeleton width="30%" height={36} borderRadius={18} />
        <Skeleton width="30%" height={36} borderRadius={18} />
      </View>
      <PostCardSkeleton />
      <PostCardSkeleton />
    </View>
  );
}

export function QuestionDetailSkeleton() {
  return (
    <View style={styles.list}>
      <Card>
        <View style={styles.row}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.flex}>
            <Skeleton width="45%" height={14} />
            <Skeleton width="30%" height={10} style={{ marginTop: 6 }} />
          </View>
        </View>
        <Skeleton height={18} style={{ marginTop: 16 }} />
        <Skeleton width="92%" height={18} style={{ marginTop: 10 }} />
        <Skeleton height={12} style={{ marginTop: 16 }} />
        <Skeleton width="85%" height={12} style={{ marginTop: 8 }} />
        <Skeleton width="70%" height={12} style={{ marginTop: 8 }} />
      </Card>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <View style={styles.row}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton width="35%" height={12} />
          </View>
          <Skeleton height={12} style={{ marginTop: 12 }} />
          <Skeleton width="80%" height={12} style={{ marginTop: 8 }} />
        </Card>
      ))}
    </View>
  );
}

export function CommunityDetailSkeleton() {
  return (
    <View style={styles.list}>
      <Skeleton height={120} borderRadius={20} />
      <Skeleton width="60%" height={22} style={{ marginTop: 16 }} />
      <Skeleton width="80%" height={12} style={{ marginTop: 10 }} />
      <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
      <View style={[styles.row, { marginTop: 16, gap: 12 }]}>
        <Skeleton width={100} height={36} borderRadius={18} />
        <Skeleton width={80} height={36} borderRadius={18} />
      </View>
      <FeedListSkeleton count={2} />
    </View>
  );
}

export function ListRowSkeleton() {
  return (
    <View style={styles.listRow}>
      <Skeleton width={36} height={36} borderRadius={18} />
      <View style={styles.flex}>
        <Skeleton width="50%" height={13} />
        <Skeleton width="35%" height={10} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function ListRowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </View>
  );
}

export function SettingsSkeleton() {
  return (
    <View style={styles.list}>
      <Card>
        <View style={styles.row}>
          <Skeleton width={44} height={44} borderRadius={14} />
          <View style={styles.flex}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="40%" height={10} style={{ marginTop: 8 }} />
          </View>
          <Skeleton width={44} height={28} borderRadius={14} />
        </View>
      </Card>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={styles.settingRow}>
          <Skeleton width={28} height={28} borderRadius={8} />
          <View style={styles.flex}>
            <Skeleton width="55%" height={13} />
            <Skeleton width="80%" height={10} style={{ marginTop: 6 }} />
          </View>
          <Skeleton width={44} height={28} borderRadius={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 16,
  },
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  notifRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.cardLine,
  },
  packCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 14,
  },
  packFeatured: { marginBottom: 4 },
  packGrid: { flexDirection: 'row', gap: 12 },
  packGridItem: { flex: 1 },
  profileHeader: { alignItems: 'center', paddingVertical: 8 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.cardLine,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: palette.cardLine,
  },
});
