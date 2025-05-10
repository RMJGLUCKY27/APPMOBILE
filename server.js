const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Conexión a MySQL (configuración basada en pág. 18)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'wallpaper_app',
});

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "Acceso no autorizado" });
  
  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
};

// FR-001: Registro de usuario (email/Google)
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validación básica
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO Users (email, password_hash) VALUES (?, ?)',
      [email, hashedPassword]
    );
    
    res.status(201).json({ message: "Usuario registrado exitosamente" });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// Login de usuario
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await pool.execute(
      'SELECT BIN_TO_UUID(user_id) as user_id, email, password_hash FROM Users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }
    
    const token = jwt.sign({ id: user.user_id, email: user.email }, 'your_jwt_secret', { expiresIn: '24h' });
    res.json({ token, user_id: user.user_id });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
});

// FR-002: Búsqueda de wallpapers
app.get('/search', async (req, res) => {
  try {
    const { keyword, category } = req.query;
    let query = 'SELECT BIN_TO_UUID(w.wallpaper_id) as wallpaper_id, w.title, w.resolution, w.downloads, w.image_path, BIN_TO_UUID(c.category_id) as category_id, c.name as category_name FROM Wallpapers w JOIN Categories c ON w.category_id = c.category_id WHERE 1=1';
    const params = [];
    
    if (keyword) {
      query += ' AND w.title LIKE ?';
      params.push(`%${keyword}%`);
    }
    
    if (category) {
      query += ' AND c.name = ?';
      params.push(category);
    }
    
    const [wallpapers] = await pool.execute(query, params);
    res.json(wallpapers);
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({ error: "Error al buscar wallpapers" });
  }
});

// Obtener categorías
app.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT BIN_TO_UUID(category_id) as category_id, name FROM Categories WHERE is_active = TRUE'
    );
    res.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
});

// FR-003: Guardar en favoritos
app.post('/favorites', authenticateToken, async (req, res) => {
  try {
    const { wallpaper_id } = req.body;
    const user_id = req.user.id;
    
    await pool.execute(
      'INSERT INTO Favorites (user_id, wallpaper_id) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?))',
      [user_id, wallpaper_id]
    );
    
    res.json({ message: "Añadido a favoritos exitosamente" });
  } catch (error) {
    console.error('Error al añadir a favoritos:', error);
    res.status(500).json({ error: "Error al añadir a favoritos" });
  }
});

// Obtener favoritos del usuario
app.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const [favorites] = await pool.execute(
      `SELECT BIN_TO_UUID(w.wallpaper_id) as wallpaper_id, w.title, w.resolution, 
       w.downloads, w.image_path, BIN_TO_UUID(c.category_id) as category_id, 
       c.name as category_name, f.saved_at
       FROM Favorites f
       JOIN Wallpapers w ON f.wallpaper_id = w.wallpaper_id
       JOIN Categories c ON w.category_id = c.category_id
       WHERE f.user_id = UUID_TO_BIN(?)`,
      [user_id]
    );
    
    res.json(favorites);
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).json({ error: "Error al obtener favoritos" });
  }
});

// Eliminar de favoritos
app.delete('/favorites/:wallpaper_id', authenticateToken, async (req, res) => {
  try {
    const { wallpaper_id } = req.params;
    const user_id = req.user.id;
    
    await pool.execute(
      'DELETE FROM Favorites WHERE user_id = UUID_TO_BIN(?) AND wallpaper_id = UUID_TO_BIN(?)',
      [user_id, wallpaper_id]
    );
    
    res.json({ message: "Eliminado de favoritos exitosamente" });
  } catch (error) {
    console.error('Error al eliminar de favoritos:', error);
    res.status(500).json({ error: "Error al eliminar de favoritos" });
  }
});

// Incrementar contador de descargas
app.post('/wallpapers/:wallpaper_id/download', async (req, res) => {
  try {
    const { wallpaper_id } = req.params;
    
    await pool.execute(
      'UPDATE Wallpapers SET downloads = downloads + 1 WHERE wallpaper_id = UUID_TO_BIN(?)',
      [wallpaper_id]
    );
    
    res.json({ message: "Descarga registrada exitosamente" });
  } catch (error) {
    console.error('Error al registrar descarga:', error);
    res.status(500).json({ error: "Error al registrar descarga" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API corriendo en puerto ${PORT}`));