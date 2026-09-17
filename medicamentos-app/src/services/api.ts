import axios, { AxiosResponse } from 'axios';
import Constants from 'expo-constants';

import type { Perfil } from '../models/perfil';
import type { Medicamento } from '../models/medicamento';
import type { HistorialToma } from '../models/historial';

const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
const developmentURL = metroHost ? `http://${metroHost}:3000/api` : null;
const envURL = process.env.EXPO_PUBLIC_API_URL;

const api = axios.create({
  baseURL: envURL ?? (__DEV__ ? developmentURL ?? undefined : undefined),
  timeout: 10000,
});

export function getPerfiles(usuarioId: number): Promise<AxiosResponse<Perfil[]>> {
  return api.get(`/perfiles?usuario_id=${usuarioId}`);
}

export function getPerfilById(id: number): Promise<AxiosResponse<Perfil>> {
  return api.get(`/perfiles/${id}`);
}

export function crearPerfil(datos: Record<string, unknown>): Promise<AxiosResponse<Perfil>> {
  return api.post('/perfiles', datos);
}

export function actualizarPerfil(
  id: number,
  datos: Record<string, unknown>,
): Promise<AxiosResponse<Perfil>> {
  return api.put(`/perfiles/${id}`, datos);
}

export function eliminarPerfil(id: number): Promise<AxiosResponse<unknown>> {
  return api.delete(`/perfiles/${id}`);
}

export function getMedicamentos(perfilId: number): Promise<AxiosResponse<Medicamento[]>> {
  return api.get(`/medicamentos?perfil_id=${perfilId}`);
}

export function crearMedicamento(
  datos: Record<string, unknown>,
): Promise<AxiosResponse<Medicamento>> {
  return api.post('/medicamentos', datos);
}

export function getMedicamentoById(id: number): Promise<AxiosResponse<Medicamento>> {
  return api.get(`/medicamentos/${id}`);
}

export function actualizarMedicamento(
  id: number,
  datos: Record<string, unknown>,
): Promise<AxiosResponse<Medicamento>> {
  return api.put(`/medicamentos/${id}`, datos);
}

export function eliminarMedicamento(id: number): Promise<AxiosResponse<unknown>> {
  return api.delete(`/medicamentos/${id}`);
}

export function getProximasTomas(perfilId: number): Promise<AxiosResponse<HistorialToma[]>> {
  return api.get(`/historial/proximas?perfil_id=${perfilId}`);
}

export function marcarComoTomada(historialId: number): Promise<AxiosResponse<unknown>> {
  return api.put(`/historial/${historialId}/tomada`);
}

export function marcarComoOmitida(historialId: number): Promise<AxiosResponse<unknown>> {
  return api.put(`/historial/${historialId}/omitida`);
}

export function getHistorial(perfilId: number): Promise<AxiosResponse<HistorialToma[]>> {
  return api.get(`/historial?perfil_id=${perfilId}`);
}

export function limpiarHistorial(perfilId: number): Promise<AxiosResponse<unknown>> {
  return api.delete(`/historial?perfil_id=${perfilId}`);
}
