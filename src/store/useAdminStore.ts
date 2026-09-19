import { create } from 'zustand';

interface AdminBadgeState {
  pendingApprovals: number;
  openReports: number;
  setBadgeCounts: (counts: { pendingApprovals?: number; openReports?: number }) => void;
  bumpOpenReports: (delta: number) => void;
  bumpPendingApprovals: (delta: number) => void;
}

export const useAdminStore = create<AdminBadgeState>((set) => ({
  pendingApprovals: 0,
  openReports: 0,
  setBadgeCounts: (counts) =>
    set((state) => ({
      pendingApprovals: counts.pendingApprovals ?? state.pendingApprovals,
      openReports: counts.openReports ?? state.openReports,
    })),
  bumpOpenReports: (delta) =>
    set((state) => ({ openReports: Math.max(0, state.openReports + delta) })),
  bumpPendingApprovals: (delta) =>
    set((state) => ({ pendingApprovals: Math.max(0, state.pendingApprovals + delta) })),
}));
