import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useHistorial } from '../hooks';
import { usePerfilActivo } from '../contexts/PerfilActivoContext';
import { EstadoBadge, PillIcon } from '../components';
import { formatFechaProgramada } from '../utils';

export default function HistorialScreen() {
  const router = useRouter();
  const { perfilActivoId } = usePerfilActivo();
  const perfilId = perfilActivoId ?? 1;
  const { historial, loading } = useHistorial(perfilId);

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
        historial.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <PillIcon size={40} backgroundColor="#e0f2fe" />
              <View style={styles.cardInfo}>
                <Text style={styles.medName}>{item.nombre}</Text>
                <Text style={styles.medDose}>{item.dosis}</Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <View style={styles.fechaRow}>
                <Text style={styles.clockIcon}>⏰</Text>
                <Text style={styles.fechaText}>
                  {formatFechaProgramada(item.fecha_programada)}
                </Text>
              </View>

              <EstadoBadge estado={item.estado} />
            </View>
          </View>
        ))
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
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 32,
  },
});
