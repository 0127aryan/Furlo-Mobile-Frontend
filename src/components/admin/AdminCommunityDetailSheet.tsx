import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { adminColors } from '@/constants/adminTheme';
import { AppFonts, TapTarget } from '@/constants/theme';
import type { AdminCommunityItem } from '@/types/admin';

type Props = {
  community: AdminCommunityItem | null;
  visible: boolean;
  busy?: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSuspend: () => void;
  onDelete: () => void;
};

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function formatSubmitted(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusCopy(status: string) {
  if (status === 'approved') return { label: 'Approved Pack', bg: '#DCFCE7', fg: '#15803D' };
  if (status === 'rejected') return { label: 'Application Rejected', bg: '#FEE2E2', fg: '#DC2626' };
  return { label: 'Pending Approval', bg: '#FFEDD5', fg: '#C2410C' };
}

function DetailTile({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
  avatarUri,
}: {
  icon: IoniconName;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub?: string;
  avatarUri?: string;
}) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: iconBg }]}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.tileAvatar} />
        ) : (
          <Ionicons name={icon} size={18} color={iconColor} />
        )}
      </View>
      <View style={styles.tileCopy}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.tileValue} numberOfLines={2}>
          {value}
        </Text>
        {sub ? (
          <Text style={styles.tileSub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function AdminCommunityDetailSheet({
  community,
  visible,
  busy,
  onClose,
  onApprove,
  onReject,
  onSuspend,
  onDelete,
}: Props) {
  const insets = useSafeAreaInsets();
  const cardMaxHeight =
    Dimensions.get('window').height - Math.max(insets.top, 16) - Math.max(insets.bottom, 16) - 8;
  const pending = community?.status === 'pending';
  const cover = community?.cover_image_url || community?.banner_url;
  const avatar = community?.avatar_url || community?.image_url;
  const location = community?.location_city || community?.city || 'Bangalore';
  const members = community?.member_count || community?.members_count || 1;
  const status = community ? statusCopy(community.status) : statusCopy('pending');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { paddingBottom: Math.max(insets.bottom, 16), paddingTop: Math.max(insets.top, 16) }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close details" />
        <View style={[styles.card, { maxHeight: cardMaxHeight }]}>
          {community ? (
            <>
              <View style={styles.cover}>
                {cover ? (
                  <Image source={{ uri: cover }} style={styles.coverImage} contentFit="cover" />
                ) : (
                  <View style={styles.coverFallback}>
                    <Ionicons name="people" size={56} color="rgba(255,255,255,0.22)" />
                  </View>
                )}
                <Pressable onPress={onClose} style={styles.coverClose} accessibilityLabel="Close">
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>
                <View style={styles.avatarWrap}>
                  {avatar ? (
                    <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
                  ) : (
                    <View style={styles.avatarEmpty}>
                      <Ionicons name="paw" size={28} color={adminColors.accent} />
                    </View>
                  )}
                </View>
              </View>

              <ScrollView
                style={[styles.body, { maxHeight: Math.max(cardMaxHeight - 230, 220) }]}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.titleRow}>
                  <View style={styles.titleCopy}>
                    <Text style={styles.name}>{community.name}</Text>
                    <Text style={styles.slug}>/{community.slug}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: status.bg }]}>
                    {community.status === 'pending' ? <View style={styles.badgeDot} /> : null}
                    <Text style={[styles.badgeText, { color: status.fg }]}>{status.label}</Text>
                  </View>
                </View>
                {community.is_active === false ? (
                  <View style={[styles.badge, { backgroundColor: '#F5F2ED', alignSelf: 'flex-start' }]}>
                    <Text style={[styles.badgeText, { color: adminColors.muted }]}>Suspended</Text>
                  </View>
                ) : null}

                <View style={styles.descBox}>
                  <Text style={styles.descLabel}>Community Description</Text>
                  <Text style={styles.descText}>
                    {community.description || 'No detailed description provided for this pack application.'}
                  </Text>
                </View>

                {community.status === 'rejected' && community.rejection_reason ? (
                  <View style={styles.rejectBox}>
                    <Text style={styles.rejectTitle}>Rejection Reason Feedback</Text>
                    <Text style={styles.rejectText}>{community.rejection_reason}</Text>
                  </View>
                ) : null}

                <View style={styles.grid}>
                  <DetailTile
                    icon="location"
                    iconBg="#FFF9F2"
                    iconColor={adminColors.accent}
                    label="Location / City"
                    value={location}
                  />
                  <DetailTile
                    icon="people"
                    iconBg="#E4F5EB"
                    iconColor="#166534"
                    label="Total Members"
                    value={`${members} ${members === 1 ? 'member' : 'members'}`}
                  />
                  <DetailTile
                    icon="paw"
                    iconBg="#F5F2ED"
                    iconColor={adminColors.evergreen}
                    label="Created By (Pet Lead)"
                    value={community.creator?.name || 'Pet Lead'}
                    sub={`@${community.creator?.username || 'user'}`}
                    avatarUri={community.creator?.profile_image_url}
                  />
                  <DetailTile
                    icon="mail"
                    iconBg="#F5F2ED"
                    iconColor={adminColors.evergreen}
                    label="Owner Email"
                    value={community.creator?.owner?.email || 'N/A'}
                  />
                  <DetailTile
                    icon="calendar"
                    iconBg="#F5F2ED"
                    iconColor={adminColors.muted}
                    label="Submitted Date"
                    value={formatSubmitted(community.created_at)}
                  />
                  <DetailTile
                    icon="shield-checkmark"
                    iconBg="#F5F2ED"
                    iconColor={adminColors.muted}
                    label="Account Role"
                    value={(community.creator?.owner?.role || 'User').replace(/^\w/, (c) => c.toUpperCase())}
                  />
                </View>
              </ScrollView>

              <View style={styles.footer}>
                <Pressable onPress={onClose} style={styles.closeDetails}>
                  <Text style={styles.closeDetailsLabel}>Close Details</Text>
                </Pressable>
                <View style={styles.footerActions}>
                  <Pressable disabled={busy} onPress={onSuspend} style={styles.suspendBtn}>
                    <Text style={styles.suspendLabel}>
                      {community.is_active === false ? 'Restore Pack' : 'Suspend Pack'}
                    </Text>
                  </Pressable>
                  <Pressable disabled={busy} onPress={onDelete} style={styles.deleteBtn}>
                    <Text style={styles.deleteLabel}>Delete</Text>
                  </Pressable>
                  {pending ? (
                    <>
                      <Pressable disabled={busy} onPress={onApprove} style={styles.approveBtn}>
                        {busy ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark" size={16} color="#fff" />
                            <Text style={styles.approveLabel}>Approve Pack</Text>
                          </>
                        )}
                      </Pressable>
                      <Pressable disabled={busy} onPress={onReject} style={styles.rejectBtn}>
                        <Ionicons name="close" size={16} color={adminColors.redBadge} />
                        <Text style={styles.rejectLabel}>Reject</Text>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: adminColors.line,
    overflow: 'hidden',
    zIndex: 1,
  },
  cover: {
    height: 144,
    backgroundColor: adminColors.evergreenSoft,
    flexShrink: 0,
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  coverFallback: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#476457',
  },
  coverClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  avatarWrap: {
    position: 'absolute',
    left: 24,
    bottom: -24,
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 4,
    borderWidth: 1,
    borderColor: adminColors.line,
    zIndex: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  avatarEmpty: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: adminColors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flexGrow: 1,
    flexShrink: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 16,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: AppFonts.heading,
    fontSize: 22,
    color: adminColors.evergreen,
    lineHeight: 26,
  },
  slug: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 12,
    color: adminColors.accent,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EA580C',
  },
  badgeText: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 11,
  },
  descBox: {
    backgroundColor: adminColors.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.line,
    padding: 14,
    gap: 4,
  },
  descLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 10,
    color: adminColors.muted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  descText: {
    fontFamily: AppFonts.body,
    fontSize: 12,
    color: adminColors.evergreen,
    lineHeight: 18,
  },
  rejectBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    gap: 4,
  },
  rejectTitle: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 12,
    color: adminColors.redBadge,
  },
  rejectText: {
    fontFamily: AppFonts.body,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '46%',
    minWidth: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: adminColors.line,
    backgroundColor: '#fff',
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileAvatar: {
    width: 36,
    height: 36,
  },
  tileCopy: {
    flex: 1,
    minWidth: 0,
  },
  tileLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 10,
    color: adminColors.muted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tileValue: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 12,
    color: adminColors.evergreen,
    marginTop: 1,
  },
  tileSub: {
    fontFamily: AppFonts.body,
    fontSize: 10,
    color: adminColors.muted,
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: adminColors.cream,
    borderTopWidth: 1,
    borderTopColor: adminColors.line,
    flexShrink: 0,
  },
  closeDetails: {
    minHeight: TapTarget - 4,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: adminColors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeDetailsLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 12,
    color: adminColors.evergreen,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  approveBtn: {
    minHeight: TapTarget - 4,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: adminColors.emeraldBadge,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 12,
    color: '#fff',
  },
  rejectBtn: {
    minHeight: TapTarget - 4,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rejectLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 12,
    color: adminColors.redBadge,
  },
  suspendBtn: {
    minHeight: TapTarget - 4,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FDE8D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspendLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 12,
    color: '#C2410C',
  },
  deleteBtn: {
    minHeight: TapTarget - 4,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: {
    fontFamily: AppFonts.bodySemi,
    fontSize: 12,
    color: adminColors.redBadge,
  },
});
