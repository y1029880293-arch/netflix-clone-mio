const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = jwt.sign({ email }, 'netflix_secret_key', { expiresIn: '7d' });
    res.json({ token, user: { email } });
  } catch (error) {
    res.status(500).json({ error: 'Error en registro' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'demo@netflix.com' && password === 'demo123') {
    const token = jwt.sign({ email }, 'netflix_secret_key', { expiresIn: '7d' });
    res.json({ token, user: { email: 'demo@netflix.com' } });
  } else {
    res.status(401).json({ error: 'Credenciales inválidas' });
  }
});

module.exports = router;