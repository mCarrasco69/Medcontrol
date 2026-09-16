const express = require('express');
const router = express.Router();
const pool = require('../db');

function proximaFechaParaHora(hora) {
  const [hh, mm] = String(hora).slice(0, 5).split(':').map(Number);
  const fecha = new Date();
  fecha.setHours(hh || 0, mm || 0, 0, 0);
  if (fecha <= new Date()) fecha.setDate(fecha.getDate() + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:00`;
}

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
        'SELECT id, hora FROM horarios_toma WHERE medicamento_id = ? ORDER BY id DESC LIMIT 1',
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
      'SELECT id, hora FROM horarios_toma WHERE medicamento_id = ? ORDER BY id DESC LIMIT 1',
      [req.params.id]
    );
    res.json({ ...rows[0], horarios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/medicamentos -> crea el medicamento + sus horarios en una transacción
router.post('/', async (req, res) => {
  const { perfil_id, nombre, dosis, unidad, presentacion, cantidad, frecuencia, duracion_dias, notas, horarios } = req.body;

  if (!perfil_id || !nombre || !dosis || !frecuencia) {
    return res.status(400).json({ error: 'perfil_id, nombre, dosis y frecuencia son requeridos' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO medicamentos (perfil_id, nombre, dosis, unidad, presentacion, cantidad, frecuencia, duracion_dias, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [perfil_id, nombre, dosis, unidad || null, presentacion || 'tableta', cantidad || 1, frecuencia, duracion_dias || null, notas || null]
    );
    const medicamentoId = result.insertId;

    if (Array.isArray(horarios) && horarios.length > 0) {
      const hora = horarios[0];
      await conn.query('INSERT INTO horarios_toma (medicamento_id, hora) VALUES (?, ?)', [medicamentoId, hora]);

      // Insertar una fila en historial_tomas por cada horario (estado 'pendiente')
      const ahora = new Date();
      const [hh, mm] = String(hora).slice(0, 5).split(':').map(Number);
      const fecha = new Date();
      fecha.setHours(hh || 0, mm || 0, 0, 0);
      if (fecha <= ahora) {
        fecha.setDate(fecha.getDate() + 1);
      }
      // Formatear en hora local (no UTC) para evitar desfase de zona horaria
      const pad = (n) => String(n).padStart(2, '0');
      const fechaProgramada = `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())} ${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:${pad(fecha.getSeconds())}`;
      await conn.query(
        `INSERT INTO historial_tomas (medicamento_id, perfil_id, fecha_programada, estado)
         VALUES (?, ?, ?, 'pendiente')`,
        [medicamentoId, perfil_id, fechaProgramada]
      );
    }

    await conn.commit();
    res.status(201).json({ id: medicamentoId, nombre, dosis, unidad, presentacion, cantidad: cantidad || 1, frecuencia, horarios: horarios?.slice(0, 1) ?? [] });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// PUT /api/medicamentos/:id -> editar datos y reprogramar su horario
router.put('/:id', async (req, res) => {
  const { nombre, dosis, unidad, presentacion, cantidad, frecuencia, duracion_dias, notas, horarios } = req.body;
  const match = String(frecuencia || '').match(/\d+/);
  const horasIntervalo = Math.max(Number(match?.[0]) || 8, 1);
  const horarioSolicitado = Array.isArray(horarios) ? horarios[0] : null;
  const fechaProgramada = horarioSolicitado ? proximaFechaParaHora(horarioSolicitado) : null;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      `UPDATE medicamentos SET nombre = ?, dosis = ?, unidad = ?, presentacion = ?, cantidad = ?, frecuencia = ?, duracion_dias = ?, notas = ?
       WHERE id = ?`,
      [nombre, dosis, unidad || null, presentacion || 'tableta', cantidad || 1, frecuencia, duracion_dias || null, notas || null, req.params.id]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }

    const [medicamentos] = await conn.query('SELECT perfil_id FROM medicamentos WHERE id = ?', [req.params.id]);
    const [tomasActualizadas] = fechaProgramada
      ? await conn.query(
          `UPDATE historial_tomas SET fecha_programada = ?
           WHERE medicamento_id = ? AND estado = 'pendiente' AND fecha_programada >= NOW()`,
          [fechaProgramada, req.params.id]
        )
      : await conn.query(
          `UPDATE historial_tomas SET fecha_programada = DATE_ADD(NOW(), INTERVAL ? HOUR)
           WHERE medicamento_id = ? AND estado = 'pendiente' AND fecha_programada >= NOW()`,
          [horasIntervalo, req.params.id]
        );
    if (tomasActualizadas.affectedRows === 0) {
      await conn.query(
        `INSERT INTO historial_tomas (medicamento_id, perfil_id, fecha_programada, estado)
         VALUES (?, ?, ?, 'pendiente')`,
        [req.params.id, medicamentos[0].perfil_id, fechaProgramada || new Date(Date.now() + horasIntervalo * 3600000)]
      );
    }

    const [horariosGuardados] = await conn.query('SELECT id FROM horarios_toma WHERE medicamento_id = ? LIMIT 1', [req.params.id]);
    if (horariosGuardados.length > 0) {
      await conn.query(
        `UPDATE horarios_toma SET hora = ${horarioSolicitado ? '?' : 'TIME(DATE_ADD(NOW(), INTERVAL ? HOUR))'} WHERE id = ?`,
        [horarioSolicitado || horasIntervalo, horariosGuardados[0].id]
      );
    } else {
      await conn.query(
        `INSERT INTO horarios_toma (medicamento_id, hora) VALUES (?, ${horarioSolicitado ? '?' : 'TIME(DATE_ADD(NOW(), INTERVAL ? HOUR))'})`,
        [req.params.id, horarioSolicitado || horasIntervalo]
      );
    }

    await conn.commit();
    res.json({ message: 'Medicamento actualizado' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
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
