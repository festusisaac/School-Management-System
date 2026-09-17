module.exports = {
  Expo: class Expo {
    static isExpoPushToken() { return true; }
    sendPushNotificationsAsync() { return Promise.resolve([]); }
    chunkPushNotifications(msgs) { return [msgs]; }
  },
  ExpoPushMessage: {}
};
