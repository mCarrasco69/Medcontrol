export interface Perfil {
  id: number;
  usuario_id: number;
  nombre: string;
  relacion: string | null;
  fecha_nacimiento: string | null;
  avatar_url: string | null;
  created_at: string;
}
