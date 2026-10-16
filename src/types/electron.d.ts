export {};

declare global {
  interface Window {
    electronAPI?: {
      setAlwaysOnTop: (value: boolean) => Promise<boolean>;
      setTheme: (theme: 'light' | 'dark') => void;
      minimize: () => void;
      close: () => void;
      platform: string;
    };
    // Мост Capacitor в Android-сборке
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}
