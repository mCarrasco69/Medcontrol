import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
});

export function getPerfiles(usuarioId) {
  return api.get(`/perfiles?usuario_id=${usuarioId}`);
}

export function getPerfilById(id) {
  return api.get(`/perfiles/${id}`);
}

export function crearPerfil(datos) {
  return api.post('/perfiles', datos);
}

export function actualizarPerfil(id, datos) {
  return api.put(`/perfiles/${id}`, datos);
}

export function eliminarPerfil(id) {
  return api.delete(`/perfiles/${id}`);
}

export function getMedicamentos(perfilId) {
  return api.get(`/medicamentos?perfil_id=${perfilId}`);
}

export function crearMedicamento(datos) {
  return api.post('/medicamentos', datos);
}

export function getMedicamentoById(id) {
  return api.get(`/medicamentos/${id}`);
}

export function actualizarMedicamento(id, datos) {
  return api.put(`/medicamentos/${id}`, datos);
}

export function eliminarMedicamento(id) {
  return api.delete(`/medicamentos/${id}`);
}

export function getProximasTomas(perfilId) {
  return api.get(`/historial/proximas?perfil_id=${perfilId}`);
}

export function marcarComoTomada(historialId) {
  return api.put(`/historial/${historialId}/tomada`);
}

export function getHistorial(perfilId) {
  return api.get(`/historial?perfil_id=${perfilId}`);
}
