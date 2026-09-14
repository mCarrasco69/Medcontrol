import { useCallback, useEffect, useState } from 'react';
import { getMedicamentos, eliminarMedicamento as apiEliminar } from '../services/api';
import { cancelarTodasLasNotificaciones, agendarRecordatoriosMedicamento } from '../services/notificaciones';
import type { Medicamento } from '../models/medicamento';

export function useMedicamentos(perfilId: number) {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const response = await getMedicamentos(perfilId);
      setMedicamentos(response.data ?? []);
    } catch (error) {
      console.error('Error al cargar medicamentos:', error);
    } finally {
      setLoading(false);
    }
  }, [perfilId]);

  const eliminar = useCallback(async (id: number) => {
    await apiEliminar(id);
    // Al eliminar, re-agendar todas las notificaciones (más simple que trackear IDs individuales)
    await cancelarTodasLasNotificaciones();
    await cargar();
    // Re-agendar las notificaciones de los medicamentos restantes
    const response = await getMedicamentos(perfilId);
    const restantes = response.data ?? [];
    for (const med of restantes) {
      await agendarRecordatoriosMedicamento(med);
    }
  }, [cargar, perfilId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { medicamentos, loading, cargar, eliminar };
}
