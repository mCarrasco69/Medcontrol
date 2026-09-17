const express = require('express');
const router = express.Router();
const pool = require('../db');

// Normalizar fecha: convierte el Date de MySQL a string "YYYY-MM-DD HH:mm:ss" en hora local
// (mysql2 devuelve Date objects que JSON.stringify convierte a ISO con Z de UTC, causando desfase)
function normalizarFecha(fecha) {
  if (!fecha) return null;
  if (typeof fecha === 'string') {
    // Si ya viene como string, quitar la Z si la tiene
    return fecha.replace('T', ' ').replace(/\.000Z$/, '');
  }
  // Si es Date, formatear en hora local
  const pad = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
}

function horasDeFrecuencia(frecuencia) {
  const match = String(frecuencia || '').match(/\d+/);
  return Math.max(Number(match?.[0]) || 8, 1);
}

function esUnaSolaToma(frecuencia) {
  const text = String(frecuencia || '').toLowerCase();
  return /\b(una\s+sola|sólo\s+una|solo\s+una|sola\s+toma|única\s+toma|unica\s+toma|single\s+dose|one\s+time)\b/i.test(text) ||
    /\buna\s+sola\s+vez\b/i.test(text);
}

function proximaFechaParaHora(hora) {
  const [hh, mm] = String(hora).slice(0, 5).split(':').map(Number);
  const fecha = new Date();
  fecha.setHours(hh || 0, mm || 0, 0, 0);
  if (fecha <= new Date()) fecha.setDate(fecha.getDate() + 1);
  return fecha;
}

function siguienteFechaProgramada(base, horasIntervalo) {
  const ms = horasIntervalo * 60 * 60 * 1000;
  const ahora = new Date();
  let siguiente = new Date(base.getTime());
  while (siguiente <= ahora) {
    siguiente = new Date(siguiente.getTime() + ms);
  }
  return siguiente;
}

function fechaMinuto(fecha) {
  return normalizarFecha(fecha).slice(0, 16);
}

async function asegurarProximasTomas(perfilId) {
  const [medicamentos] = await pool.query(
    `SELECT m.id, m.frecuencia, m.created_at,
            (SELECT h.hora FROM horarios_toma h WHERE h.medicamento_id = m.id ORDER BY h.id DESC LIMIT 1) AS hora
     FROM medicamentos m
     WHERE m.perfil_id = ? AND m.activo = TRUE
       AND (m.duracion_dias IS NULL OR DATE_ADD(m.created_at, INTERVAL m.duracion_dias DAY) >= NOW())`,
    [perfilId]
  );

  for (const medicamento of medicamentos) {
    const intervalo = horasDeFrecuencia(medicamento.frecuencia);
    const ms = intervalo * 60 * 60 * 1000;

    let base;
    const [ultimas] = await pool.query(
      `SELECT
         (SELECT MAX(fecha_tomada) FROM historial_tomas WHERE medicamento_id = ? AND estado = 'tomada') as ultima_tomada,
         (SELECT MAX(fecha_programada) FROM historial_tomas WHERE medicamento_id = ? AND estado = 'omitida') as ultima_omitida`,
      [medicamento.id, medicamento.id]
    );

    const ultimaFecha = ultimas[0].ultima_tomada ?? ultimas[0].ultima_omitida;

    if (esUnaSolaToma(medicamento.frecuencia) && ultimaFecha) {
      continue; // medicamento de una sola toma: no se reprograma más
    }

    if (ultimaFecha) {
      base = new Date(ultimaFecha);
    } else if (medicamento.hora) {
      const [hh, mm] = String(medicamento.hora).slice(0, 5).split(':').map(Number);
      const creado = new Date(medicamento.created_at);
      base = new Date(creado);
      base.setHours(hh || 0, mm || 0, 0, 0);
      if (base <= creado) {
        base = new Date(base.getTime() + 24 * 60 * 60 * 1000);
      }
    } else {
      base = new Date(Date.now() + ms);
    }

    const ahora = new Date();
    let n = Math.max(0, Math.ceil((ahora.getTime() - base.getTime()) / ms));

    // Find the next free slot in the fixed sequence (base + n * interval)
    let siguiente;
    while (true) {
      siguiente = new Date(base.getTime() + n * ms);
      const [existe] = await pool.query(
        `SELECT id, estado FROM historial_tomas
         WHERE medicamento_id = ? AND DATE_FORMAT(fecha_programada, '%Y-%m-%d %H:%i') = ?
         LIMIT 1`,
        [medicamento.id, fechaMinuto(siguiente)]
      );
      if (!existe.length) {
        break; // empty slot for a new pending dose
      }
      if (existe[0].estado === 'pendiente') {
        break; // there is already a pending at the correct time
      }
      n += 1;
    }

    const normalizadaSiguiente = normalizarFecha(siguiente);
    const minutoSiguiente = fechaMinuto(siguiente);

    // If the correct pending already exists, leave it. Otherwise replace wrong future ones.
    const [pendientes] = await pool.query(
      `SELECT id, fecha_programada FROM historial_tomas
       WHERE medicamento_id = ? AND estado = 'pendiente' AND fecha_programada >= NOW()`,
      [medicamento.id]
    );

    if (pendientes.length > 0) {
      const yaExiste = pendientes.some((p) => fechaMinuto(p.fecha_programada) === minutoSiguiente);
      if (yaExiste) continue;
      await pool.query(
        `DELETE FROM historial_tomas
         WHERE medicamento_id = ? AND estado = 'pendiente' AND fecha_programada >= NOW()`,
        [medicamento.id]
      );
    }

    await pool.query(
      `INSERT INTO historial_tomas (medicamento_id, perfil_id, fecha_programada, estado)
       VALUES (?, ?, ?, 'pendiente')`,
      [medicamento.id, perfilId, normalizadaSiguiente]
    );
  }
}

