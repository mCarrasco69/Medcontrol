import { useCallback, useEffect, useState } from 'react';
import { getProximasTomas, marcarComoTomada } from '../services/api';
import type { HistorialToma } from '../models/historial';

export function useProximasTomas(perfilId: number) {
  const [proximas, setProximas] = useState<HistorialToma[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcando, setMarcando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const response = await getProximasTomas(perfilId);
      setProximas(response.data ?? []);
    } catch (error) {
      console.error('Error al cargar próximas tomas:', error);
    } finally {
      setLoading(false);
    }
  }, [perfilId]);

  const marcarTomada = useCallback(async (historialId: number) => {
    setMarcando(true);
    try {
      await marcarComoTomada(historialId);
      await cargar();
    } catch (error) {
      console.error('Error al marcar como tomada:', error);
    } finally {
      setMarcando(false);
    }
  }, [cargar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { proximas, loading, marcando, cargar, marcarTomada };
}
