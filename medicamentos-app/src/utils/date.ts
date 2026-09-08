import dayjs from 'dayjs';

export function formatHora(hora: string): string {
  return hora.slice(0, 5);
}

export function formatHorarios(horarios: Array<string | { hora: string }>): string {
  if (!horarios || horarios.length === 0) return '';
  return horarios.map((h) => formatHora(typeof h === 'string' ? h : h.hora)).join('  ·  ');
}

export function formatFechaProgramada(fecha: string): string {
  if (!fecha) return '—';
  return dayjs(fecha).format('DD/MM/YYYY HH:mm');
}

export function formatHoraCorta(fecha: string): string {
  if (!fecha) return '--:--';
  return dayjs(fecha).format('HH:mm');
}

export function calcularTiempoRestante(fechaProgramada: string): string {
  const diffMs = dayjs(fechaProgramada).diff(dayjs());
  if (diffMs <= 0) return '00:00';
  const totalSeg = Math.floor(diffMs / 1000);
  const horas = Math.floor(totalSeg / 3600);
  const mins = Math.floor((totalSeg % 3600) / 60);
  const segs = totalSeg % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return horas > 0 ? `${pad(horas)}:${pad(mins)}:${pad(segs)}` : `${pad(mins)}:${pad(segs)}`;
}
