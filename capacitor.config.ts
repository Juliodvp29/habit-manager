import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'habit-manager',
  webDir: 'www',
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
      androidChannelId: 'habits_notifications',
      androidChannelName: 'Habit Notifications',
      androidChannelDescription: 'Notifications for habit reminders',
      androidChannelImportance: 4,
    },
    CapacitorFirebaseMessaging: {
      skipNativeInit: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;