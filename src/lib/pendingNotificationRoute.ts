let pendingPath: string | null = null;

export function setPendingNotificationRoute(path: string): void {
  pendingPath = path;
}

export function consumePendingNotificationRoute(): string | null {
  const path = pendingPath;
  pendingPath = null;
  return path;
}
