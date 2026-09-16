import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';

import { getMedicamentoById, actualizarMedicamento } from '../services/api';

const FRECUENCIAS_RAPIDAS = [1, 2, 3, 4, 6, 8, 12, 24];
const UNIDADES = ['mg', 'g', 'ml', 'mcg', 'UI'];
const PRESENTACIONES = ['tableta', 'cápsula', 'gotas', 'aplicación'];

// Extrae el número de horas de un string como "Cada 8 horas" → "8"
function extraerHoras(frecuencia: string | undefined): string {
  if (!frecuencia) return '';
  const match = frecuencia.match(/(\d+)/);
  return match ? match[1] : '';
}

type FormData = {
  nombre: string;
  dosis: string;
  unidad: string;
  presentacion: string;
  cantidad: string;
  frecuencia: string;
  duracion_dias: string;
  notas: string;
};

export default function EditarMedicamentoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const medicamentoId = Number(id);

  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [horaPrimeraToma, setHoraPrimeraToma] = useState(new Date());
  const [mostrarHora, setMostrarHora] = useState(false);

  const { control, handleSubmit, setValue, reset, watch } = useForm<FormData>({
    defaultValues: {
      nombre: '',
      dosis: '',
      unidad: 'mg',
      presentacion: 'tableta',
      cantidad: '1',
      frecuencia: '',
      duracion_dias: '',
      notas: '',
    },
  });

  const frecuenciaValue = watch('frecuencia');

  useEffect(() => {
    if (!medicamentoId) return;
    (async () => {
      try {
        const { data } = await getMedicamentoById(medicamentoId);
        const horario = data.horarios?.[0]?.hora;
        if (horario) {
          const [hh, mm] = String(horario).split(':').map(Number);
          const fechaHora = new Date();
          fechaHora.setHours(hh || 0, mm || 0, 0, 0);
          setHoraPrimeraToma(fechaHora);
        }
        reset({
          nombre: data.nombre ?? '',
          dosis: data.dosis ?? '',
          unidad: data.unidad ?? 'mg',
          presentacion: data.presentacion ?? 'tableta',
          cantidad: data.cantidad != null ? String(data.cantidad) : '1',
          frecuencia: extraerHoras(data.frecuencia),
          duracion_dias: data.duracion_dias != null ? String(data.duracion_dias) : '',
          notas: data.notas ?? '',
        });
      } catch (error) {
        console.error('Error al cargar medicamento:', error);
      } finally {
        setCargando(false);
      }
    })();
  }, [medicamentoId, reset]);

  const onSubmit = async (data: FormData) => {
    setGuardando(true);
    try {
      await actualizarMedicamento(medicamentoId, {
        nombre: data.nombre,
        dosis: data.dosis,
        unidad: data.unidad,
        presentacion: data.presentacion,
        cantidad: data.cantidad ? Number(data.cantidad) : 1,
        frecuencia: `Cada ${data.frecuencia} horas`,
        duracion_dias: data.duracion_dias ? Number(data.duracion_dias) : null,
        notas: data.notas || null,
        horarios: [String(horaPrimeraToma.getHours()).padStart(2, '0') + ':' + String(horaPrimeraToma.getMinutes()).padStart(2, '0')],
      });
      router.push('/mis-pastillas' as never);
    } catch (error) {
      console.error('Error al actualizar medicamento:', error);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        style={styles.form}
        contentContainerStyle={[styles.formContent, { paddingTop: 16 + insets.top }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar medicamento</Text>
        <View style={styles.headerSpacer} />
      </View>
        {/* 1. Nombre */}
        <Text style={styles.label}>Nombre</Text>
        <Controller
          control={control}
          name="nombre"
          rules={{ required: 'Este campo es obligatorio' }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Nombre del medicamento"
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        {/* 2. Dosis */}
        <Text style={styles.label}>Dosis</Text>
        <Controller
          control={control}
          name="dosis"
          rules={{ required: 'Este campo es obligatorio' }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View>
              <TextInput
                style={[styles.input, error && styles.inputError]}
                value={value}
                onChangeText={onChange}
                placeholder="Ej: 500"
                keyboardType="numeric"
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <Text style={styles.label}>Unidad de dosis</Text>
        <Controller
          control={control}
          name="unidad"
          render={({ field: { onChange, value } }) => (
            <View style={styles.frecuenciaChips}>
              {UNIDADES.map((unidad) => (
                <TouchableOpacity key={unidad} style={[styles.chip, value === unidad && styles.chipActive]} onPress={() => onChange(unidad)}>
                  <Text style={[styles.chipText, value === unidad && styles.chipTextActive]}>{unidad}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />

        <Text style={styles.label}>Presentación</Text>
        <Controller
          control={control}
          name="presentacion"
          render={({ field: { onChange, value } }) => (
            <View style={styles.frecuenciaChips}>
              {PRESENTACIONES.map((presentacion) => (
                <TouchableOpacity key={presentacion} style={[styles.chip, value === presentacion && styles.chipActive]} onPress={() => onChange(presentacion)}>
                  <Text style={[styles.chipText, value === presentacion && styles.chipTextActive]}>{presentacion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />

        {/* 2.5 Cantidad (compuestos a tomar) */}
        <Text style={styles.label}>Cantidad a tomar</Text>
        <Controller
          control={control}
          name="cantidad"
          rules={{
            required: 'Este campo es obligatorio',
            validate: (v) => {
              const n = Number(v);
              if (isNaN(n) || n < 1 || n > 50) return 'Ingresa entre 1 y 50';
              return true;
            },
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View>
              <View style={styles.frecuenciaRow}>
                <TextInput
                  style={[styles.frecuenciaInput, error && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ej: 1"
                  keyboardType="numeric"
                />
                <Text style={styles.frecuenciaLabel}>unidades</Text>
              </View>
              {error && <Text style={styles.errorText}>{error.message}</Text>}

              <View style={styles.frecuenciaChips}>
                {[1, 2, 3, 4, 5].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.chip,
                      value === String(c) && styles.chipActive,
                    ]}
                    onPress={() => onChange(String(c))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        value === String(c) && styles.chipTextActive,
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />

        {/* 3. Frecuencia (horas entre tomas) */}
        <Text style={styles.label}>Horas entre cada toma</Text>
        <Controller
          control={control}
          name="frecuencia"
          rules={{
            required: 'Este campo es obligatorio',
            validate: (v) => {
              const n = Number(v);
              if (isNaN(n) || n < 1 || n > 72) return 'Ingresa entre 1 y 72 horas';
              return true;
            },
          }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View>
              <View style={styles.frecuenciaRow}>
                <TextInput
                  style={[styles.frecuenciaInput, error && styles.inputError]}
                  value={value}
                  onChangeText={onChange}
                  placeholder="Ej: 8"
                  keyboardType="numeric"
                />
                <Text style={styles.frecuenciaLabel}>horas</Text>
              </View>
              {error && <Text style={styles.errorText}>{error.message}</Text>}

              {/* Botones rápidos */}
              <View style={styles.frecuenciaChips}>
                {FRECUENCIAS_RAPIDAS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.chip,
                      value === String(h) && styles.chipActive,
                    ]}
                    onPress={() => onChange(String(h))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        value === String(h) && styles.chipTextActive,
                      ]}
                    >
                      {h}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />

        <Text style={styles.label}>Hora de la primera toma</Text>
        <TouchableOpacity style={styles.input} onPress={() => setMostrarHora(true)}>
          <Text>{String(horaPrimeraToma.getHours()).padStart(2, '0')}:{String(horaPrimeraToma.getMinutes()).padStart(2, '0')}</Text>
        </TouchableOpacity>
        {mostrarHora && (
          <DateTimePicker
            value={horaPrimeraToma}
            mode="time"
            is24Hour
            onChange={(_, fecha) => {
              setMostrarHora(Platform.OS === 'ios');
              if (fecha) setHoraPrimeraToma(fecha);
            }}
          />
        )}

        {/* 4. Duración en días (opcional) */}
        <Text style={styles.label}>Duración en días (opcional)</Text>
        <Controller
          control={control}
          name="duracion_dias"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={onChange}
              placeholder="Ej: 7"
              keyboardType="numeric"
            />
          )}
        />

        {/* 5. Notas (opcional) */}
        <Text style={styles.label}>Notas (opcional)</Text>
        <Controller
          control={control}
          name="notas"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea]}
              value={value}
              onChangeText={onChange}
              placeholder="Notas adicionales"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          )}
        />

        {/* Botón Guardar */}
        <TouchableOpacity
          style={styles.guardarBtn}
          onPress={handleSubmit(onSubmit)}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.guardarIcon}>✓</Text>
              <Text style={styles.guardarText}>Guardar cambios</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#edf2f7',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#edf2f7',
  },
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
  form: {
    flex: 1,
  },
  formContent: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#64748b',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
  },
  textArea: {
    minHeight: 80,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#ef4444',
    marginTop: 4,
    marginBottom: 2,
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  frecuenciaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frecuenciaInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#1e293b',
    marginRight: 8,
  },
  frecuenciaLabel: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  frecuenciaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  chipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  guardarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
  },
  guardarIcon: {
    fontSize: 18,
    color: '#ffffff',
    marginRight: 8,
  },
  guardarText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});
