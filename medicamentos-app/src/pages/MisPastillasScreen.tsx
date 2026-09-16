import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMedicamentos } from '../hooks';
import { usePerfilActivo } from '../contexts/PerfilActivoContext';
import { PillIcon } from '../components';
import { formatHorarios } from '../utils';

export default function MisPastillasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { perfilActivoId, perfilActivo } = usePerfilActivo();
  const perfilId = perfilActivoId ?? 1;
  const { medicamentos, loading, eliminar } = useMedicamentos(perfilId);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const abrirModal = (id: number) => {
    setSelectedId(id);
    setModalVisible(true);
  };

  const confirmarEliminar = async () => {
    if (selectedId === null) return;
    setEliminando(true);
    try {
      await eliminar(selectedId);
      setModalVisible(false);
      setSelectedId(null);
    } catch (error) {
      console.error('Error al eliminar medicamento:', error);
    } finally {
      setEliminando(false);
    }
  };

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
        <Text style={styles.title}>Mis medicamentos</Text>
        <Text style={styles.counter}>Perfil seleccionado: {perfilActivo?.nombre ?? 'Sin perfil'}</Text>
        <Text style={styles.counter}>{medicamentos.length} medicamentos registrados</Text>
        <TouchableOpacity
          style={styles.agregarBtn}
          onPress={() => router.push('/agregar-medicamento' as never)}
        >
          <Text style={styles.agregarBtnText}>+ Agregar medicamento</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Lista de medicamentos */}
      {medicamentos.length === 0 ? (
        <Text style={styles.emptyText}>No hay medicamentos cargados</Text>
      ) : (
        medicamentos.map((med) => (
          <View key={med.id} style={styles.card}>
            <View style={styles.cardTop}>
              <PillIcon size={40} backgroundColor="#e6fbf7" />
              <View style={styles.cardInfo}>
                <Text style={styles.medName}>{med.nombre}</Text>
                <Text style={styles.medDose}>
                  {med.dosis}{med.unidad ? ` ${med.unidad}` : ''} · Tomar {med.cantidad ?? 1} {med.presentacion ?? 'unidad'} · {med.frecuencia}
                </Text>
              </View>
            </View>

            {med.notas ? (
              <View style={styles.notasRow}>
                <Text style={styles.notasIcon}>📝</Text>
                <Text style={styles.notasText}>{med.notas}</Text>
              </View>
            ) : null}

            <View style={styles.horarioRow}>
              <Text style={styles.clockIcon}>⏰</Text>
              <Text style={styles.horarioText}>
                {med.horarios && Array.isArray(med.horarios) && med.horarios.length > 0
                  ? formatHorarios(med.horarios)
                  : med.frecuencia ?? '—'}
              </Text>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push(`/editar-medicamento?id=${med.id}` as never)}
              >
                <Text style={styles.actionIcon}>✎</Text>
                <Text style={styles.actionLabel}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => abrirModal(med.id)}
              >
                <Text style={styles.actionIconDelete}>🗑</Text>
                <Text style={styles.actionLabelDelete}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* 3. Modal de confirmación */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.alertIconWrap}>
              <Text style={styles.alertIcon}>!</Text>
            </View>
            <Text style={styles.modalTitle}>Eliminar medicamento</Text>
            <Text style={styles.modalText}>
              ¿Seguro que querés eliminar este medicamento?
            </Text>
            <Text style={styles.modalWarning}>
              Esta acción no se puede deshacer y se perderán los horarios asociados.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
                disabled={eliminando}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={confirmarEliminar}
                disabled={eliminando}
              >
                <Text style={styles.deleteBtnText}>
                  {eliminando ? 'Eliminando...' : 'Eliminar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 24,
    fontFamily: 'Inter-ExtraBold',
    color: '#1e293b',
  },
  counter: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  agregarBtn: {
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 14,
  },
  agregarBtnText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
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
  notasRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notasIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  notasText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    flex: 1,
  },
  horarioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  clockIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  horarioText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  actionIcon: {
    fontSize: 16,
    color: '#10b981',
    marginRight: 4,
  },
  actionLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#10b981',
  },
  actionIconDelete: {
    fontSize: 16,
    marginRight: 4,
  },
  actionLabelDelete: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#ef4444',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  alertIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ef4444',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalWarning: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 32,
  },
});
