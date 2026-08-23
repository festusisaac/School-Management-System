import * as Sentry from '@sentry/react-native';

// Crash/error reporting. Disabled in dev so local errors don't pollute the dashboard —
// __DEV__ crashes are visible right in the terminal/Metro anyway.
Sentry.init({
  dsn: 'https://97afb19d9f718a9b39c9eed089abbc61@o4511320904433664.ingest.us.sentry.io/4511959745822720',
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});

export { Sentry };
