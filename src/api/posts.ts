import { apiFetch } from '@/api/client';
import { PAGE_SIZE, paginationFrom, type PageParams, type PaginationMeta } from '@/lib/pagination';
import type {
  CommentItem,
  CreatePostBody,
  HelperPet,
  Post,
  QAFilterTab,
  QuestionPost,
  TrendingQuestion,
} from '@/types/api';

export type FeedPage = PaginationMeta & { posts: Post[] };

export async function getFeed(
  petId?: string,
  communityId?: string,
  options?: PageParams & { authorPetId?: string },
): Promise<FeedPage> {
  const search = new URLSearchParams();
  if (petId) search.set('petId', petId);
  if (communityId) search.set('communityId', communityId);
  if (options?.authorPetId) search.set('authorPetId', options.authorPetId);
  search.set('page', String(options?.page ?? 1));
  search.set('limit', String(options?.limit ?? PAGE_SIZE));
  const data = await apiFetch<FeedPage>(`/posts/feed?${search.toString()}`);
  return {
    posts: data.posts ?? [],
    ...paginationFrom(data),
  };
}

export function getTrendingHashtags() {
  return apiFetch<{ name: string; usage_count: number }[]>('/posts/trending-hashtags', { skipAuth: true });
}

export async function createPost(body: CreatePostBody) {
  const data = await apiFetch<{ post: Post }>('/posts/create', { method: 'POST', json: body });
  return data.post;
}

export function likePost(postId: string, petId: string) {
  return apiFetch<{ hasLiked: boolean; likeCount: number }>(`/posts/${postId}/like`, {
    method: 'POST',
    json: { petId },
  });
}

export async function getComments(postId: string) {
  const data = await apiFetch<{ comments: CommentItem[] }>(`/posts/${postId}/comments`);
  return data.comments ?? [];
}

export async function createComment(postId: string, petId: string, content: string, parentCommentId?: string) {
  const data = await apiFetch<{ comment: CommentItem; commentCount?: number }>(`/posts/${postId}/comments`, {
    method: 'POST',
    json: { petId, content, parentCommentId },
  });
  return data;
}

export function reportPost(postId: string, reporterPetId: string, reason: string, details?: string) {
  return apiFetch(`/posts/${postId}/report`, {
    method: 'POST',
    json: { reporterPetId, reason, details },
  });
}

export async function getSinglePost(postId: string, petId?: string) {
  const search = petId ? `?petId=${petId}` : '';
  const data = await apiFetch<{ post: Post }>(`/posts/single/${postId}${search}`);
  return data.post;
}

export async function getQAQuestions(options: {
  category?: string;
  filter?: QAFilterTab;
  petId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (options.category && options.category !== 'All') {
    search.set('category', options.category);
  }
  if (options.filter && options.filter !== 'all') {
    search.set('filter', options.filter);
  }
  if (options.petId) search.set('petId', options.petId);
  if (options.search) search.set('search', options.search);
  search.set('page', String(options.page ?? 1));
  search.set('limit', String(options.limit ?? PAGE_SIZE));
  const data = await apiFetch<PaginationMeta & { questions: QuestionPost[] }>(
    `/posts/qa/questions?${search.toString()}`
  );
  return {
    questions: data.questions ?? [],
    ...paginationFrom(data),
  };
}

export async function getQATrending(limit = 5) {
  const data = await apiFetch<{ trending: TrendingQuestion[] }>(`/posts/qa/trending?limit=${limit}`, {
    skipAuth: true,
  });
  return data.trending ?? [];
}

export async function getQATopHelpers(limit = 5) {
  const data = await apiFetch<{ helpers: HelperPet[] }>(`/posts/qa/top-helpers?limit=${limit}`, {
    skipAuth: true,
  });
  return data.helpers ?? [];
}

export function acceptAnswer(postId: string, petId: string, commentId: string) {
  return apiFetch<{ success: boolean; message: string }>(`/posts/${postId}/accept-answer`, {
    method: 'POST',
    json: { petId, commentId },
  });
}

export function unacceptAnswer(postId: string, petId: string) {
  return apiFetch<{ success: boolean; message: string }>(`/posts/${postId}/unaccept-answer`, {
    method: 'POST',
    json: { petId },
  });
}

export function markQuestionSolved(postId: string, petId: string) {
  return apiFetch<{ success: boolean; message: string }>(`/posts/${postId}/mark-solved`, {
    method: 'POST',
    json: { petId },
  });
}

export function markQuestionUnsolved(postId: string, petId: string) {
  return apiFetch<{ success: boolean; message: string }>(`/posts/${postId}/mark-unsolved`, {
    method: 'POST',
    json: { petId },
  });
}
