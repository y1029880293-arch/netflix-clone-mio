const express = require('express');
const multer = require('multer');
const Movie = require('../models/Movie');
const router = express.Router();

// Configurar multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// GET todas las películas/series
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST nueva película/serie
router.post('/', upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const movieData = {
      ...req.body,
      thumbnail: req.files.thumbnail ? `/uploads/${req.files.thumbnail[0].filename}` : '',
      videoUrl: req.files.video ? `/uploads/${req.files.video[0].filename}` : ''
    };

    const movie = new Movie(movieData);
    await movie.save();
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE película
router.delete('/:id', async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.json({ message: 'Película eliminada' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;