import { StyleSheet, Text, View } from 'react-native';
import type { EstadoToma } from '../models/historial';

interface EstadoBadgeProps {
  estado: EstadoToma;
}

const ESTILOS_ESTADO: Record<EstadoToma, { bg: string; text: string; label: string }> = {
  pendiente: { bg: '#fef3c7', text: '#64748b', label: 'Pendiente' },
  tomada: { bg: '#e6fbf7', text: '#059669', label: 'Tomada' },
  omitida: { bg: '#e2e8f0', text: '#94a3b8', label: 'Omitida' },
  atrasada: { bg: '#fee2e2', text: '#dc2626', label: 'Atrasada' },
};

export default function EstadoBadge({ estado }: EstadoBadgeProps) {
  const estilo = ESTILOS_ESTADO[estado] ?? ESTILOS_ESTADO.pendiente;
  return (
    <View style={[styles.badge, { backgroundColor: estilo.bg }]}>
      <Text style={[styles.text, { color: estilo.text }]}>{estilo.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  text: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
  },
});
