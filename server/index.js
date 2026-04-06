const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors({
    origin: ['http://localhost:5000', 'https://netflix-clone-mio-abc.onrender.com'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Frontend
app.use(express.static(path.join(__dirname, 'client')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'client', 'index.html')));

// Carpeta uploads
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// USUARIOS
const users = [
    { id: 1, email: 'admin@netflix.com', password: 'admin123', role: 'admin' },
    { id: 2, email: 'usuario1@netflix.com', password: '123', role: 'user' },
    { id: 3, email: 'usuario2@netflix.com', password: '123', role: 'user' }
];

// Películas
let movies = [];

// Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// LOGIN SIMPLE
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        console.log(`🔐 [${user.role}] ${email}`);
        res.json({ 
            token: `token_${user.id}`, 
            user: { email: user.email, role: user.role } 
        });
    } else {
        res.status(401).json({ error: 'Credenciales incorrectas' });
    }
});

// GET PELÍCULAS
app.get('/api/movies', (req, res) => {
    res.json(movies);
});

// ADD PELÍCULA - SOLO ADMIN
app.post('/api/movies', upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]), (req, res) => {
    // Verificar admin por email en form
    const email = req.body.email;
    const user = users.find(u => u.email === email && u.role === 'admin');
    
    if (!user) {
        return res.status(403).json({ error: 'Solo admins pueden agregar películas' });
    }
    
    const movie = {
        _id: Date.now().toString(),
        title: req.body.title || 'Sin título',
        description: req.body.description || '',
        year: req.body.year || 2024,
        duration: req.body.duration || '',
        type: req.body.type || 'movie',
        thumbnail: req.files?.thumbnail?.[0] ? `/uploads/${req.files.thumbnail[0].filename}` : 'https://via.placeholder.com/300x450/333/fff?text=No+Imagen',
        videoUrl: req.files?.video?.[0] ? `/uploads/${req.files.video[0].filename}` : ''
    };
    
    movies.push(movie);
    console.log(`✅ [ADMIN] ${movie.title}`);
    res.json(movie);
});

// 🎥 PELÍCULAS REALES (sin video hasta login)
if (movies.length === 0) {
    movies = [
        {
            _id: '1',
            title: 'Avengers: Endgame',
            year: 2019,
            duration: '3h 1m',
            type: 'movie',
            thumbnail: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTPzoqyfqzocJm7NifBEEfPtCCM1b7rsUxW7kMqlhM5C6gKGhNA',
            videoUrl: 'https://youtu.be/eRXMdJoXRGQ?si=gQde5NrLSjQJNlw0'  // Vacío → pide login
        },
        {
            _id: '2',
            title: 'The Godfather',
            year: 1972,
            duration: '2h 55m',
            type: 'movie',
            thumbnail: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTPzoqyfqzocJm7NifBEEfPtCCM1b7rsUxW7kMqlhM5C6gKGhNA',
            videoUrl: 'https://youtu.be/eRXMdJoXRGQ?si=gQde5NrLSjQJNlw0'
        },
        {
            _id: '3',
            title: 'Breaking Bad S1',
            year: 2008,
            duration: '47m/ep',
            type: 'series',
            thumbnail: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTPzoqyfqzocJm7NifBEEfPtCCM1b7rsUxW7kMqlhM5C6gKGhNA',
            videoUrl: 'https://youtu.be/eRXMdJoXRGQ?si=gQde5NrLSjQJNlw0'
        }
    ];
    console.log('🎬 Catálogo real cargado');
}

// 🗑️ ELIMINAR PELÍCULA - SOLO ADMIN
app.delete('/api/movies/:id', (req, res) => {
    const email = req.body.email;
    const user = users.find(u => u.email === email && u.role === 'admin');
    
    if (!user) {
        return res.status(403).json({ error: 'Solo admins pueden eliminar' });
    }
    
    const initialLength = movies.length;
    movies = movies.filter(movie => movie._id !== req.params.id);
    
    if (movies.length < initialLength) {
        console.log(`🗑️ [ADMIN] Eliminó película`);
        res.json({ message: 'Película eliminada' });
    } else {
        res.status(404).json({ error: 'Película no encontrada' });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log('\n🚀 NETFLIX MULTI-USUARIO');
    console.log('📱 http://localhost:' + PORT);
    console.log('👑 ADMIN: admin@netflix.com / admin123');
    console.log('👤 USER: usuario1@netflix.com / 123');
    console.log('\n');
});