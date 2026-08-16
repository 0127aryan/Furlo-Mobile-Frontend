import { apiFetch } from '@/api/client';
import type { CommentItem, CreatePostBody, Post } from '@/types/api';

export async function getFeed(petId?: string) {
  const query = petId ? `?petId=${encodeURIComponent(petId)}` : '';
  const data = await apiFetch<{ posts: Post[] }>(`/posts/feed${query}`);
  return data.posts ?? [];
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
  const data = await apiFetch<{ comment: CommentItem }>(`/posts/${postId}/comments`, {
    method: 'POST',
    json: { petId, content, parentCommentId },
  });
  return data.comment;
}

export function reportPost(postId: string, reporterPetId: string, reason: string, details?: string) {
  return apiFetch(`/posts/${postId}/report`, {
    method: 'POST',
    json: { reporterPetId, reason, details },
  });
}
