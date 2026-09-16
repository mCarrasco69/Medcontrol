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

async function asegurarProximasTomas(perfilId) {
  const [medicamentos] = await pool.query(
    `SELECT id, frecuencia FROM medicamentos
     WHERE perfil_id = ? AND activo = TRUE
       AND (duracion_dias IS NULL OR DATE_ADD(created_at, INTERVAL duracion_dias DAY) >= NOW())`,
    [perfilId]
  );

  for (const medicamento of medicamentos) {
    const [pendientes] = await pool.query(
      `SELECT id FROM historial_tomas
       WHERE medicamento_id = ? AND estado = 'pendiente' AND fecha_programada >= NOW()
       LIMIT 1`,
      [medicamento.id]
    );
    if (pendientes.length > 0) continue;

    await pool.query(
      `INSERT INTO historial_tomas (medicamento_id, perfil_id, fecha_programada, estado)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR), 'pendiente')`,
      [medicamento.id, perfilId, horasDeFrecuencia(medicamento.frecuencia)]
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
       WHERE h.perfil_id = ? AND h.estado = 'pendiente' AND h.fecha_programada >= NOW()
       ORDER BY h.fecha_programada ASC
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
       ORDER BY h.fecha_programada DESC
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
    await pool.query(
      `UPDATE historial_tomas SET estado = 'tomada', fecha_tomada = NOW() WHERE id = ?`,
      [req.params.id]
    );
    res.json({ message: 'Toma registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/historial/:id/omitida -> marcar como omitida
router.put('/:id/omitida', async (req, res) => {
  try {
    await pool.query(`UPDATE historial_tomas SET estado = 'omitida' WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Toma marcada como omitida' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