// GET /api/historial/proximas?perfil_id=1 -> próximas tomas pendientes (pantalla home)
router.get('/proximas', async (req, res) => {
  const { perfil_id } = req.query;
  if (!perfil_id) {
    return res.status(400).json({ error: 'perfil_id es requerido' });
  }
  try {
    await pool.query(
      `UPDATE historial_tomas SET estado = 'atrasada'
       WHERE perfil_id = ? AND estado = 'pendiente' AND fecha_programada < NOW()`,
      [perfil_id]
    );
    await asegurarProximasTomas(perfil_id);
    const [rows] = await pool.query(
      `SELECT h.id, h.fecha_programada, h.estado, m.nombre, m.dosis, m.unidad, m.presentacion, m.cantidad, m.frecuencia
       FROM historial_tomas h
       JOIN medicamentos m ON m.id = h.medicamento_id
       WHERE h.perfil_id = ?
         AND (m.activo = TRUE OR h.estado = 'omitida')
         AND h.estado IN ('pendiente','omitida')
         AND h.fecha_programada >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       ORDER BY (CASE WHEN h.estado = 'pendiente' THEN 0 ELSE 1 END), h.fecha_programada ASC
       LIMIT 10`,
      [perfil_id]
    );
    // Normalizar fechas para evitar desfase de zona horaria
    const normalizadas = rows.map((r) => ({ ...r, fecha_programada: normalizarFecha(r.fecha_programada) }));
    res.json(normalizadas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/historial?perfil_id=1 -> historial completo (para la sección de historial)
router.get('/', async (req, res) => {
  const { perfil_id } = req.query;
  if (!perfil_id) {
    return res.status(400).json({ error: 'perfil_id es requerido' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT h.id, h.fecha_programada, h.fecha_tomada, h.estado, m.nombre, m.dosis, m.unidad, m.presentacion, m.cantidad, m.frecuencia
       FROM historial_tomas h
       JOIN medicamentos m ON m.id = h.medicamento_id
       WHERE h.perfil_id = ?
       ORDER BY COALESCE(h.fecha_tomada, h.fecha_programada) DESC
       LIMIT 100`,
      [perfil_id]
    );
    const normalizadas = rows.map((r) => ({
      ...r,
      fecha_programada: normalizarFecha(r.fecha_programada),
      fecha_tomada: normalizarFecha(r.fecha_tomada),
    }));
    res.json(normalizadas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/historial -> programar una nueva toma
router.post('/', async (req, res) => {
  const { medicamento_id, perfil_id, fecha_programada } = req.body;
  if (!medicamento_id || !perfil_id || !fecha_programada) {
    return res.status(400).json({ error: 'medicamento_id, perfil_id y fecha_programada son requeridos' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO historial_tomas (medicamento_id, perfil_id, fecha_programada, estado)
       VALUES (?, ?, ?, 'pendiente')`,
      [medicamento_id, perfil_id, fecha_programada]
    );
    res.status(201).json({ id: result.insertId, estado: 'pendiente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/historial/:id/tomada -> marcar como tomada
router.put('/:id/tomada', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.medicamento_id, m.frecuencia
       FROM historial_tomas h
       JOIN medicamentos m ON m.id = h.medicamento_id
       WHERE h.id = ?`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Toma no encontrada' });
    }
    const { medicamento_id, frecuencia } = rows[0];

    await pool.query(
      `UPDATE historial_tomas SET estado = 'tomada', fecha_tomada = NOW() WHERE id = ?`,
      [req.params.id]
    );

    if (esUnaSolaToma(frecuencia)) {
      await pool.query('UPDATE medicamentos SET activo = 0 WHERE id = ?', [medicamento_id]);
    }

    res.json({ message: 'Toma registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/historial/:id/omitida -> marcar como omitida
router.put('/:id/omitida', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT h.medicamento_id, m.frecuencia
       FROM historial_tomas h
       JOIN medicamentos m ON m.id = h.medicamento_id
       WHERE h.id = ?`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Toma no encontrada' });
    }

    await pool.query(`UPDATE historial_tomas SET estado = 'omitida' WHERE id = ?`, [req.params.id]);
    if (esUnaSolaToma(rows[0].frecuencia)) {
      await pool.query('UPDATE medicamentos SET activo = 0 WHERE id = ?', [rows[0].medicamento_id]);
    }

    res.json({ message: 'Toma marcada como omitida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/historial?perfil_id=1 -> limpiar todo el historial de tomas del perfil
router.delete('/', async (req, res) => {
  const { perfil_id } = req.query;
  if (!perfil_id) {
    return res.status(400).json({ error: 'perfil_id es requerido' });
  }
  try {
    await pool.query('DELETE FROM historial_tomas WHERE perfil_id = ?', [perfil_id]);
    res.json({ message: 'Historial limpiado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.asegurarProximasTomas = asegurarProximasTomas;
