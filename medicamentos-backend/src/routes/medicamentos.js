const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/medicamentos?perfil_id=1 -> lista medicamentos de un perfil, con sus horarios
router.get('/', async (req, res) => {
  const { perfil_id } = req.query;
  if (!perfil_id) {
    return res.status(400).json({ error: 'perfil_id es requerido' });
  }
  try {
    const [medicamentos] = await pool.query(
      'SELECT * FROM medicamentos WHERE perfil_id = ? AND activo = TRUE ORDER BY created_at DESC',
      [perfil_id]
    );

    for (const med of medicamentos) {
      const [horarios] = await pool.query(
        'SELECT id, hora FROM horarios_toma WHERE medicamento_id = ?',
        [med.id]
      );
      med.horarios = horarios;
    }

    res.json(medicamentos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/medicamentos/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medicamentos WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Medicamento no encontrado' });

    const [horarios] = await pool.query(
      'SELECT id, hora FROM horarios_toma WHERE medicamento_id = ?',
      [req.params.id]
    );
    res.json({ ...rows[0], horarios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/medicamentos -> crea el medicamento + sus horarios en una transacción
router.post('/', async (req, res) => {
  const { perfil_id, nombre, dosis, frecuencia, duracion_dias, notas, horarios } = req.body;

  if (!perfil_id || !nombre || !dosis || !frecuencia) {
    return res.status(400).json({ error: 'perfil_id, nombre, dosis y frecuencia son requeridos' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO medicamentos (perfil_id, nombre, dosis, frecuencia, duracion_dias, notas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [perfil_id, nombre, dosis, frecuencia, duracion_dias || null, notas || null]
    );
    const medicamentoId = result.insertId;

    if (Array.isArray(horarios) && horarios.length > 0) {
      const values = horarios.map((hora) => [medicamentoId, hora]);
      await conn.query('INSERT INTO horarios_toma (medicamento_id, hora) VALUES ?', [values]);

      // Insertar una fila en historial_tomas por cada horario (estado 'pendiente')
      const ahora = new Date();
      const historialValues = horarios.map((hora) => {
        const [hh, mm] = String(hora).slice(0, 5).split(':').map(Number);
        let fecha = new Date();
        fecha.setHours(hh || 0, mm || 0, 0, 0);
        if (fecha <= ahora) {
          fecha.setDate(fecha.getDate() + 1);
        }
        const fechaProgramada = fecha.toISOString().slice(0, 19).replace('T', ' ');
        return [medicamentoId, perfil_id, fechaProgramada, 'pendiente'];
      });
      await conn.query(
        'INSERT INTO historial_tomas (medicamento_id, perfil_id, fecha_programada, estado) VALUES ?',
        [historialValues]
      );
    }

    await conn.commit();
    res.status(201).json({ id: medicamentoId, nombre, dosis, frecuencia, horarios });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// PUT /api/medicamentos/:id -> editar datos básicos (no toca horarios)
router.put('/:id', async (req, res) => {
  const { nombre, dosis, frecuencia, duracion_dias, notas } = req.body;
  try {
    await pool.query(
      `UPDATE medicamentos SET nombre = ?, dosis = ?, frecuencia = ?, duracion_dias = ?, notas = ?
       WHERE id = ?`,
      [nombre, dosis, frecuencia, duracion_dias, notas, req.params.id]
    );
    res.json({ message: 'Medicamento actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/medicamentos/:id -> borrado lógico (activo = false)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE medicamentos SET activo = FALSE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Medicamento eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
