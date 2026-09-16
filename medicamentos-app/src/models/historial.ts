export type EstadoToma = 'pendiente' | 'tomada' | 'omitida' | 'atrasada';

export interface HistorialToma {
  id: number;
  medicamento_id: number;
  perfil_id: number;
  fecha_programada: string;
  fecha_tomada: string | null;
  estado: EstadoToma;
  nombre?: string;
  dosis?: string;
  unidad?: string | null;
  presentacion?: string;
  cantidad?: number;
  frecuencia?: string;
  // Campos devueltos por el backend en el JOIN con medicamentos
  medicamento_nombre?: string;
  medicamento_dosis?: string;
  medicamento?: { nombre: string; dosis: string; cantidad: number };
}
