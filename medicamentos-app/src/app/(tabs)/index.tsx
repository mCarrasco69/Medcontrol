import { useCallback, useEffect, useState } from 'react';
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

import { getProximasTomas, marcarComoTomada } from '../../../services/api';

const PERFIL_ID = 1;

export default function HomeScreen() {
  const router = useRouter();
  const [proximas, setProximas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcando, setMarcando] = useState(false);

  const cargarProximas = useCallback(async () => {
    try {
      const response = await getProximasTomas(PERFIL_ID);
      setProximas(response.data ?? []);
    } catch (error) {
      console.error('Error al cargar próximas tomas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProximas();
  }, [cargarProximas]);

  const proxima = proximas[0];
  const resto = proximas.slice(1);

  const [tiempoRestante, setTiempoRestante] = useState('--:--');

  useEffect(() => {
    if (!proxima?.fecha_programada) {
      setTiempoRestante('--:--');
      return;
    }
    const calcular = () => {
      const diffMs = dayjs(proxima.fecha_programada).diff(dayjs());
      if (diffMs <= 0) {
        setTiempoRestante('00:00');
        return;
      }
      const totalSeg = Math.floor(diffMs / 1000);
      const horas = Math.floor(totalSeg / 3600);
      const mins = Math.floor((totalSeg % 3600) / 60);
      const segs = totalSeg % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      setTiempoRestante(horas > 0 ? `${pad(horas)}:${pad(mins)}:${pad(segs)}` : `${pad(mins)}:${pad(segs)}`);
    };
    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [proxima?.fecha_programada]);

  const tomarDosis = useCallback(async () => {
    if (!proxima) return;
    setMarcando(true);
    try {
      await marcarComoTomada(proxima.id);
      await cargarProximas();
    } catch (error) {
      console.error('Error al marcar como tomada:', error);
    } finally {
      setMarcando(false);
    }
  }, [proxima, cargarProximas]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>MediControl</Text>
          <Text style={styles.greeting}>Hola, Usuario</Text>
        </View>
        <View style={styles.avatar} />
      </View>

      {/* 2. Card hero-intake */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Próxima dosis</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Pendiente</Text>
          </View>
        </View>

        <View style={styles.dial}>
          <Text style={styles.dialTime}>{tiempoRestante}</Text>
          <Text style={styles.dialMedName}>
            {proxima?.medicamento_nombre ?? proxima?.medicamento?.nombre ?? '—'}
          </Text>
          <Text style={styles.dialDose}>
            {proxima?.medicamento_dosis ?? proxima?.medicamento?.dosis ?? proxima?.dosis ?? ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.tomadoButton}
          onPress={tomarDosis}
          disabled={!proxima || marcando}
        >
          <Text style={styles.tomadoIcon}>✓</Text>
          <Text style={styles.tomadoText}>{marcando ? 'Marcando...' : 'Tomado'}</Text>
        </TouchableOpacity>
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

      {/* 4. Upcoming section */}
      <View style={styles.upcomingSection}>
        <View style={styles.upcomingHeader}>
          <Text style={styles.sectionTitle}>Próximas</Text>
          <TouchableOpacity onPress={() => router.push('/historial' as never)}>
            <Text style={styles.verTodoLink}>ver todo</Text>
          </TouchableOpacity>
        </View>

        {resto.length === 0 ? (
          <Text style={styles.emptyText}>No hay próximas tomas</Text>
        ) : (
          resto.map((item) => (
            <View key={item.id} style={styles.upcomingItem}>
              <View style={styles.pillIcon} />
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingName}>
                  {item.medicamento_nombre ?? item.medicamento?.nombre ?? '—'}
                </Text>
                <Text style={styles.upcomingDose}>
                  {item.medicamento_dosis ?? item.medicamento?.dosis ?? item.dosis ?? ''}
                </Text>
              </View>
              <Text style={styles.upcomingTime}>
                {item.fecha_programada ? dayjs(item.fecha_programada).format('HH:mm') : '--:--'}
              </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  tomadoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
  },
  tomadoIcon: {
    fontSize: 18,
    color: '#ffffff',
    marginRight: 8,
  },
  tomadoText: {
    fontSize: 16,
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
  upcomingTime: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10b981',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
