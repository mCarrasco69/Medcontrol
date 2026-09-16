import { Platform } from 'react-native';
import Constants from 'expo-constants';

const CHANNEL_ID = 'recordatorios-tomas-v2';

// Detectar si estamos en Expo Go (las push notifications no funcionan ahí)
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

// Obtener el módulo de notificaciones de forma lazy
// Solo se usa fuera de Expo Go (development build o standalone)
function getNotifications(): any {
  if (Platform.OS === 'web') return null;
  if (isExpoGo()) return null;
  try {
    return require('expo-notifications');
  } catch {
    return null;
  }
}

// Configurar cómo se muestran las notificaciones cuando la app está en primer plano
export function configurarNotificationHandler() {
  if (Platform.OS === 'web') return;
  if (isExpoGo()) return;
  try {
    const Notifications = getNotifications();
    if (!Notifications) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('No se pudo configurar notification handler:', e);
  }
}

// Solicitar permisos de notificaciones
export async function solicitarPermisosNotificaciones(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (isExpoGo()) return false;
  try {
    const Notifications = getNotifications();
    if (!Notifications) return false;
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (e) {
    console.warn('No se pudieron solicitar permisos de notificaciones:', e);
    return false;
  }
}

// Crear canal de notificaciones en Android
export async function configurarCanalNotificaciones() {
  if (Platform.OS !== 'android') return;
  if (isExpoGo()) return;
  try {
    const Notifications = getNotifications();
    if (!Notifications) return;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Recordatorios de tomas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
      lockScreenVisibility: Notifications.AndroidImportance.PUBLIC,
      bypassDnd: true,
      showBadge: true,
    });
  } catch (e) {
    console.warn('No se pudo configurar canal de notificaciones:', e);
  }
}

// Disparar una notificación inmediata (para pruebas/demo)
export async function probarNotificacion(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (isExpoGo()) {
    console.warn('Las notificaciones no funcionan en Expo Go. Usa un dev build.');
    return null;
  }
  try {
    const Notifications = getNotifications();
    if (!Notifications) return null;
    const permitido = await solicitarPermisosNotificaciones();
    if (!permitido) {
      console.warn('Permiso de notificaciones no concedido');
      return null;
    }
    await configurarCanalNotificaciones();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recordatorio de prueba 💊',
        body: 'Si ves esto, las notificaciones funcionan correctamente.',
        data: { url: '/mis-pastillas' },
        sound: true,
        channelId: CHANNEL_ID,
      },
      trigger: null,
    });
    return id;
  } catch (e) {
    console.warn('No se pudo disparar notificación de prueba:', e);
    return null;
  }
}

// Agendar una notificación diaria para un horario específico
export async function agendarRecordatorioToma(params: {
  medicamentoId: number;
  nombre: string;
  dosis: string;
  unidad?: string | null;
  presentacion?: string;
  cantidad: number;
  hora: string; // formato "HH:mm"
}): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (isExpoGo()) return null;
  try {
    const Notifications = getNotifications();
    if (!Notifications) return null;
    const { medicamentoId, nombre, dosis, unidad, presentacion, cantidad, hora } = params;
    const [hh, mm] = hora.split(':').map(Number);

    const trigger = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: hh,
      minute: mm,
      repeats: true,
    };

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de tomar tu medicamento 💊',
        body: `${nombre} · ${dosis}${unidad ? ` ${unidad}` : ''} · Tomar ${cantidad} ${presentacion ?? 'unidad'}`,
        data: { medicamentoId, hora, url: '/mis-pastillas' },
        sound: true,
        channelId: CHANNEL_ID,
      },
      trigger,
    });
    return id;
  } catch (e) {
    console.warn('No se pudo agendar notificación:', e);
    return null;
  }
}

// Cancelar todas las notificaciones agendadas
export async function cancelarTodasLasNotificaciones(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (isExpoGo()) return;
  try {
    const Notifications = getNotifications();
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('No se pudieron cancelar notificaciones:', e);
  }
}

// Cancelar una notificación específica por ID
export async function cancelarNotificacion(id: string): Promise<void> {
  if (Platform.OS === 'web') return;
  if (isExpoGo()) return;
  try {
    const Notifications = getNotifications();
    if (!Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (e) {
    console.warn('No se pudo cancelar notificación:', e);
  }
}

// Agendar recordatorios para todos los horarios de un medicamento
export async function agendarRecordatoriosMedicamento(medicamento: {
  id: number;
  nombre: string;
  dosis: string;
  unidad?: string | null;
  presentacion?: string;
  cantidad: number;
  horarios: Array<string | { hora: string }>;
}): Promise<string[]> {
  const ids: string[] = [];
  if (!medicamento.horarios || medicamento.horarios.length === 0) return ids;

  for (const h of medicamento.horarios) {
    const horaStr = typeof h === 'string' ? h.slice(0, 5) : h.hora.slice(0, 5);
    const id = await agendarRecordatorioToma({
      medicamentoId: medicamento.id,
      nombre: medicamento.nombre,
      dosis: medicamento.dosis,
      unidad: medicamento.unidad,
      presentacion: medicamento.presentacion,
      cantidad: medicamento.cantidad,
      hora: horaStr,
    });
    if (id) ids.push(id);
  }
  return ids;
}

// Obtener todas las notificaciones agendadas
export async function obtenerNotificacionesAgendadas() {
  if (Platform.OS === 'web') return [];
  if (isExpoGo()) return [];
  try {
    const Notifications = getNotifications();
    if (!Notifications) return [];
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('No se pudieron obtener notificaciones agendadas:', e);
    return [];
  }
}
