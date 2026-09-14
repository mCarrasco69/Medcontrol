import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';

import { usePerfiles } from '../hooks';
import { usePerfilActivo } from '../contexts/PerfilActivoContext';
import { PillIcon } from '../components';

const USUARIO_ID = 1;

const RELACIONES = ['Yo', 'Madre', 'Padre', 'Hijo/a', 'Esposo/a', 'Hermano/a', 'Mascota', 'Otro'];

type ModoModal = 'crear' | 'editar' | 'eliminar' | null;

export default function FamiliaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { perfiles, loading, crear, actualizar, eliminar } = usePerfiles(USUARIO_ID);
  const { setPerfilActivo } = usePerfilActivo();

  const [modalVisible, setModalVisible] = useState(false);
  const [modo, setModo] = useState<ModoModal>(null);
  const [selectedPerfil, setSelectedPerfil] = useState<number | null>(null);

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [relacion, setRelacion] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fechaDate, setFechaDate] = useState<Date | null>(null);

  const abrirCrear = () => {
    setModo('crear');
    setNombre('');
    setRelacion('');
    setFechaNacimiento('');
    setFechaDate(null);
    setShowDatePicker(false);
    setDropdownOpen(false);
    setSelectedPerfil(null);
    setModalVisible(true);
  };

  const abrirEditar = (perfil: (typeof perfiles)[number]) => {
    setModo('editar');
    setNombre(perfil.nombre);
    setRelacion(perfil.relacion ?? '');
    // Convertir fecha ISO a YYYY-MM-DD para que el backend la acepte
    const fechaRaw = perfil.fecha_nacimiento ?? '';
    setFechaNacimiento(fechaRaw ? dayjs(fechaRaw).format('YYYY-MM-DD') : '');
    setFechaDate(perfil.fecha_nacimiento ? new Date(perfil.fecha_nacimiento) : null);
    setShowDatePicker(false);
    setDropdownOpen(false);
    setSelectedPerfil(perfil.id);
    setModalVisible(true);
  };

  const abrirEliminar = (id: number) => {
    setModo('eliminar');
    setSelectedPerfil(id);
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setModo(null);
    setSelectedPerfil(null);
  };

  const handleGuardar = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    try {
      const datos = {
        nombre: nombre.trim(),
        relacion: relacion || null,
        fecha_nacimiento: fechaNacimiento || null,
      };
      if (modo === 'crear') {
        await crear(datos);
      } else if (modo === 'editar' && selectedPerfil !== null) {
        await actualizar(selectedPerfil, datos);
      }
      cerrarModal();
    } catch (error) {
      console.error('Error al guardar perfil:', error);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (selectedPerfil === null) return;
    setGuardando(true);
    try {
      await eliminar(selectedPerfil);
      cerrarModal();
    } catch (error) {
      console.error('Error al eliminar perfil:', error);
    } finally {
      setGuardando(false);
    }
  };

  const verPastillas = (perfil: (typeof perfiles)[number]) => {
    setPerfilActivo(perfil);
    router.push(`/perfil-detalle?id=${perfil.id}` as never);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: 16 + insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Familia</Text>
          <Text style={styles.counter}>{perfiles.length} miembros</Text>
        </View>
        <TouchableOpacity style={styles.agregarBtn} onPress={abrirCrear}>
          <Text style={styles.agregarBtnText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de perfiles */}
      {perfiles.length === 0 ? (
        <Text style={styles.emptyText}>No hay miembros cargados</Text>
      ) : (
        perfiles.map((perfil) => (
          <View key={perfil.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardTop}
              onPress={() => verPastillas(perfil)}
              activeOpacity={0.7}
            >
              <PillIcon size={44} backgroundColor="#e0f2fe" />
              <View style={styles.cardInfo}>
                <Text style={styles.perfilName}>{perfil.nombre}</Text>
                {perfil.relacion ? (
                  <Text style={styles.perfilRelacion}>{perfil.relacion}</Text>
                ) : null}
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => abrirEditar(perfil)}
              >
                <Text style={styles.actionIcon}>✎</Text>
                <Text style={styles.actionLabel}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => abrirEliminar(perfil.id)}
              >
                <Text style={styles.actionIconDelete}>🗑</Text>
                <Text style={styles.actionLabelDelete}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {modo === 'eliminar' ? (
              <>
                <View style={styles.alertIconWrap}>
                  <Text style={styles.alertIcon}>!</Text>
                </View>
                <Text style={styles.modalTitle}>Eliminar perfil</Text>
                <Text style={styles.modalText}>
                  ¿Seguro que querés eliminar este perfil?
                </Text>
                <Text style={styles.modalWarning}>
                  Se perderán los medicamentos y horarios asociados.
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={cerrarModal}
                    disabled={guardando}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleEliminar}
                    disabled={guardando}
                  >
                    <Text style={styles.deleteBtnText}>
                      {guardando ? 'Eliminando...' : 'Eliminar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>
                  {modo === 'crear' ? 'Nuevo miembro' : 'Editar miembro'}
                </Text>

                {/* Nombre */}
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Nombre del miembro"
                />

                {/* Relación (dropdown) */}
                <Text style={styles.label}>Relación</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setDropdownOpen(!dropdownOpen)}
                >
                  <Text
                    style={relacion ? styles.dropdownText : styles.dropdownPlaceholder}
                  >
                    {relacion || 'Seleccioná una relación'}
                  </Text>
                  <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {dropdownOpen && (
                  <View style={styles.dropdownList}>
                    {RELACIONES.map((rel) => (
                      <TouchableOpacity
                        key={rel}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setRelacion(rel);
                          setDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{rel}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Fecha de nacimiento */}
                <Text style={styles.label}>Fecha de nacimiento (opcional)</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text
                    style={
                      fechaNacimiento
                        ? styles.dateText
                        : styles.dropdownPlaceholder
                    }
                  >
                    {fechaNacimiento
                      ? dayjs(fechaNacimiento).format('DD/MM/YYYY')
                      : 'Seleccioná una fecha'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={fechaDate ?? new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onValueChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setFechaDate(selectedDate);
                        setFechaNacimiento(dayjs(selectedDate).format('YYYY-MM-DD'));
                      }
                      // En Android, cerrar el picker después de seleccionar
                      if (Platform.OS === 'android') {
                        setShowDatePicker(false);
                      }
                    }}
                    onDismiss={() => setShowDatePicker(false)}
                  />
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={cerrarModal}
                    disabled={guardando}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.guardarBtn}
                    onPress={handleGuardar}
                    disabled={guardando || !nombre.trim()}
                  >
                    <Text style={styles.guardarBtnText}>
                      {guardando ? 'Guardando...' : 'Guardar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  agregarBtnText: {
    fontSize: 14,
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
    marginLeft: 12,
  },
  perfilName: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: '#1e293b',
  },
  perfilRelacion: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#cbd5e1',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
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
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 32,
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
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1e293b',
    marginBottom: 16,
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
    alignSelf: 'center',
  },
  alertIcon: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#ef4444',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  dateText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  dropdown: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  dropdownPlaceholder: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#94a3b8',
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dropdownItemText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 20,
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
  guardarBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  guardarBtnText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
