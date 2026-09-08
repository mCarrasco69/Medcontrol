import { useCallback, useEffect, useState } from 'react';
import { getHistorial } from '../services/api';
import type { HistorialToma } from '../models/historial';

export function useHistorial(perfilId: number) {
  const [historial, setHistorial] = useState<HistorialToma[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const response = await getHistorial(perfilId);
      setHistorial(response.data ?? []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  }, [perfilId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { historial, loading, cargar };
}
