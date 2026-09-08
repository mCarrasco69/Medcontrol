import { createContext } from 'react';
import type { Medicamento } from '../models/medicamento';

interface MedicamentosContextType {
  medicamentos: Medicamento[];
  loading: boolean;
  cargarMedicamentos: () => Promise<void>;
  eliminarMedicamento: (id: number) => Promise<void>;
}

export const MedicamentosContext = createContext<MedicamentosContextType>({
  medicamentos: [],
  loading: true,
  cargarMedicamentos: async () => {},
  eliminarMedicamento: async () => {},
});
