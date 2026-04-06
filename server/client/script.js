class NetflixClone {
    constructor() {
        this.token = localStorage.getItem('token') || null;
        this.userRole = localStorage.getItem('userRole') || null;
        this.email = localStorage.getItem('userEmail') || null;
        this.movies = [];
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadMovies();  // Cargar PRIMERO
        if (this.token) this.checkAuth();
        this.updateHero();  // Hero dinámico
    }

    // ✅ Hero SOLO IMAGEN (sin video hasta login)
    updateHero() {
        if (this.movies.length > 0 && this.token) {
            // Solo video si logueado
            const heroVideo = document.getElementById('heroVideo');
            heroVideo.src = `http://localhost:5000${this.movies[0].videoUrl}`;
            heroVideo.play();
        } else {
            // Imagen hasta login
            document.querySelector('.hero video').style.display = 'none';
            document.querySelector('.hero-content h1').textContent = 'Netflix Clone';
            document.querySelector('.hero-content p').textContent = 'Inicia sesión para miles de películas';
        }
    }

    bindEvents() {
        document.getElementById('loginBtn').onclick = () => this.showLoginModal();
        document.getElementById('loginForm').onsubmit = (e) => this.login(e);
        document.getElementById('logoutBtn').onclick = () => this.logout();
        document.getElementById('adminBtn').onclick = () => this.toggleAdminPanel();
        document.getElementById('movieForm').onsubmit = (e) => this.addMovie(e);
        
        document.querySelector('.close').onclick = () => this.hideLoginModal();
        document.querySelector('.player-close').onclick = () => this.closePlayer();
    }

    closePlayer() {
        const modal = document.getElementById('playerModal');
        const player = document.getElementById('player');
        
        modal.style.display = 'none';
        player.pause();
        player.currentTime = 0;
        player.src = '';
    }

    async apiCall(endpoint, options = {}) {
        const config = { method: options.method || 'GET' };
        
        if (options.body instanceof FormData) {
            config.body = options.body;
        } else if (options.body) {
            config.headers = { 'Content-Type': 'application/json' };
            config.body = JSON.stringify(options.body);
        }

        const response = await fetch(`http://localhost:5000${endpoint}`, config);
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error.includes('"error"') ? JSON.parse(error).error : 'Error servidor');
        }
        
        return response.json();
    }

    showLoginModal() { document.getElementById('loginModal').style.display = 'block'; }
    hideLoginModal() { document.getElementById('loginModal').style.display = 'none'; }

    async login(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const data = await this.apiCall('/api/auth/login', {
                method: 'POST',
                body: { email, password }
            });

            this.token = data.token;
            this.userRole = data.user.role;
            this.email = data.user.email;
            
            localStorage.setItem('token', this.token);
            localStorage.setItem('userRole', this.userRole);
            localStorage.setItem('userEmail', this.email);
            
            this.updateUI();
            this.hideLoginModal();
            this.loadMovies();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    // ✅ Event listeners para cerrar
    setupPlayerEvents() {
        const modal = document.getElementById('playerModal');
        const player = document.getElementById('player');
        
        // Click fuera del video
        modal.onclick = (e) => {
            if (e.target === modal) this.closePlayer();
        };
        
        // ESC key
        document.onkeydown = (e) => {
            if (e.key === 'Escape') this.closePlayer();
        };
    }

    updateUI() {
        const logged = !!this.token;
        const admin = this.userRole === 'admin';
        
        document.getElementById('loginBtn').style.display = logged ? 'none' : 'inline-block';
        document.getElementById('logoutBtn').style.display = logged ? 'inline-block' : 'none';
        document.getElementById('adminBtn').style.display = admin ? 'inline-block' : 'none';
        document.getElementById('adminPanel').style.display = admin ? 'block' : 'none';
    }

    logout() {
        localStorage.clear();
        this.token = this.userRole = this.email = null;
        this.movies = [];
        this.updateUI();
        this.renderMovies();
    }

    toggleAdminPanel() {
        const panel = document.getElementById('adminPanel');
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    }

    async loadMovies() {
        try {
            this.movies = await this.apiCall('/api/movies');
            console.log(`📺 ${this.movies.length} películas cargadas`);
            this.renderMovies();
            this.updateHero();
        } catch (error) {
            console.error('Error movies:', error);
        }
    }

    // 🗑️ Eliminar película
    async deleteMovie(movieId) {
        if (confirm('🗑️ ¿Eliminar esta película?')) {
            try {
                await this.apiCall(`/api/movies/${movieId}`, {
                    method: 'DELETE',
                    body: { email: this.email }
                });
                
                this.movies = this.movies.filter(m => m._id !== movieId);
                this.renderMovies();
                alert('✅ Película eliminada');
            } catch (error) {
                alert('❌ ' + error.message);
            }
        }
    }

   // ✅ Render con botón DELETE (solo admin)
    renderMovies() {
        const grid = document.getElementById('moviesGrid');
        grid.innerHTML = this.movies.map(movie => `
            <div class="movie-card" style="position: relative;">
                ${this.userRole === 'admin' ? `
                    <button class="delete-btn" onclick="event.stopPropagation(); netflix.deleteMovie('${movie._id}')">🗑️</button>
                ` : ''}
                <img src="${movie.thumbnail}" alt="${movie.title}" 
                    onerror="this.src='https://via.placeholder.com/300x450/333/fff?text=No+Imagen'"
                    onclick="netflix.checkLoginAndPlay('${movie._id}')">
                <div class="movie-info">
                    <div class="movie-title">${movie.title}</div>
                    <div class="movie-year">${movie.year || ''} • ${movie.duration}</div>
                </div>
            </div>
        `).join('') || '<p>No hay películas</p>';
    }
    async addMovie(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        formData.append('email', this.email); // Para verificar admin

        try {
            const movie = await this.apiCall('/api/movies', {
                method: 'POST',
                body: formData
            });
            this.movies.push(movie);
            this.renderMovies();
            e.target.reset();
            alert(`🎬 "${movie.title}" agregada!`);
        } catch (error) {
            alert(error.message);
        }
    }

    // ✅ Click tarjeta SIEMPRE pide login
    checkLoginAndPlay(movieId) {
        const movie = this.movies.find(m => m._id === movieId);
        
        if (!this.token) {
            alert('🔐 Inicia sesión para reproducir');
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            this.showLoginModal();
            return false;
        }
        
        if (!movie.videoUrl) {
            alert('⏳ Video disponible pronto');
            return false;
        }
        
        this.playMovie(movie.videoUrl);
        return true;
    }

    playMovie(videoUrl) {
        const player = document.getElementById('player');
        const modal = document.getElementById('playerModal');
        
        player.src = `http://localhost:5000${videoUrl}`;
        modal.style.display = 'block';
        
        player.onloadedmetadata = () => {
            player.play().catch(e => console.log('Autoplay bloqueado'));
        };
    }
}

const netflix = new NetflixClone();

// Hero dinámico
document.addEventListener('DOMContentLoaded', () => {
    if (netflix.movies.length > 0) {
        const heroVideo = document.getElementById('heroVideo');
        heroVideo.src = `http://localhost:5000${netflix.movies[0].videoUrl}`;
        document.getElementById('heroTitle').textContent = netflix.movies[0].title;
    }
});

