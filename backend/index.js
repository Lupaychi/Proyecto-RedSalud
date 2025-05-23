const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const app = express();

// Enable CORS for Angular frontend
app.use(cors());
app.use(express.json());

// Database connection
const connection = mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,          // Your MySQL port from the screenshot
  user: 'root',
  password: 'MySQL1234', // Add your actual password
  database: 'personas_db'  // We'll create this if it doesn't exist
});

// Connect to MySQL without specifying database first
connection.query('CREATE DATABASE IF NOT EXISTS `db-personas`', (err) => {
  if (err) {
    console.error('Error creating database:', err);
    return;
  }
  
  console.log('Database checked/created successfully');
  
  // Now use the database
  connection.query('USE `db-personas`', (err) => {
    if (err) {
      console.error('Error selecting database:', err);
      return;
    }
    
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
        return;
      }
      console.log('Table checked/created successfully');
    });
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ mensaje: 'API funcionando correctamente' });
});

// Check your existing /api/saludo endpoint and update if needed

app.get('/api/saludo', (req, res) => {
  const timestamp = new Date().toLocaleTimeString();
  res.json({
    mensaje: 'Hola desde el servidor Express!',
    timestamp: timestamp,
    serverInfo: {
      node: process.version,
      database: 'MySQL conectada correctamente',
      status: 'Servidor activo y respondiendo'
    }
  });
});

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

// Start server
const PORT = 3001; // Changed from 3000 to avoid TIME_WAIT issues
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
