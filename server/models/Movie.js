const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  year: Number,
  genre: [String],
  duration: String,
  rating: { type: Number, default: 0 },
  thumbnail: String,
  videoUrl: String,
  type: { type: String, enum: ['movie', 'series'], default: 'movie' },
  seasons: [{
    number: Number,
    episodes: [{
      title: String,
      videoUrl: String,
      duration: String
    }]
  }]
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);