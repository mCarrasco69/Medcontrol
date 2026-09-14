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

import { getMedicamentoById, actualizarMedicamento } from '../services/api';

const FRECUENCIAS = ['Cada 8 horas', 'Cada 12 horas', 'Cada 24 horas', 'Cada 6 horas', 'Una vez al día'];

type FormData = {
  nombre: string;
  dosis: string;
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
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { control, handleSubmit, setValue, reset, watch } = useForm<FormData>({
    defaultValues: {
      nombre: '',
      dosis: '',
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
        reset({
          nombre: data.nombre ?? '',
          dosis: data.dosis ?? '',
          frecuencia: data.frecuencia ?? '',
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
        frecuencia: data.frecuencia,
        duracion_dias: data.duracion_dias ? Number(data.duracion_dias) : null,
        notas: data.notas || null,
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.form}
        contentContainerStyle={[styles.formContent, { paddingTop: 16 + insets.top }]}
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
                placeholder="Ej: 500mg"
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        {/* 3. Frecuencia (dropdown) */}
        <Text style={styles.label}>Frecuencia</Text>
        <Controller
          control={control}
          name="frecuencia"
          rules={{ required: 'Este campo es obligatorio' }}
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View>
              <TouchableOpacity
                style={[styles.dropdown, error && styles.inputError]}
                onPress={() => setDropdownOpen(!dropdownOpen)}
              >
                <Text style={value ? styles.dropdownText : styles.dropdownPlaceholder}>
                  {value || 'Seleccioná una frecuencia'}
                </Text>
                <Text style={styles.dropdownArrow}>{dropdownOpen ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {error && <Text style={styles.errorText}>{error.message}</Text>}

              {dropdownOpen && (
                <View style={styles.dropdownList}>
                  {FRECUENCIAS.map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={styles.dropdownItem}
                      onPress={() => {
                        onChange(freq);
                        setDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{freq}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        />

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
