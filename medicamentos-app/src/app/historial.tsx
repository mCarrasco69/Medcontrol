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

import { getHistorial } from '../../services/api';

const PERFIL_ID = 1;

const ESTILOS_ESTADO = {
  pendiente: { bg: '#fef3c7', text: '#64748b', label: 'Pendiente' },
  tomada: { bg: '#e6fbf7', text: '#059669', label: 'Tomada' },
  omitida: { bg: '#e2e8f0', text: '#94a3b8', label: 'Omitida' },
};

export default function HistorialScreen() {
  const router = useRouter();
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarHistorial = useCallback(async () => {
    try {
      const response = await getHistorial(PERFIL_ID);
      setHistorial(response.data ?? []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historial</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Lista */}
      {historial.length === 0 ? (
        <Text style={styles.emptyText}>No hay registros en el historial</Text>
      ) : (
        historial.map((item) => {
          const estado = ESTILOS_ESTADO[item.estado as keyof typeof ESTILOS_ESTADO] ?? ESTILOS_ESTADO.pendiente;
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.pillIcon} />
                <View style={styles.cardInfo}>
                  <Text style={styles.medName}>{item.nombre}</Text>
                  <Text style={styles.medDose}>{item.dosis}</Text>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.fechaRow}>
                  <Text style={styles.clockIcon}>⏰</Text>
                  <Text style={styles.fechaText}>
                    {item.fecha_programada
                      ? dayjs(item.fecha_programada).format('DD/MM/YYYY HH:mm')
                      : '—'}
                  </Text>
                </View>

                <View style={[styles.estadoBadge, { backgroundColor: estado.bg }]}>
                  <Text style={[styles.estadoText, { color: estado.text }]}>{estado.label}</Text>
                </View>
              </View>
            </View>
          );
        })
      )}
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
    marginBottom: 20,
  },
  backIcon: {
    fontSize: 22,
    color: '#10b981',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
  },
  headerSpacer: {
    width: 22,
  },

  /* Card */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pillIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  medDose: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  fechaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clockIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  fechaText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  estadoText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 32,
  },
});
