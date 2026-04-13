const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { buildCVPrompt, buildCartaPrompt, buildChatPrompt, buildReviewPrompt, buildProfilePrompt, buildImportPrompt } = require('./prompt');
const { chamarIA } = require('./api');
require('dotenv').config();

const SALT_ROUNDS = 12;
const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.JWT_SECRET || 'cvstudio-super-secret-key-2024';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// === RATE LIMITERS ===
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { error: 'Demasiadas tentativas de autenticação. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI requests per minute
  message: { error: 'Limite de pedidos IA atingido. Aguarde um momento.' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database setup
const db = new sqlite3.Database('./cvstudio.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Database connected successfully');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      name TEXT,
      password TEXT,
      google_id TEXT,
      picture TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS cvs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS cover_letters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
  }
});

// ========== HEALTH CHECK ==========
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CV Studio Backend is running' });
});

// ========== AUTH ROUTES ==========
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });
    if (password.length < 6) return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres.' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Formato de email inválido.' });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    db.run('INSERT INTO users (email, name, password) VALUES (?, ?, ?)', [email, name || 'Utilizador', hashedPassword], function(err) {
      if (err) return res.status(500).json({ error: 'E-mail já em uso.' });
      const jwtToken = jwt.sign({ id: this.lastID, email }, SECRET_KEY, { expiresIn: '7d' });
      res.json({ token: jwtToken, user: { id: this.lastID, email, name: name || 'Utilizador' } });
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erro interno ao criar conta.' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email e senha são obrigatórios.' });

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err || !user) return res.status(401).json({ error: 'Credenciais inválidas.' });
      
      // If user has no hashed password (legacy plaintext), reject and force re-register
      if (!user.password || user.password.length < 50) {
        return res.status(401).json({ error: 'Conta necessita ser recriada por razões de segurança. Registe-se novamente.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) return res.status(401).json({ error: 'Credenciais inválidas.' });

      const jwtToken = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
      // Don't send password hash back to client
      const { password: _, ...safeUser } = user;
      res.json({ token: jwtToken, user: safeUser });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erro interno na autenticação.' });
  }
});

app.post('/api/auth/google', authLimiter, async (req, res) => {
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const { sub, email, name, picture } = ticket.getPayload();
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (user) {
        const jwtToken = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token: jwtToken, user });
      } else {
        db.run('INSERT INTO users (email, name, google_id, picture) VALUES (?, ?, ?, ?)', [email, name, sub, picture], function(err) {
          const jwtToken = jwt.sign({ id: this.lastID, email }, SECRET_KEY, { expiresIn: '7d' });
          res.json({ token: jwtToken, user: { id: this.lastID, email, name, picture } });
        });
      }
    });
  } catch (error) { res.status(401).json({ error: 'Google auth failed' }); }
});

// ========== AUTH MIDDLEWARE ==========
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, SECRET_KEY);
    next();
  } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
};

// ========== CV ROUTES ==========
app.get('/api/cvs', authenticate, (req, res) => {
  db.all('SELECT * FROM cvs WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(row => ({ ...row, data: JSON.parse(row.data) })));
  });
});

app.post('/api/cvs', authenticate, (req, res) => {
  const { title, data } = req.body;
  db.run('INSERT INTO cvs (user_id, title, data) VALUES (?, ?, ?)', [req.user.id, title, JSON.stringify(data)], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, data });
  });
});

app.put('/api/cvs/:id', authenticate, (req, res) => {
  const { title, data } = req.body;
  db.run('UPDATE cvs SET title = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', 
    [title, JSON.stringify(data), req.params.id, req.user.id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete('/api/cvs/:id', authenticate, (req, res) => {
  db.run('DELETE FROM cvs WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ========== COVER LETTER ROUTES ==========
app.get('/api/letters', authenticate, (req, res) => {
  db.all('SELECT * FROM cover_letters WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(row => ({ ...row, content: JSON.parse(row.content) })));
  });
});

app.post('/api/letters', authenticate, (req, res) => {
  const { title, content } = req.body;
  db.run('INSERT INTO cover_letters (user_id, title, content) VALUES (?, ?, ?)', 
    [req.user.id, title, JSON.stringify(content)], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, title, content });
    }
  );
});

app.delete('/api/letters/:id', authenticate, (req, res) => {
  db.run('DELETE FROM cover_letters WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.get('/api/letters/:id', authenticate, (req, res) => {
  db.get('SELECT * FROM cover_letters WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Letter not found' });
    res.json({ ...row, content: JSON.parse(row.content) });
  });
});

// ========== AI ROUTES ==========
app.post('/api/ai/review', authenticate, aiLimiter, async (req, res) => {
  try {
    const { cvGerado } = req.body;
    const stringData = JSON.stringify(cvGerado, null, 2);
    const prompt = buildReviewPrompt(stringData);
    const reviewResult = await chamarIA(prompt);
    res.json(reviewResult);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/ai/generate-cover-letter', authenticate, aiLimiter, async (req, res) => {
  try {
    const { dados, vaga, empresa } = req.body;
    console.log(`[AI] Generating Letter for: ${empresa || 'Candidatura'}`);
    
    if (!dados) return res.status(400).json({ error: 'Dados do CV ou Perfil são necessários.' });
    
    const prompt = buildCartaPrompt(dados, vaga, empresa);
    const result = await chamarIA(prompt);
    
    console.log(`[AI] Generation Success`);
    res.json(result);
  } catch (error) { 
    console.error(`[AI ERROR] Letter Generation:`, error.message);
    res.status(500).json({ error: `IA falhou ao redigir: ${error.message}` }); 
  }
});

app.post('/api/ai/import', authenticate, aiLimiter, async (req, res) => {
  try {
    const { text, autoSummary, modelId } = req.body;
    if (!text) return res.status(400).json({ error: 'Texto é obrigatório.' });
    if (text.length > 50000) return res.status(400).json({ error: 'Texto demasiado longo (máx. 50.000 caracteres).' });
    console.log(`[AI] Importing CV text (${text.length} chars) for model: ${modelId || 'moderno'}`);
    const prompt = buildImportPrompt(text, autoSummary, modelId);
    const result = await chamarIA(prompt);
    console.log(`[AI] Import Success — Name: ${result.name || '?'}`);
    res.json(result);
  } catch (error) {
    console.error(`[AI ERROR] Import:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// ========== START SERVER ==========
app.listen(PORT, () => {
  console.log(`=== CV Studio Backend ===`);
  console.log(`Server running on http://localhost:${PORT}`);
});
