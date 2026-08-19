import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost, apiDelete } from '../services/api';
import { navigate } from '../navigation/navigationRef';

const STORAGE_KEY = 'expo_push_token';

// Show notifications while the app is in the foreground too (not just background/killed).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Requests notification permission and returns this device's Expo push token.
 * Returns null on simulators, if permission is denied, or if the app isn't
 * yet linked to an EAS project (no extra.eas.projectId in app.json) — none of
 * these are errors, they just mean push isn't available yet.
 */
async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[Push] Push notifications require a physical device.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('[Push] Notification permission not granted.');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.log('[Push] No EAS project linked yet (extra.eas.projectId missing) — skipping push registration.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#031632',
    });
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (e) {
    console.error('[Push] Failed to get Expo push token', e);
    return null;
  }
}

/** Call after login (and on app start while a session is restored) to register this device. */
export async function syncPushToken(authToken: string): Promise<void> {
  try {
    const expoPushToken = await getExpoPushToken();
    if (!expoPushToken) return;
    await AsyncStorage.setItem(STORAGE_KEY, expoPushToken);
    await apiPost('/notifications/push-tokens', authToken, { token: expoPushToken, platform: Platform.OS });
  } catch (e) {
    console.error('[Push] Failed to register push token', e);
  }
}

/** Call before clearing auth state on logout, so a shared device stops receiving this user's pushes. */
export async function unregisterPushToken(authToken: string): Promise<void> {
  try {
    const expoPushToken = await AsyncStorage.getItem(STORAGE_KEY);
    if (!expoPushToken) return;
    await apiDelete(`/notifications/push-tokens?token=${encodeURIComponent(expoPushToken)}`, authToken);
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('[Push] Failed to unregister push token', e);
  }
}

/** Map a push notification's data payload to a screen to open when tapped. */
export function handleNotificationTap(data: any) {
  switch (data?.type) {
    case 'notice': navigate('Notices'); break;
    case 'homework': navigate('Homework'); break;
    case 'leave': navigate('ApplyLeave'); break;
    case 'result': navigate('Results'); break;
  }
}
