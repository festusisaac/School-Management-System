import * as Updates from 'expo-updates';
import { Alert } from './alert';

/** Check for, download, and offer to apply an OTA update. No-ops in dev or if updates aren't enabled for this build. */
export async function checkForUpdate() {
  if (__DEV__ || !Updates.isEnabled) return;
  try {
    const result = await Updates.checkForUpdateAsync();
    if (!result.isAvailable) return;

    await Updates.fetchUpdateAsync();
    Alert.alert(
      'Update Available',
      'A new version of the app has been downloaded. Restart now to apply it?',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Restart', onPress: () => Updates.reloadAsync() },
      ]
    );
  } catch (e) {
    console.log('[Updates] Check failed', e);
  }
}
