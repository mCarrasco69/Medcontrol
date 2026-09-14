import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import Constants from 'expo-constants';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { PerfilActivoProvider } from '../providers';
import {
  solicitarPermisosNotificaciones,
  configurarCanalNotificaciones,
  configurarNotificationHandler,
} from '../services/notificaciones';

SplashScreen.preventAutoHideAsync();

const isExpoGo = Constants.appOwnership === 'expo';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Inter-ExtraBold': Inter_800ExtraBold,
  });

  // Configurar notificaciones al iniciar (solo fuera de Expo Go)
  useEffect(() => {
    if (Platform.OS === 'web' || isExpoGo) return;

    (async () => {
      try {
        configurarNotificationHandler();
        await configurarCanalNotificaciones();
        await solicitarPermisosNotificaciones();
      } catch (e) {
        console.warn('Notificaciones no disponibles:', e);
      }
    })();

    // Escuchar cuando el usuario toca una notificación
    let subscription: { remove: () => void } | null = null;
    try {
      const Notifications = require('expo-notifications');

      function redirect(notification: any) {
        const url = notification.request.content.data?.url;
        if (typeof url === 'string') {
          router.push(url as never);
        }
      }

      const response = Notifications.getLastNotificationResponse?.();
      if (response?.notification) {
        redirect(response.notification);
      }

      subscription = Notifications.addNotificationResponseReceivedListener(
        (resp: any) => redirect(resp.notification),
      );
    } catch (e) {
      console.warn('Listener de notificaciones no disponible:', e);
    }

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PerfilActivoProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </PerfilActivoProvider>
  );
}
