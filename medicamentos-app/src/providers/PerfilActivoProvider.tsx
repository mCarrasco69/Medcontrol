import { useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { PerfilActivoContext } from '../contexts/PerfilActivoContext';
import { getPerfiles } from '../services/api';
import type { Perfil } from '../models/perfil';

const STORAGE_KEY = '@perfil_activo_id';
const USUARIO_ID = 1;

interface PerfilActivoProviderProps {
  children: ReactNode;
}

export default function PerfilActivoProvider({ children }: PerfilActivoProviderProps) {
  const [perfilActivoId, setPerfilActivoIdState] = useState<number | null>(null);
  const [perfilActivo, setPerfilActivoState] = useState<Perfil | null>(null);
  const [cargado, setCargado] = useState(false);

  // Cargar ID guardado al iniciar, o usar el primer perfil disponible
  useEffect(() => {
    (async () => {
      try {
        const guardado = await AsyncStorage.getItem(STORAGE_KEY);
        if (guardado) {
          setPerfilActivoIdState(Number(guardado));
        } else {
          // No hay perfil guardado, cargar el primer perfil disponible
          const { data } = await getPerfiles(USUARIO_ID);
          const perfiles: Perfil[] = data ?? [];
          if (perfiles.length > 0) {
            setPerfilActivoIdState(perfiles[0].id);
            setPerfilActivoState(perfiles[0]);
            await AsyncStorage.setItem(STORAGE_KEY, String(perfiles[0].id));
          }
        }
      } catch (error) {
        console.error('Error al cargar perfil activo:', error);
      } finally {
        setCargado(true);
      }
    })();
  }, []);

  const setPerfilActivo = (perfil: Perfil) => {
    setPerfilActivoState(perfil);
    setPerfilActivoIdState(perfil.id);
    AsyncStorage.setItem(STORAGE_KEY, String(perfil.id)).catch(console.error);
  };

  const setPerfilActivoId = (id: number) => {
    setPerfilActivoIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, String(id)).catch(console.error);
  };

  const clearPerfilActivo = () => {
    setPerfilActivoState(null);
    setPerfilActivoIdState(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
  };

  if (!cargado) {
    return null;
  }

  return (
    <PerfilActivoContext.Provider
      value={{
        perfilActivoId,
        perfilActivo,
        setPerfilActivo,
        setPerfilActivoId,
        clearPerfilActivo,
      }}
    >
      {children}
    </PerfilActivoContext.Provider>
  );
}
