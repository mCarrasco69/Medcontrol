import { useCallback, useEffect, useState } from 'react';
import {
  getPerfiles,
  crearPerfil as apiCrear,
  actualizarPerfil as apiActualizar,
  eliminarPerfil as apiEliminar,
} from '../services/api';
import type { Perfil } from '../models/perfil';

export function usePerfiles(usuarioId: number) {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      const response = await getPerfiles(usuarioId);
      setPerfiles(response.data ?? []);
    } catch (error) {
      console.error('Error al cargar perfiles:', error);
    } finally {
      setLoading(false);
    }
  }, [usuarioId]);

  const crear = useCallback(
    async (datos: { nombre: string; relacion?: string | null; fecha_nacimiento?: string | null }) => {
      await apiCrear({ usuario_id: usuarioId, ...datos });
      await cargar();
    },
    [usuarioId, cargar],
  );

  const actualizar = useCallback(
    async (id: number, datos: { nombre: string; relacion?: string | null; fecha_nacimiento?: string | null }) => {
      await apiActualizar(id, datos);
      await cargar();
    },
    [cargar],
  );

  const eliminar = useCallback(
    async (id: number) => {
      await apiEliminar(id);
      await cargar();
    },
    [cargar],
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { perfiles, loading, cargar, crear, actualizar, eliminar };
}
