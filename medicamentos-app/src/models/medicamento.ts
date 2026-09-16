export interface Medicamento {
  id: number;
  perfil_id: number;
  nombre: string;
  dosis: string;
  unidad: string | null;
  presentacion: string;
  cantidad: number;
  frecuencia: string;
  duracion_dias: number | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  horarios: Horario[];
}

export interface Horario {
  id: number;
  medicamento_id: number;
  hora: string;
}

export interface CrearMedicamentoDTO {
  perfil_id: number;
  nombre: string;
  dosis: string;
  unidad: string | null;
  presentacion: string;
  cantidad: number;
  frecuencia: string;
  duracion_dias: number | null;
  notas: string | null;
  horarios: string[];
}
