import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProximasTomas } from '../hooks';
import { usePerfilActivo } from '../contexts/PerfilActivoContext';
import { calcularTiempoRestante, formatHoraCorta } from '../utils';
import { probarNotificacion } from '../services/notificaciones';
import EstadoBadge from '../components/EstadoBadge';

function frecuenciaEnMinutos(frecuencia?: string) {
  const valor = Number(String(frecuencia || '').match(/\d+/)?.[0]) || 24;
  return /minuto/i.test(frecuencia || '') ? valor : valor * 60;
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { perfilActivoId, perfilActivo } = usePerfilActivo();
  const perfilId = perfilActivoId ?? 1;
  const { proximas, loading, marcando, marcarTomada } = useProximasTomas(perfilId);

  const proxima = proximas.find((p) => p.estado === 'pendiente' || p.estado === 'atrasada');

  const [tiempoRestante, setTiempoRestante] = useState('--:--');
  const [colorContador, setColorContador] = useState({ borde: '#94a3b8', fondo: '#f8fafc' });

  useEffect(() => {
    if (!proxima?.fecha_programada) {
      setTiempoRestante('--:--');
      setColorContador({ borde: '#94a3b8', fondo: '#f8fafc' });
      return;
    }
    const calcular = () => {
      const minutosRestantes = dayjs(proxima.fecha_programada).diff(dayjs(), 'minute', true);
      const duracionIntervalo = frecuenciaEnMinutos(proxima.frecuencia);
      const porcentajeRestante = Math.max(0, Math.min(100, (minutosRestantes / duracionIntervalo) * 100));
      setTiempoRestante(calcularTiempoRestante(proxima.fecha_programada));
      if (porcentajeRestante <= 25) {
        setColorContador({ borde: '#ef4444', fondo: '#fef2f2' });
      } else if (porcentajeRestante <= 60) {
        setColorContador({ borde: '#f59e0b', fondo: '#fffbeb' });
      } else {
        setColorContador({ borde: '#10b981', fondo: '#ecfdf5' });
      }
    };
    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [proxima?.fecha_programada, proxima?.frecuencia]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: 16 + insets.top }]}>
      {/* 1. Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>MediControl</Text>
        <Text style={styles.greeting}>Gestiona tus medicamentos y próximas tomas</Text>
        <TouchableOpacity style={styles.profileSelector} onPress={() => router.push('/familia' as never)}>
          <View>
            <Text style={styles.profileLabel}>Perfil seleccionado</Text>
            <Text style={styles.profileName}>{perfilActivo?.nombre ?? 'Sin perfil'}</Text>
          </View>
          <Text style={styles.changeProfile}>Cambiar ›</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Card hero-intake */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Próxima toma</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Pendiente</Text>
          </View>
        </View>

        <View style={[styles.dial, { borderColor: colorContador.borde, backgroundColor: colorContador.fondo }]}>
          <Text style={styles.dialTime}>{tiempoRestante}</Text>
          <Text style={styles.dialMedName}>
            {proxima?.nombre ?? proxima?.medicamento_nombre ?? proxima?.medicamento?.nombre ?? '—'}
          </Text>
          <Text style={styles.dialDose}>
            {proxima?.dosis ?? proxima?.medicamento_dosis ?? proxima?.medicamento?.dosis ?? ''}{proxima?.unidad ? ` ${proxima.unidad}` : ''} · Cantidad: {proxima?.cantidad ?? proxima?.medicamento?.cantidad ?? 1}
          </Text>
        </View>

      </View>

      {/* 3. Quick actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => router.push('/agregar-medicamento' as never)}
        >
          <Text style={styles.quickIcon}>+</Text>
          <Text style={styles.quickLabel}>Agregar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => router.push('/historial' as never)}
        >
          <Text style={styles.quickIcon}>▤</Text>
          <Text style={styles.quickLabel}>Historial</Text>
        </TouchableOpacity>
      </View>

      {/* Botón de prueba de notificación */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={async () => {
          const id = await probarNotificacion();
          if (id) {
            console.log('Notificación agendada (2s):', id);
          } else {
            console.warn('No se pudo agendar la notificación de prueba');
          }
        }}
      >
        <Text style={styles.testIcon}>🔔</Text>
        <Text style={styles.testText}>Probar notificación (2s)</Text>
      </TouchableOpacity>

      {/* 4. Upcoming section */}
      <View style={styles.upcomingSection}>
        <View style={styles.upcomingHeader}>
          <Text style={styles.sectionTitle}>Próximas</Text>
          <TouchableOpacity onPress={() => router.push('/proximas-tomas' as never)}>
            <Text style={styles.verTodoLink}>ver todo</Text>
          </TouchableOpacity>
        </View>

        {proximas.length === 0 ? (
          <Text style={styles.emptyText}>No hay próximas tomas</Text>
        ) : (
          proximas.map((item) => (
            <View key={item.id} style={styles.upcomingItem}>
              <View style={styles.pillIcon} />
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingName}>
                  {item.nombre ?? item.medicamento_nombre ?? item.medicamento?.nombre ?? '—'}
                </Text>
                <Text style={styles.upcomingDose}>
                  {item.dosis ?? item.medicamento_dosis ?? item.medicamento?.dosis ?? ''}{item.unidad ? ` ${item.unidad}` : ''} · Cantidad: {item.cantidad ?? item.medicamento?.cantidad ?? 1}
                </Text>
                {item.estado === 'omitida' ? <EstadoBadge estado="omitida" /> : null}
              </View>
              <View style={styles.upcomingActions}>
                {item.estado !== 'omitida' ? (
                  <Text style={styles.upcomingTime}>
                    {item.fecha_programada ? formatHoraCorta(item.fecha_programada) : '--:--'}
                  </Text>
                ) : null}
                <TouchableOpacity
                  style={styles.tomarMiniBtn}
                  onPress={() => marcarTomada(item.id)}
                  disabled={marcando}
                >
                  <Text style={styles.tomarMiniText}>{marcando ? '...' : 'Tomar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#edf2f7',
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf2f7',
  },

  /* Header */
  header: {
    marginBottom: 20,
  },
  appTitle: {
    fontSize: 24,
    fontFamily: 'Inter-ExtraBold',
    color: '#1e293b',
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  profileSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe4ee',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  profileLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginTop: 2,
  },
  changeProfile: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10b981',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
  },

  /* Hero card */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  badge: {
    backgroundColor: '#e6fbf7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#059669',
  },
  dial: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 6,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dialTime: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  dialMedName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
    marginTop: 4,
  },
  dialDose: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  tomaActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tomadoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  omitirButton: {
    backgroundColor: '#f59e0b',
  },
  tomadoText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },

  /* Quick actions */
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickIcon: {
    fontSize: 20,
    color: '#10b981',
    marginRight: 8,
  },
  quickLabel: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#1e293b',
  },

  /* Upcoming section */
  upcomingSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 24,
  },
  testIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  testText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  verTodoLink: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10b981',
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  pillIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    marginRight: 12,
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingName: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  upcomingDose: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  upcomingActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  upcomingTime: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10b981',
  },
  tomarMiniBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tomarMiniText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
