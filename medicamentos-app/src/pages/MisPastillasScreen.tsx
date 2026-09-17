import { useMemo, useState } from 'react';
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
import dayjs from 'dayjs';

import { useMedicamentos, useProximasTomas } from '../hooks';
import { usePerfilActivo } from '../contexts/PerfilActivoContext';
import { PillIcon } from '../components';
import { formatHorarios, formatHora } from '../utils';
import { marcarComoTomada } from '../services/api';
import type { HistorialToma } from '../models/historial';
import type { Medicamento } from '../models/medicamento';

function iconoPresentacion(presentacion?: string): string {
  switch (presentacion?.toLowerCase()) {
    case 'cápsula':
    case 'capsula':
      return '💊';
    case 'gotas':
      return '💧';
    case 'aplicación':
    case 'aplicacion':
    case 'inyección':
    case 'inyeccion':
      return '💉';
    case 'jarabe':
    case 'líquido':
    case 'liquido':
      return '🧪';
    case 'tableta':
    default:
      return '💊';
  }
}

function colorPresentacion(presentacion?: string): string {
  switch (presentacion?.toLowerCase()) {
    case 'cápsula':
    case 'capsula':
      return '#dbeafe';
    case 'gotas':
      return '#e0f2fe';
    case 'aplicación':
    case 'aplicacion':
    case 'inyección':
    case 'inyeccion':
      return '#f3e8ff';
    case 'jarabe':
    case 'líquido':
    case 'liquido':
      return '#fef9c3';
    case 'tableta':
    default:
      return '#e6fbf7';
  }
}

function calcularProximaToma(med: Medicamento): string | null {
  if (!med.horarios || med.horarios.length === 0) return null;
  const ahora = dayjs();
  let proxima: dayjs.Dayjs | null = null;
  let minDiff = Infinity;

  for (const h of med.horarios) {
    const horaStr = typeof h === 'string' ? h : h.hora;
    const [hh, mm] = String(horaStr).split(':').map(Number);
    const candidata = dayjs().hour(hh || 0).minute(mm || 0).second(0).millisecond(0);
    const diff = candidata.diff(ahora, 'minute', true);
    const ajustada = diff < 0 ? candidata.add(1, 'day') : candidata;
    const diffAjustada = ajustada.diff(ahora, 'minute');
    if (diffAjustada < minDiff) {
      minDiff = diffAjustada;
      proxima = ajustada;
    }
  }

  if (!proxima) return null;
  const esHoy = proxima.isSame(dayjs(), 'day');
  const label = esHoy ? 'Hoy' : 'Mañana';
  return `${label} ${formatHora(proxima.format('HH:mm:ss'))}`;
}

function calcularProximaTomaConToma(med: Medicamento, toma?: HistorialToma): string | null {
  if (toma && toma.estado === 'pendiente' && toma.fecha_programada) {
    const d = dayjs(toma.fecha_programada);
    const esHoy = d.isSame(dayjs(), 'day');
    return `${esHoy ? 'Hoy' : 'Mañana'} ${formatHora(d.format('HH:mm:ss'))}`;
  }
  return calcularProximaToma(med);
}

export default function MisPastillasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { perfilActivoId, perfilActivo } = usePerfilActivo();
  const perfilId = perfilActivoId ?? 1;
  const { medicamentos, loading, eliminar, cargar: cargarMedicamentos } = useMedicamentos(perfilId);
  const { proximas, loading: cargandoProximas, cargar: cargarProximas } = useProximasTomas(perfilId);
  const [tomandoId, setTomandoId] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const proximasPorMedicamento = useMemo(() => {
    const map = new Map<number, HistorialToma>();
    for (const toma of proximas) {
      if (toma.medicamento_id != null && !map.has(toma.medicamento_id)) {
        map.set(toma.medicamento_id, toma);
      }
    }
    return map;
  }, [proximas]);

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

  const marcarTomadaDesdeCard = async (med: Medicamento) => {
    const toma = proximasPorMedicamento.get(med.id);
    if (!toma) return;
    setTomandoId(med.id);
    try {
      await marcarComoTomada(toma.id);
      await cargarProximas();
      await cargarMedicamentos();
    } catch (error) {
      console.error('Error al marcar toma:', error);
    } finally {
      setTomandoId(null);
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
        <TouchableOpacity
          style={styles.profileSelector}
          onPress={() => router.push('/familia' as never)}
        >
          <View>
            <Text style={styles.profileLabel}>Perfil seleccionado</Text>
            <Text style={styles.profileName}>{perfilActivo?.nombre ?? 'Sin perfil'}</Text>
          </View>
          <Text style={styles.changeProfile}>Cambiar ›</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.agregarBtn}
          onPress={() => router.push('/agregar-medicamento' as never)}
        >
          <Text style={styles.agregarBtnText}>+ Agregar medicamento</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>{medicamentos.length} medicamentos registrados</Text>
      </View>

      {/* 2. Lista de medicamentos */}
      {medicamentos.length === 0 ? (
        <Text style={styles.emptyText}>No hay medicamentos cargados</Text>
      ) : (
        medicamentos.map((med) => {
          const tomaPendiente = proximasPorMedicamento.get(med.id);
          const mostrarTomar =
            !!tomaPendiente &&
            (tomaPendiente.estado !== 'pendiente' ||
              dayjs(tomaPendiente.fecha_programada).diff(dayjs(), 'minute') <= 0);
          const proximaToma = calcularProximaTomaConToma(med, tomaPendiente);
          const estaActivo = med.activo !== false;
          return (
            <TouchableOpacity
              key={med.id}
              style={[
                styles.card,
                !estaActivo && styles.cardInactiva,
              ]}
              onPress={() => router.push(`/editar-medicamento?id=${med.id}` as never)}
              activeOpacity={0.9}
            >
              <View style={styles.cardTop}>
                <View style={[styles.iconoWrap, { backgroundColor: colorPresentacion(med.presentacion) }]}>
                  <Text style={styles.iconoEmoji}>{iconoPresentacion(med.presentacion)}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.medName}>{med.nombre}</Text>
                    <View style={[styles.estadoBadge, { backgroundColor: estaActivo ? '#e6fbf7' : '#f1f5f9' }]}>
                      <Text style={[styles.estadoText, { color: estaActivo ? '#059669' : '#94a3b8' }]}>
                        {estaActivo ? 'Activo' : 'Pausado'}
                      </Text>
                    </View>
                  </View>
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
                {proximaToma ? (
                  <View style={styles.proximaBadge}>
                    <Text style={styles.proximaText}>Próxima: {proximaToma}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.cardActions}>
                {mostrarTomar ? (
                  <TouchableOpacity
                    style={styles.tomarBtn}
                    onPress={() => marcarTomadaDesdeCard(med)}
                    disabled={tomandoId === med.id || cargandoProximas}
                  >
                    {tomandoId === med.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.tomarIcon}>✓</Text>
                        <Text style={styles.tomarLabel}>Tomar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}
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
            </TouchableOpacity>
          );
        })
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
  profileSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbe4ee',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
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
  counter: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 12,
    textAlign: 'center',
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
  cardInactiva: {
    opacity: 0.7,
    borderColor: '#cbd5e1',
  },
  iconoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconoEmoji: {
    fontSize: 22,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  estadoText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
  },
  proximaBadge: {
    marginLeft: 'auto',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  proximaText: {
    fontSize: 11,
    fontFamily: 'Inter-SemiBold',
    color: '#16a34a',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  tomarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 'auto',
  },
  tomarIcon: {
    fontSize: 14,
    color: '#ffffff',
    marginRight: 4,
  },
  tomarLabel: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
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
