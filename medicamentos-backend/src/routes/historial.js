const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/historial/proximas?perfil_id=1 -> próximas tomas pendientes (pantalla home)
router.get('/proximas', async (req, res) => {
  const { perfil_id } = req.query;
  if (!perfil_id) {
    return res.status(400).json({ error: 'perfil_id es requerido' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT h.id, h.fecha_programada, h.estado, m.nombre, m.dosis
       FROM historial_tomas h
       JOIN medicamentos m ON m.id = h.medicamento_id
       WHERE h.perfil_id = ? AND h.estado = 'pendiente'
       ORDER BY h.fecha_programada ASC
       LIMIT 10`,
      [perfil_id]
    );
    res.json(rows);
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
      `SELECT h.id, h.fecha_programada, h.fecha_tomada, h.estado, m.nombre, m.dosis
       FROM historial_tomas h
       JOIN medicamentos m ON m.id = h.medicamento_id
       WHERE h.perfil_id = ?
       ORDER BY h.fecha_programada DESC
       LIMIT 100`,
      [perfil_id]
    );
    res.json(rows);
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
