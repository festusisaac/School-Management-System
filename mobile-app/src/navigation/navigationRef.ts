import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * A navigation ref usable outside the component tree (e.g. from a push
 * notification tap handler that fires before any screen has mounted).
 */
export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: object) {
  if (!navigationRef.isReady()) return;
  try {
    // @ts-expect-error - generic cross-stack navigation; screen names vary per role.
    navigationRef.navigate(name, params);
  } catch (e) {
    console.warn(`[Push] Could not navigate to "${name}"`, e);
  }
}
