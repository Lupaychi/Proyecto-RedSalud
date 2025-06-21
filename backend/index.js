require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const fs = require('fs');

// Importar servicio de doctores
const doctoresService = require('./services/doctores.service');

// Enable CORS for Angular frontend
app.use(cors());
app.use(express.json());

// Variables para la conexión a la BD
let connection = null;
let dbConnected = false;

// Intentar conexión a MySQL solo si están configuradas las variables de entorno
if (process.env.DB_HOST && process.env.DB_USER) {
  try {
    const mysql = require('mysql2');
    
    // Database connection
    connection = mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE
    });

    // Connect to MySQL without specifying database first
    connection.query('CREATE DATABASE IF NOT EXISTS `personas_db`', (err) => {
      if (err) {
        console.error('Error creating database:', err);
        console.log('La aplicación continuará sin la funcionalidad de MySQL');
      } else {
        console.log('Database checked/created successfully');
        
        // Now use the database
        connection.query('USE `personas_db`', (err) => {
          if (err) {
            console.error('Error selecting database:', err);
          } else {
            // Create a table if it doesn't exist
            const createTable = `
              CREATE TABLE IF NOT EXISTS personas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                edad INT
              )`;
            
            connection.query(createTable, (err) => {
              if (err) {
                console.error('Error creating table:', err);
              } else {
                console.log('Table checked/created successfully');
                dbConnected = true;
              }
            });
          }
        });
      }
    });
  } catch (error) {
    console.error('Error al intentar conectar con MySQL:', error.message);
    console.log('La aplicación continuará sin la funcionalidad de MySQL');
  }
} else {
  console.log('Variables de entorno de MySQL no configuradas. La aplicación continuará sin esta funcionalidad.');
}

// Inicializar servicio de doctores
(async () => {
  try {
    // Asegurarse de que el archivo CSV exista en data/ofertas-vigentes.csv
    const csvPath = path.join(__dirname, 'data', 'ofertas-vigentes.csv');
    
    // Si el archivo no existe, copiar desde frontend
    if (!fs.existsSync(csvPath)) {
      console.log('Archivo CSV de doctores no encontrado, intentando copiar desde el frontend...');
      const frontendCsvPath = path.join(__dirname, '../frontend/src/app/assets/data/ofertas-vigentes.csv');
      
      if (fs.existsSync(frontendCsvPath)) {
        fs.copyFileSync(frontendCsvPath, csvPath);
        console.log('Archivo CSV copiado exitosamente desde el frontend');
      } else {
        console.error('No se encontró el archivo CSV en el frontend');
      }
    }
    
    await doctoresService.inicializar();
    console.log('Servicio de doctores inicializado correctamente');
  } catch (error) {
    console.error('Error al inicializar el servicio de doctores:', error);
  }
})();

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    mensaje: 'API funcionando correctamente',
    mysqlStatus: dbConnected ? 'conectado' : 'no conectado' 
  });
});

// API Saludo endpoint
app.get('/api/saludo', (req, res) => {
  const timestamp = new Date().toLocaleTimeString();
  res.json({
    mensaje: 'Hola desde el servidor Express!',
    timestamp: timestamp,
    serverInfo: {
      node: process.version,
      database: dbConnected ? 'MySQL conectada correctamente' : 'MySQL no disponible',
      status: 'Servidor activo y respondiendo'
    }
  });
});

// RUTAS DE DOCTORES

// GET: Obtener todos los doctores
app.get('/api/doctores', (req, res) => {
  try {
    const doctores = doctoresService.obtenerTodos();
    res.json({ doctores });
  } catch (error) {
    console.error('Error al obtener doctores:', error);
    res.status(500).json({ error: 'Error al obtener doctores' });
  }
});

// GET: Buscar doctores con filtros
app.get('/api/doctores/buscar', (req, res) => {
  try {
    const { busqueda, especialidad, dia, box } = req.query;
      
    const filtros = {};
    if (busqueda) filtros.busqueda = busqueda;
    if (especialidad && especialidad !== 'Todas las especialidades') filtros.especialidad = especialidad;
    if (dia && dia !== 'Todos los dias') filtros.dia = dia;
    if (box && box !== 'Todos los boxes') filtros.box = box;
    
    console.log('Filtros recibidos:', filtros);
    const resultados = doctoresService.buscarConFiltros(filtros);
    console.log(`Resultados: ${resultados.length} doctores`);
    
    res.json({
      doctores: resultados,
      totalResultados: resultados.length,
      filtros
    });
  } catch (error) {
    console.error('Error en búsqueda de doctores:', error);
    res.status(500).json({ error: 'Error al buscar doctores' });
  }
});

