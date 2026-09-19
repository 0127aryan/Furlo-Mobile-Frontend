type AdminLikeUser = {
  is_admin?: boolean | string | null;
  role?: string | null;
} | null | undefined;

export function isAdminUser(user: AdminLikeUser): boolean {
  if (!user) return false;
  return (
    user.is_admin === true ||
    user.is_admin === 'true' ||
    user.role === 'super_admin' ||
    user.role === 'admin'
  );
}
