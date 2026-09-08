const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const perfilesRoutes = require('./routes/perfiles');
const medicamentosRoutes = require('./routes/medicamentos');
const historialRoutes = require('./routes/historial');

app.use('/api/perfiles', perfilesRoutes);
app.use('/api/medicamentos', medicamentosRoutes);
app.use('/api/historial', historialRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});