// GET: Obtener especialidades
app.get('/api/doctores/especialidades', (req, res) => {
  try {
    const especialidades = doctoresService.obtenerEspecialidades();
    res.json({ especialidades });
  } catch (error) {
    console.error('Error al obtener especialidades:', error);
    res.status(500).json({ error: 'Error al obtener especialidades' });
  }
});

// GET: Obtener boxes
app.get('/api/doctores/boxes', (req, res) => {
  try {
    const boxes = doctoresService.obtenerBoxes();
    res.json({ boxes });
  } catch (error) {
    console.error('Error al obtener boxes:', error);
    res.status(500).json({ error: 'Error al obtener boxes' });
  }
});

// GET: Obtener estadísticas de especialidades
app.get('/api/doctores/estadisticas-especialidades', (req, res) => {
  try {
    const estadisticas = doctoresService.obtenerEstadisticasEspecialidades();
    res.json({ estadisticas });
  } catch (error) {
    console.error('Error al obtener estadísticas de especialidades:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas de especialidades' });
  }
});

// GET: Obtener doctores por especialidad
app.get('/api/doctores/por-especialidad/:especialidad', (req, res) => {
  try {
    const { especialidad } = req.params;
    
    if (!especialidad) {
      return res.status(400).json({ error: 'Especialidad no especificada' });
    }
    
    const doctores = doctoresService.buscarConFiltros({ especialidad });
    
    res.json({
      especialidad,
      total: doctores.length,
      doctores
    });
  } catch (error) {
    console.error('Error al obtener doctores por especialidad:', error);
    res.status(500).json({ error: 'Error al obtener doctores por especialidad' });
  }
});

// RUTAS DE PERSONAS (original) - Solo si MySQL está conectado
if (dbConnected) {
  // GET all personas
  app.get('/api/personas', (req, res) => {
    connection.query('SELECT * FROM personas', (err, results) => {
      if (err) {
        console.error('Error fetching personas:', err);
        return res.status(500).json({ error: 'Error al obtener personas' });
      }
      res.json(results);
    });
  });

  // POST new persona
  app.post('/api/personas', (req, res) => {
    const { nombre, edad } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    connection.query(
      'INSERT INTO personas (nombre, edad) VALUES (?, ?)',
      [nombre, edad || null],
      (err, result) => {
        if (err) {
          console.error('Error creating persona:', err);
          return res.status(500).json({ error: 'Error al crear persona' });
        }
        
        res.status(201).json({
          id: result.insertId,
          nombre,
          edad
        });
      }
    );
  });

  // GET single persona
  app.get('/api/personas/:id', (req, res) => {
    connection.query(
      'SELECT * FROM personas WHERE id = ?',
      [req.params.id],
      (err, results) => {
        if (err) {
          console.error('Error fetching persona:', err);
          return res.status(500).json({ error: 'Error al obtener persona' });
        }
        if (results.length === 0) {
          return res.status(404).json({ error: 'Persona no encontrada' });
        }
        res.json(results[0]);
      }
    );
  });

  // PUT update persona
  app.put('/api/personas/:id', (req, res) => {
    const { nombre, edad } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    connection.query(
      'UPDATE personas SET nombre = ?, edad = ? WHERE id = ?',
      [nombre, edad || null, req.params.id],
      (err, result) => {
        if (err) {
          console.error('Error updating persona:', err);
          return res.status(500).json({ error: 'Error al actualizar persona' });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Persona no encontrada' });
        }
        
        res.json({
          id: parseInt(req.params.id),
          nombre,
          edad
        });
      }
    );
  });

  // DELETE persona
  app.delete('/api/personas/:id', (req, res) => {
    connection.query(
      'DELETE FROM personas WHERE id = ?',
      [req.params.id],
      (err, result) => {
        if (err) {
          console.error('Error deleting persona:', err);
          return res.status(500).json({ error: 'Error al eliminar persona' });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Persona no encontrada' });
        }
        
        res.json({ message: 'Persona eliminada correctamente' });
      }
    );
  });
} else {
  // Si MySQL no está conectado, devolver mensaje de error para estas rutas
  app.get('/api/personas', (req, res) => {
    res.status(503).json({ error: 'Base de datos MySQL no disponible' });
  });
  
  app.post('/api/personas', (req, res) => {
    res.status(503).json({ error: 'Base de datos MySQL no disponible' });
  });
  
  app.get('/api/personas/:id', (req, res) => {
    res.status(503).json({ error: 'Base de datos MySQL no disponible' });
  });
  
  app.put('/api/personas/:id', (req, res) => {
    res.status(503).json({ error: 'Base de datos MySQL no disponible' });
  });
  
  app.delete('/api/personas/:id', (req, res) => {
    res.status(503).json({ error: 'Base de datos MySQL no disponible' });
  });
}

// Start server
const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});


