export interface AdminStats {
  totalUsers: number;
  totalPets: number;
  totalPosts: number;
  totalCommunities: number;
  pendingApprovals: number;
  openReports: number;
}

export interface AdminRecentPet {
  id: string;
  name: string;
  username: string;
  breed?: string;
  profile_image_url: string;
  created_at: string;
  owner_id?: string;
  email?: string;
}

export interface AdminReportItem {
  id: string;
  target_type: 'post' | 'comment' | 'community' | 'pet' | string;
  target_id: string;
  reason_category: string;
  description?: string;
  status: 'open' | 'resolved' | 'dismissed' | string;
  action_taken?: string;
  created_at: string;
  reporter?: {
    email: string;
    name?: string;
    username?: string;
    pet_id?: string;
  };
  pet?: {
    id: string;
    name: string;
    username: string;
  };
  target_content?: {
    caption?: string;
    post_type?: string;
    location_city?: string;
    like_count?: number;
    comment_count?: number;
    status?: string;
    created_at?: string;
    media_urls?: string[];
    author?: {
      id?: string;
      name?: string;
      username?: string;
      avatar?: string;
      breed?: string;
    };
  };
}

export type AdminReportAction = 'remove_content' | 'dismiss';

export interface AdminCommunityItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  cover_image_url?: string;
  banner_url?: string;
  avatar_url?: string;
  image_url?: string;
  location_city?: string;
  city?: string;
  member_count?: number;
  members_count?: number;
  category?: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  is_active?: boolean;
  rejection_reason?: string;
  created_at: string;
  creator?: {
    id: string;
    name: string;
    username: string;
    profile_image_url: string;
    breed?: string;
    owner?: {
      id?: string;
      email?: string;
      role?: string;
      status?: string;
      created_at?: string;
    };
  };
}

export interface AdminPetItem {
  id: string;
  name: string;
  username: string;
  species?: string;
  breed?: string;
  city?: string;
  profile_image_url: string;
  is_verified: boolean;
  is_founding_pet: boolean;
  status?: 'active' | 'suspended' | 'deleted' | string;
  created_at: string;
  owner?: {
    id: string;
    email: string;
    is_admin?: boolean;
  };
}

export interface AdminUserItem {
  id: string;
  email: string;
  is_admin: boolean;
  role?: string;
  status: 'active' | 'suspended' | 'deleted' | string;
  created_at: string;
  pets?: Array<{
    id: string;
    name: string;
    username: string;
    profile_image_url: string;
    breed?: string;
  }>;
}

export type AdminBannerStyle = 'orange' | 'emerald' | 'amber';

export interface AdminBannerItem {
  id: string;
  text: string;
  link_url?: string;
  cta_text?: string;
  style_type: AdminBannerStyle | string;
  is_active: boolean;
  created_at: string;
}

export type AdminBroadcastAudience =
  | 'all'
  | 'pet_parents'
  | 'pet_lovers'
  | 'founding_pets'
  | 'verified_pets'
  | 'unverified_pets'
  | 'non_founding_pets';

export interface AdminBroadcastHistoryItem {
  id: string;
  title: string;
  body: string;
  linkUrl?: string;
  targetAudience?: string;
  recipientCount: number;
  created_at: string;
}
