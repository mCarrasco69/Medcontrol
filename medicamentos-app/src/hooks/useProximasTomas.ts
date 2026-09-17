import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getProximasTomas, marcarComoOmitida, marcarComoTomada } from '../services/api';
import type { HistorialToma } from '../models/historial';

export function useProximasTomas(perfilId: number) {
  const [proximas, setProximas] = useState<HistorialToma[]>([]);
  const [loading, setLoading] = useState(true);
  const [marcando, setMarcando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
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

  const marcarOmitida = useCallback(async (historialId: number) => {
    setMarcando(true);
    try {
      await marcarComoOmitida(historialId);
      await cargar();
    } finally {
      setMarcando(false);
    }
  }, [cargar]);

  useEffect(() => {
    setProximas([]);
    cargar();
  }, [perfilId, cargar]);

  useFocusEffect(
    useCallback(() => {
      setProximas([]);
      cargar();
    }, [cargar])
  );

  return { proximas, loading, marcando, cargar, marcarTomada, marcarOmitida };
}
