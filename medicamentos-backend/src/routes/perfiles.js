const express = require('express');
const router = express.Router();
const pool = require('../db');

// Normalizar fecha: convierte ISO (2025-01-02T06:00:00.000Z) a YYYY-MM-DD
function normalizarFecha(fecha) {
  if (!fecha) return null;
  const str = String(fecha);
  if (str.includes('T')) {
    return str.split('T')[0];
  }
  return str || null;
}

// GET /api/perfiles?usuario_id=1 -> lista todos los perfiles de una cuenta
router.get('/', async (req, res) => {
  const { usuario_id } = req.query;
  if (!usuario_id) {
    return res.status(400).json({ error: 'usuario_id es requerido' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT * FROM perfiles WHERE usuario_id = ? ORDER BY created_at ASC',
      [usuario_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/perfiles/:id -> un perfil específico
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM perfiles WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/perfiles -> crear un nuevo perfil (ej: "Mamá")
router.post('/', async (req, res) => {
  const { usuario_id, nombre, relacion, fecha_nacimiento, avatar_url } = req.body;
  if (!usuario_id || !nombre) {
    return res.status(400).json({ error: 'usuario_id y nombre son requeridos' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO perfiles (usuario_id, nombre, relacion, fecha_nacimiento, avatar_url)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, nombre, relacion || null, normalizarFecha(fecha_nacimiento), avatar_url || null]
    );
    res.status(201).json({ id: result.insertId, usuario_id, nombre, relacion });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/perfiles/:id -> editar un perfil
router.put('/:id', async (req, res) => {
  const { nombre, relacion, fecha_nacimiento, avatar_url } = req.body;
  try {
    await pool.query(
      `UPDATE perfiles SET nombre = ?, relacion = ?, fecha_nacimiento = ?, avatar_url = ?
       WHERE id = ?`,
      [nombre, relacion || null, normalizarFecha(fecha_nacimiento), avatar_url || null, req.params.id]
    );
    res.json({ message: 'Perfil actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/perfiles/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM perfiles WHERE id = ?', [req.params.id]);
    res.json({ message: 'Perfil eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
