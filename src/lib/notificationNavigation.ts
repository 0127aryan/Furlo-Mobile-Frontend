import type { Router } from 'expo-router';

export type NotificationLinkData = {
  notificationId?: string;
  type?: string;
  entityType?: string;
  entityId?: string;
  actorPetId?: string;
  linkUrl?: string;
};

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function parseNotificationData(raw: Record<string, unknown> | undefined): NotificationLinkData {
  if (!raw) return {};
  return {
    notificationId: clean(raw.notificationId),
    type: clean(raw.type),
    entityType: clean(raw.entityType),
    entityId: clean(raw.entityId),
    actorPetId: clean(raw.actorPetId),
    linkUrl: clean(raw.linkUrl),
  };
}

export function buildNotificationPath(data: NotificationLinkData): string {
  const linkUrl = data.linkUrl;
  if (linkUrl?.startsWith('/')) return linkUrl;

  if (data.entityType === 'post' && data.entityId) {
    return `/qa/${data.entityId}`;
  }
  if (data.entityType === 'pet' && data.entityId) {
    return `/pet/${data.entityId}`;
  }
  if (data.actorPetId) {
    return `/pet/${data.actorPetId}`;
  }
  return '/(tabs)/notifications';
}

export function navigateFromNotification(data: NotificationLinkData, router: Router): void {
  const path = buildNotificationPath(data);
  router.push(path as never);
}
