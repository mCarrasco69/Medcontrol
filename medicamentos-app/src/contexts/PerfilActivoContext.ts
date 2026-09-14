import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Perfil } from '../models/perfil';

const STORAGE_KEY = '@perfil_activo_id';

interface PerfilActivoContextType {
  perfilActivoId: number | null;
  perfilActivo: Perfil | null;
  setPerfilActivo: (perfil: Perfil) => void;
  setPerfilActivoId: (id: number) => void;
  clearPerfilActivo: () => void;
}

export const PerfilActivoContext = createContext<PerfilActivoContextType>({
  perfilActivoId: null,
  perfilActivo: null,
  setPerfilActivo: () => {},
  setPerfilActivoId: () => {},
  clearPerfilActivo: () => {},
});

export function usePerfilActivo() {
  return useContext(PerfilActivoContext);
}
