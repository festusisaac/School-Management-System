import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { useAuthStore } from './src/store/authStore';
import { syncPushToken, handleNotificationTap } from './src/utils/pushNotifications';
import { AlertHost } from './src/utils/alert';
import { checkForUpdate } from './src/utils/otaUpdates';
import { Sentry } from './src/utils/sentry';

function App() {
  const { loadFromStorage, user } = useAuthStore();
  const notificationListener = useRef<Notifications.Subscription>();

  // On app start, try to restore persisted login session
  useEffect(() => {
    loadFromStorage();
  }, []);

  // Check for an OTA update on cold start and every time the app returns to the
  // foreground — so a published fix reaches an already-installed app within
  // minutes instead of waiting for someone to happen to relaunch it.
  useEffect(() => {
    checkForUpdate();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkForUpdate();
    });
    return () => sub.remove();
  }, []);

  // Register this device for push notifications whenever a user is logged in
  // (fresh login, or a restored session on app start).
  useEffect(() => {
    if (user?.token) syncPushToken(user.token);
  }, [user?.token]);

  // Handle tapping a notification — whether the app was already open, backgrounded, or
  // launched fresh from a killed state by tapping the notification.
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleNotificationTap(response.notification.request.content.data);
    });

    notificationListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationTap(response.notification.request.content.data);
    });

    return () => {
      notificationListener.current?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0f172a" />
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
      <AlertHost />
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);
