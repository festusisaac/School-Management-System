import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Alert } from './alert';
import { getSyncBaseUrl } from '../services/api';

export interface PickedFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * Open the native document picker and return the chosen file(s).
 * Returns an empty array if the user cancels.
 */
export async function pickFiles(multiple = true): Promise<PickedFile[]> {
  const res = await DocumentPicker.getDocumentAsync({
    multiple,
    copyToCacheDirectory: true,
    type: '*/*',
  });
  if (res.canceled) return [];
  return (res.assets || []).map((a) => ({
    uri: a.uri,
    name: a.name || `file-${Date.now()}`,
    type: a.mimeType || 'application/octet-stream',
  }));
}

/**
 * Shape a picked file so React Native's fetch appends it to FormData correctly.
 */
export function toFormFile(file: PickedFile) {
  return { uri: file.uri, name: file.name, type: file.type } as any;
}

const MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  csv: 'text/csv',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  zip: 'application/zip',
};

function mimeFromName(name: string): string {
  const ext = (name.split('.').pop() || '').toLowerCase();
  return MIME[ext] || 'application/octet-stream';
}

function sanitizeFilename(name: string): string {
  return name.replace(/[\/\\?%*:|"<>]/g, '_').slice(0, 120) || `file-${Date.now()}`;
}

function filenameFromDisposition(disposition?: string): string | null {
  if (!disposition) return null;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(disposition);
  if (star && star[1]) {
    try { return decodeURIComponent(star[1].replace(/["']/g, '')); } catch { /* fall through */ }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : null;
}

async function openLocalFile(localUri: string, name: string) {
  const mime = mimeFromName(name);
  if (Platform.OS === 'android') {
    const contentUri = await FileSystem.getContentUriAsync(localUri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: mime,
    });
  } else if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(localUri, { mimeType: mime });
  } else {
    Alert.alert('Downloaded', `Saved "${name}".`);
  }
}

/**
 * Securely download a file from an AUTHENTICATED API endpoint (Bearer token),
 * save it locally with its real filename, and open it in the device's viewer —
 * the "download inside the app" experience. The file is never exposed at a
 * public URL, so it can't be reached by guessing a link.
 *
 * @param endpoint API path (relative to the /api/v1 base), e.g. "/homework/123/attachment"
 */
export async function downloadSecure(endpoint: string, token: string, fallbackName?: string) {
  const url = `${getSyncBaseUrl()}${endpoint}`;
  const tmp = `${FileSystem.cacheDirectory}dl-${Date.now()}`;
  try {
    const result = await FileSystem.downloadAsync(url, tmp, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (result.status && result.status >= 400) {
      await FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => {});
      const msg =
        result.status === 403 ? 'You do not have access to this file.'
        : result.status === 404 ? 'File not found.'
        : `Download failed (${result.status}).`;
      throw new Error(msg);
    }

    const headers: any = result.headers || {};
    const disposition = headers['Content-Disposition'] || headers['content-disposition'];
    const name = sanitizeFilename(filenameFromDisposition(disposition) || fallbackName || `file-${Date.now()}`);
    const dest = `${FileSystem.documentDirectory}${name}`;

    await FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => {});
    await FileSystem.moveAsync({ from: result.uri, to: dest });

    await openLocalFile(dest, name);
  } catch (e: any) {
    Alert.alert('Download failed', e?.message || 'Could not download the file.');
  }
}
