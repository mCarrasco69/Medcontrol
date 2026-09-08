import { createContext } from 'react';
import type { HistorialToma } from '../models/historial';

interface HistorialContextType {
  historial: HistorialToma[];
  loading: boolean;
  cargarHistorial: () => Promise<void>;
}

export const HistorialContext = createContext<HistorialContextType>({
  historial: [],
  loading: true,
  cargarHistorial: async () => {},
});
