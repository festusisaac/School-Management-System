import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiGet } from '../services/api';

export interface Notice {
  id: string;
  title: string;
  content: string;
  type?: string;
  priority?: string;
  isSticky?: boolean;
  author?: { firstName?: string; lastName?: string };
  expiresAt?: string;
  createdAt: string;
}

/**
 * Fetch notices for a given audience ('Staff' | 'Students'). Returns [] on
 * permission errors (users without communication:view_notices) rather than
 * throwing.
 */
export async function fetchNotices(token: string, audience: 'Staff' | 'Students' = 'Staff'): Promise<Notice[]> {
  try {
    const data = await apiGet(`/communication/notices?audience=${audience}`, token);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Convenience wrapper for staff-audience notices. */
export function fetchStaffNotices(token: string): Promise<Notice[]> {
  return fetchNotices(token, 'Staff');
}

/** Strip HTML tags/entities from web-authored notice content for plain display. */
export function stripHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<\/(p|div|h[1-6]|li|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// "read" = user opened the Notices list (clears the bell badge).
const seenKey = (userId: string, noticeId: string) => `notice_seen_${userId}_${noticeId}`;
// "popped" = the one-time popup was already shown (so it doesn't re-appear),
// kept separate so a notice can be popped yet still count as unread on the bell.
const poppedKey = (userId: string, noticeId: string) => `notice_popped_${userId}_${noticeId}`;

export async function isNoticeSeen(userId: string, noticeId: string): Promise<boolean> {
  const v = await AsyncStorage.getItem(seenKey(userId, noticeId));
  return !!v;
}

export async function markNoticeSeen(userId: string, noticeId: string): Promise<void> {
  await AsyncStorage.setItem(seenKey(userId, noticeId), new Date().toISOString());
}

export async function isNoticePopped(userId: string, noticeId: string): Promise<boolean> {
  const v = await AsyncStorage.getItem(poppedKey(userId, noticeId));
  return !!v;
}

export async function markNoticePopped(userId: string, noticeId: string): Promise<void> {
  await AsyncStorage.setItem(poppedKey(userId, noticeId), new Date().toISOString());
}
