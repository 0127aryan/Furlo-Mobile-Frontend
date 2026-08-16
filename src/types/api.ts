export interface User {
  id: string;
  email: string;
  is_admin: boolean;
  status: string;
  name?: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  username: string;
  name: string;
  profile_image_url: string;
  breed: string;
  city: string;
  personality_tags: string[];
}

export interface OnboardingData {
  role: 'parent' | 'lover' | null;
  email?: string;
  password?: string;
  petName?: string;
  petUsername?: string;
  petType?: string;
  species?: string;
  customPetType?: string;
  breed?: string;
  customBreed?: string;
  city?: string;
  gender?: 'male' | 'female' | 'unknown';
  bio?: string;
  personalityTags?: string[];
  customPersonalityTags?: string[];
  avatarData?: string;
  packs?: string[];
}

export interface AuthContext {
  user: User | null;
  activePet: Pet | null;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse extends AuthContext {
  session?: AuthSession | null;
}

export interface SignupResponse {
  message: string;
  user: unknown;
  session?: AuthSession | null;
  requiresVerification?: boolean;
}

export interface Post {
  id: string;
  caption: string;
  post_type: 'regular' | 'question' | 'advice' | 'meme';
  location_city?: string;
  like_count: number;
  comment_count: number;
  hasLiked?: boolean;
  created_at: string;
  pets?: {
    id: string;
    name: string;
    username: string;
    breed: string;
    species?: string;
    pet_type?: string;
    city: string;
    profile_image_url: string;
  };
  communities?: {
    id: string;
    name: string;
    slug: string;
  };
  media?: {
    id: string;
    media_url: string;
    display_order: number;
  }[];
}

export interface CommentItem {
  id: string;
  content: string;
  created_at: string;
  pets?: {
    id: string;
    name: string;
    username: string;
    profile_image_url: string;
  };
}

export interface CompleteOnboardingBody {
  role?: 'parent' | 'lover';
  petName: string;
  petUsername?: string;
  petType?: string;
  customPetType?: string;
  breed?: string;
  customBreed?: string;
  city: string;
  gender?: 'male' | 'female' | 'unknown';
  bio?: string;
  personalityTags?: string[];
  customPersonalityTags?: string[];
  avatarData?: string;
  packs?: string[];
}

export interface CreatePostBody {
  petId: string;
  communityId?: string | null;
  caption?: string;
  postType?: 'regular' | 'question' | 'advice' | 'meme';
  mediaData?: string[];
}
