import { apiFetch } from '@/api/client';
import type { CommentItem, CreatePostBody, Post } from '@/types/api';

export function getFeed(petId?: string) {
  const query = petId ? `?petId=${encodeURIComponent(petId)}` : '';
  return apiFetch<Post[]>(`/posts/feed${query}`);
}

export function getTrendingHashtags() {
  return apiFetch('/posts/trending-hashtags', { skipAuth: true });
}

export function createPost(body: CreatePostBody) {
  return apiFetch('/posts/create', { method: 'POST', json: body });
}

export function likePost(postId: string, petId: string) {
  return apiFetch(`/posts/${postId}/like`, { method: 'POST', json: { petId } });
}

export function getComments(postId: string) {
  return apiFetch<CommentItem[]>(`/posts/${postId}/comments`, { skipAuth: true });
}

export function createComment(postId: string, petId: string, content: string, parentCommentId?: string) {
  return apiFetch(`/posts/${postId}/comments`, {
    method: 'POST',
    json: { petId, content, parentCommentId },
  });
}

export function reportPost(postId: string, reporterPetId: string, reason: string, details?: string) {
  return apiFetch(`/posts/${postId}/report`, {
    method: 'POST',
    json: { reporterPetId, reason, details },
  });
}
