import type { CapacitorConfig } from '@capacitor/cli';

// Android-приложение (APK) из той же веб-сборки dist/
const config: CapacitorConfig = {
  appId: 'com.smartcalc.app',
  appName: 'SmartCalc',
  webDir: 'dist',
  android: {
    backgroundColor: '#171717',
  },
};

export default config;
