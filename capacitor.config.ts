import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'habit-manager',
  webDir: 'www',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
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
  },
  server: {
    url: 'https://caprifoliaceous-rowen-wolfishly.ngrok-free.dev',
    cleartext: true
  }
};

export default config;