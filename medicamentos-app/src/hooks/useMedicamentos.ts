import { useCallback, useEffect, useState } from 'react';
import { getMedicamentos, eliminarMedicamento as apiEliminar } from '../services/api';
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
    await cargar();
  }, [cargar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { medicamentos, loading, cargar, eliminar };
}
