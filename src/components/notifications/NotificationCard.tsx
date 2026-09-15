import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppFonts, palette, TapTarget } from '@/constants/theme';
import type { NotificationItem } from '@/types/api';

type Props = {
  item: NotificationItem;
  index: number;
  isFollowing?: boolean;
  onPress: () => void;
  onDismiss: () => void;
  onFollowBack?: () => void;
};

function typeBadge(item: NotificationItem) {
  switch (item.type) {
    case 'best_answer':
      return { label: 'Best Answer', bg: '#DCFCE7', color: '#15803D', icon: 'star' as const };
    case 'treat':
      return { label: 'Treats', bg: 'rgba(232,132,58,0.12)', color: palette.amber, icon: 'paw' as const };
    case 'comment':
      return {
        label: (item.metadata?.role as string) || 'Community Advice',
        bg: '#F5F2ED',
        color: '#727974',
        icon: 'chatbubble-outline' as const,
      };
    case 'follow':
      return { label: 'New Wag', bg: '#F5F2ED', color: '#727974', icon: 'person-add-outline' as const };
    case 'pack_announcement':
      return { label: 'Pack Alert', bg: 'rgba(22,51,40,0.1)', color: palette.evergreenSoft, icon: 'megaphone-outline' as const };
    default:
      return { label: 'Update', bg: '#F5F2ED', color: '#727974', icon: 'notifications-outline' as const };
  }
}

function overlayBadge(type: NotificationItem['type']) {
  switch (type) {
    case 'best_answer':
      return { bg: '#DCFCE7', color: '#15803D', icon: 'star' as const };
    case 'treat':
      return { bg: palette.amber, color: '#fff', icon: 'paw' as const };
    case 'comment':
      return { bg: palette.mutedGreen, color: '#fff', icon: 'chatbubble' as const };
    case 'follow':
      return { bg: palette.apricot, color: palette.brown, icon: 'person-add' as const };
    default:
      return null;
  }
}

export function NotificationCard({
  item,
  index,
  isFollowing,
  onPress,
  onDismiss,
  onFollowBack,
}: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(12)).current;
  const badge = typeBadge(item);
  const overlay = overlayBadge(item.type);
  const excerpt = item.metadata?.excerpt as string | undefined;
  const karma = item.metadata?.karma as number | undefined;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        delay: Math.min(index * 40, 320),
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 220,
        delay: Math.min(index * 40, 320),
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide, index]);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <View style={[styles.card, !item.is_read && styles.cardUnread]}>
        {!item.is_read ? <View style={styles.unreadDot} /> : <View style={styles.unreadSpacer} />}

        <Pressable onPress={onPress} style={styles.avatarWrap}>
          {item.pets?.profile_image_url ? (
            <Image source={{ uri: item.pets.profile_image_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarEmpty}>
              <Ionicons name="paw" size={20} color={palette.amber} />
            </View>
          )}
          {overlay ? (
            <View style={[styles.overlayBadge, { backgroundColor: overlay.bg }]}>
              <Ionicons name={overlay.icon} size={12} color={overlay.color} />
            </View>
          ) : null}
        </Pressable>

        <Pressable onPress={onPress} style={styles.content}>
          <View style={styles.metaRow}>
            <View style={[styles.typePill, { backgroundColor: badge.bg }]}>
              {item.type === 'best_answer' ? (
                <Ionicons name="checkmark-circle" size={12} color={badge.color} />
              ) : null}
              <Text style={[styles.typeLabel, { color: badge.color }]}>{badge.label}</Text>
            </View>
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </Text>
          </View>

          <Text style={styles.body}>{item.body}</Text>

          {excerpt ? (
            <View style={styles.excerpt}>
              <Ionicons name="chatbox-ellipses-outline" size={14} color={palette.mutedGreen} />
              <Text style={styles.excerptText} numberOfLines={2}>
                "{excerpt}"
              </Text>
            </View>
          ) : null}

          {item.type === 'treat' && karma ? (
            <Text style={styles.karma}>+{karma} treat karma</Text>
          ) : null}

          {item.type === 'follow' && item.actor_pet_id && onFollowBack ? (
            <View style={styles.followRow}>
              <Text style={styles.followHint} numberOfLines={1}>
                {(item.metadata?.subtext as string) || 'Shared interest in your pack'}
              </Text>
              <Pressable
                onPress={onFollowBack}
                style={[styles.followBtn, isFollowing && styles.followingBtn]}>
                <Ionicons
                  name={isFollowing ? 'checkmark' : 'person-add-outline'}
                  size={14}
                  color={isFollowing ? palette.evergreenSoft : '#fff'}
                />
                <Text style={[styles.followLabel, isFollowing && styles.followingLabel]}>
                  {isFollowing ? 'Following' : 'Follow Back 🐕'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.footer}>
            {item.entity_type === 'post' && item.entity_id ? (
              <Text style={styles.actionLink}>View Discussion Thread →</Text>
            ) : null}
            <Pressable onPress={onDismiss} hitSlop={8} style={styles.dismissBtn}>
              <Text style={styles.dismissLabel}>Dismiss</Text>
            </Pressable>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.cardLine,
    padding: 16,
  },
  cardUnread: {
    backgroundColor: '#FFF9F2',
    borderColor: '#FDE8D3',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.amber,
    marginTop: 14,
    shadowColor: palette.amber,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  unreadSpacer: { width: 10 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.cardLine,
    backgroundColor: '#f8f3ed',
  },
  avatarEmpty: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8f3ed',
    borderWidth: 1,
    borderColor: palette.cardLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  content: { flex: 1, minWidth: 0, gap: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeLabel: { fontFamily: AppFonts.bodySemi, fontSize: 11 },
  date: { fontFamily: AppFonts.body, fontSize: 11, color: '#727974' },
  body: { fontFamily: AppFonts.body, fontSize: 14, lineHeight: 20, color: palette.evergreen },
  excerpt: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.cardLine,
    borderRadius: 12,
    padding: 10,
  },
  excerptText: {
    flex: 1,
    fontFamily: AppFonts.body,
    fontSize: 12,
    fontStyle: 'italic',
    color: '#727974',
    lineHeight: 18,
  },
  karma: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.amber },
  followRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  followHint: { flex: 1, fontFamily: AppFonts.body, fontSize: 11, color: '#727974' },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: palette.amber,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: TapTarget * 0.75,
  },
  followingBtn: { backgroundColor: '#F5F2ED' },
  followLabel: { fontFamily: AppFonts.bodySemi, fontSize: 11, color: '#fff' },
  followingLabel: { color: palette.evergreenSoft },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionLink: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: palette.amber },
  dismissBtn: { marginLeft: 'auto', paddingVertical: 4, paddingHorizontal: 4 },
  dismissLabel: { fontFamily: AppFonts.bodySemi, fontSize: 12, color: '#727974' },
});
